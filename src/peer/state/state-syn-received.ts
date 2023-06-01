import { SimEventType } from "../../event";
import { Segment, SegmentHeader } from "../../segment";
import { ConnectionState } from "../connection-state";
import { Endpoint } from "../endpoint";
import { State } from "./state";
import { StateEstablished } from "./state-established";


export class StateSynReceived extends State {
    public type(): ConnectionState {
        return ConnectionState.SYN_RECEIVED;
    }

    public processSegmentForSend(destination: Endpoint): Segment[] {
        const header = new SegmentHeader(this.context.ctrlBlock.srcEndpoint, destination);
        const segment: Segment = new Segment(header, []);    

        segment.withSequenceNumber(this.context.ctrlBlock.sender.sndNxt);
        segment.withAcknowledgement(this.context.ctrlBlock.receiver.rcvNxt);
        segment.withWindowAnnouncement(Math.min(this.context.maxAnnouncableWindow, this.context.recvBuffer.capacity));
        segment.withSynEstablishment();

        this.restartTimeout();
        
        return [segment];
    }

    public processSegmentForReceiving(segment: Segment): Error|null {
        if (!segment.controlBits.ack) {
            if (segment.controlBits.syn) { //if he sends only SYN, it means the 2nd segment was lost.
                this.context.events.removeFirstEventByType(SimEventType.TIMEOUT);

                this.restartEventRespondAfterGuard();
                return null;
            } else {
                return new Error("no ACK received");
            }
            
        }

        //TODO: comprobar que esto tal cual sea correcto
        //TODO: review, it was sndUna < ackNumber <= sndnxt
        //if (!(this.context.ctrlBlock.sender.sndUna < segment.ackNumber && segment.ackNumber <= this.context.ctrlBlock.sender.sndNxt)) {
        if (!(this.context.ctrlBlock.sender.sndUna >= segment.ackNumber && segment.ackNumber <= this.context.ctrlBlock.sender.sndNxt)) {
            this.context.respondWithRst(segment.source);
            return new Error(`ack number ${segment.ackNumber} not in valid interval [${this.context.ctrlBlock.sender.sndUna}, ${this.context.ctrlBlock.sender.sndNxt})`);
        }

        this.context.ctrlBlock.sender.sndWnd = segment.window;
        this.context.ctrlBlock.sender.sndWl1 = segment.seqNumber;
        this.context.ctrlBlock.sender.sndWl2 = segment.ackNumber;

        if (segment.payload.length > 0) {
            this.readSegmentPayload(segment);
        }

        this.context.osWrite();

        this.context.transitionTo(new StateEstablished());
        this.context.events.removeFirstEventByType(SimEventType.TIMEOUT);

        this.restartEventRespondAfterGuard();
        return null;
    }
}