import { EventCloseConn, EventPutToChannel, EventRespondAfterGuard, EventTimeout, SimEventType } from "../../event";
import { Segment, SegmentHeader } from "../../segment";
import { ConnectionState } from "../connection-state";
import { Endpoint } from "../endpoint";
import { Peer } from "../peer";
import { State } from "./state";
import { StateCloseWait } from "./state-close-wait";
import { StateFinWait2 } from "./state-fin-wait2";


export class StateFinWait1 extends State {
    public type(): ConnectionState {
        return ConnectionState.FIN_WAIT1;
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

        segmentsToSend.at(-1)?.withFin();
        return segmentsToSend;
        }

    public processSegmentForReceiving(segment: Segment): Error|null {
        const ctrlBlock = this.context.ctrlBlock;
        if (!this.context.isSequenceNumberAcceptable(segment)) {
            //TODO: If an incoming segment is not acceptable, an acknowledgment should be sent in reply
            this.context.logger?.warn(this.context.logWithAuthorAndTimestamp(
                `Sequence number ${segment.seqNumber} not acceptable, receiving window is [${ctrlBlock.receiver.rcvNxt}, ${ctrlBlock.receiver.rcvNxt+ctrlBlock.receiver.rcvWnd}`
                ));
                //DEBUG
            //console.log(`FIN-WAIT1 - Sequence number ${segment.seqNumber} not acceptable, receiving window is [${ctrlBlock.receiver.rcvNxt}, ${ctrlBlock.receiver.rcvNxt+ctrlBlock.receiver.rcvWnd}`);
            this.context.respondWithAck(segment.source);
            if (this.context.events.getEventsByType(SimEventType.TIMEOUT).length > 0) {
                this.restartTimeout();
            }
            return null;
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
            this.readSegmentPayload(segment);
        }


        //TODO: ver en este "if", si también pasas antes a estado Fin-Wait1, se sigue un flujo de estados correcto?? Esto es cierre simultaneo...
        if (segment.controlBits.fin) {
            //this.context.transitionTo(new StateCloseWait());
            this.context.osRead();
            //this.context.recvBuffer.flush();
            //return null;
        }

        //Si no quedan bytes pendientes por enviar, pasar a FIN-WAIT2
        const unaIndex = this.context.sendBuffer.removeOffsetToNumber(this.context.ctrlBlock.sender.sndUna);
        //if (this.context.sendBuffer.firstEmptyCell() >= unaIndex) {
        if (segment.ackNumber === this.context.ctrlBlock.sender.sndUna) {
            this.context.transitionTo(new StateFinWait2());
        }
        

        this.restartEventRespondAfterGuard();
        return null;
    }
}