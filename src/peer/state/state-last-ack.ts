import { EventCloseConn, EventPutToChannel, EventRespondAfterGuard, SimEventType } from "../../event";
import { Segment, SegmentHeader } from "../../segment";
import { ConnectionState } from "../connection-state";
import { Endpoint } from "../endpoint";
import { Peer } from "../peer";
import { State } from "./state";
import { StateClosed } from "./state-closed";


export class StateLastAck extends State {
    public type(): ConnectionState {
        return ConnectionState.LAST_ACK;
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
        let err: Error|null = null;
        if (!segment.ackNumber) {
            err = new Error("Did not receive an ACK upon last closing step. Still closing connection...");
        }
        this.context.transitionTo(new StateClosed()); 

        //TODO: remove, should not delete eventTimeouts here.
        this.context.events.removeFirstEventByType(SimEventType.TIMEOUT);

        return null;
    }
}