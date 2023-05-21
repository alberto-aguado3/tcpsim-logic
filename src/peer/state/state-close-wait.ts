import { TerminationError } from "../../error";
import { EventCloseConn, EventPutToChannel, EventRespondAfterGuard, EventTimeout } from "../../event";
import { SimEventType } from "../../event/event";
import { Segment, SegmentHeader } from "../../segment";
import { ConnectionState } from "../connection-state";
import { Endpoint } from "../endpoint";
import { Peer } from "../peer";
import { State } from "./state";
import { StateLastAck } from "./state-last-ack";
import { StateSynReceived } from "./state-syn-received";


export class StateCloseWait extends State {
    public type(): ConnectionState {
        return ConnectionState.CLOSE_WAIT;
    }

    public processSegmentForSend(destination: Endpoint): Segment[] {  
        let header = new SegmentHeader(this.context.ctrlBlock.srcEndpoint, destination);
        let segment: Segment = new Segment(header, []);
        let segmentsToSend: Segment[] = [];

        this.context.ctrlBlock.sender.sndNxt = this.context.ctrlBlock.sender.sndUna;

        segment.withAcknowledgement(this.context.ctrlBlock.receiver.rcvNxt);
        segment.withSequenceNumber(this.context.ctrlBlock.sender.sndNxt);
        
        segment.withWindowAnnouncement(Math.min(this.context.maxAnnouncableWindow, this.context.ctrlBlock.receiver.rcvWnd));

        let bytesToSend = this.context.bytesAllowedForTransmission();

        if (bytesToSend > 0) {
            const dataToSend = this.context.sendBuffer.readChunk(this.context.ctrlBlock.sender.sndNxt, bytesToSend);
            this.context.ctrlBlock.sender.sndNxt = this.context.ctrlBlock.sender.sndNxt + bytesToSend;
            segment.withPayload(dataToSend);
        }
        
        segmentsToSend.push(segment);

        bytesToSend = this.context.bytesAllowedForTransmission();

        while (bytesToSend > 0) {
            header = new SegmentHeader(this.context.ctrlBlock.srcEndpoint, destination);
            segment = new Segment(header, []);
    
            segment.withAcknowledgement(this.context.ctrlBlock.receiver.rcvNxt);
            segment.withSequenceNumber(this.context.ctrlBlock.sender.sndNxt);
            segment.withWindowAnnouncement(Math.min(this.context.maxAnnouncableWindow, this.context.ctrlBlock.receiver.rcvWnd));
    
            const dataToSend = this.context.sendBuffer.readChunk(this.context.ctrlBlock.sender.sndNxt, bytesToSend);
            this.context.ctrlBlock.sender.sndNxt = this.context.ctrlBlock.sender.sndNxt + bytesToSend;
            segment.withPayload(dataToSend);
            
            segmentsToSend.push(segment);

            bytesToSend = this.context.bytesAllowedForTransmission();
        }

        //custom implementation: start connection close if no more application bytes to send
        if (this.context.application.dataToSend.length === 0 && this.context.ctrlBlock.sender.sndNxt === this.context.sendBuffer.firstEmptyCell()) {
            this.context.transitionTo(new StateLastAck());
            segmentsToSend.at(-1)?.withFin();
        }

        return segmentsToSend;
    }

    public processSegmentForReceiving(segment: Segment): Error|null {
        const ctrlBlock = this.context.ctrlBlock;
        if (!this.context.isSequenceNumberAcceptable(segment)) {
            //TODO: If an incoming segment is not acceptable, an acknowledgment should be sent in reply
            return new Error(`Sequence number ${segment.seqNumber} not acceptable, receiving window is [${ctrlBlock.receiver.rcvNxt}, ${ctrlBlock.receiver.rcvNxt+ctrlBlock.receiver.rcvWnd}`);
        }

        if (!segment.controlBits.ack) {
            //TODO: nunca pasará... responder con ack?? early return...
            this.context.respondWithAck(segment.source);
            this.context.logger?.warn(this.context.logWithAuthorAndTimestamp("did not receive ACK and it was expected"));
            return new Error("did not receive ACK and it was expected");
        }

        //try to advance sender window (advance SND.UNA)
        try {
            this.acknowledgeBytesFromSegment(segment);
        } catch (err: any) {
            return err;
        }

        //try to update sender window (SND.WND)
        this.updateSenderWindow(segment);

        if (segment.payload.length > 0) {
            this.context.logger?.warn(this.context.logWithAuthorAndTimestamp("Ignoring payload"));
        }

        if (segment.controlBits.fin) {
            this.context.logger?.warn(this.context.logWithAuthorAndTimestamp("Ignoring FIN"));
        }

        this.restartEventRespondAfterGuard();

        return null;
    }
}