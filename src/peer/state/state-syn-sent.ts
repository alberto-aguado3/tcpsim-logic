import { EventCloseConn, EventPutToChannel, EventRespondAfterGuard, SimEventType } from "../../event";
import { Segment, SegmentHeader } from "../../segment";
import { ConnectionState } from "../connection-state";
import { Endpoint } from "../endpoint";
import { Peer } from "../peer";
import { State } from "./state";
import { StateEstablished } from "./state-established";


export class StateSynSent extends State {
    public type(): ConnectionState {
        return ConnectionState.SYN_SENT;
    }

    public processSegmentForSend(destination: Endpoint): Segment[] {
        const header = new SegmentHeader(this.context.ctrlBlock.srcEndpoint, destination);
        const segment: Segment = new Segment(header, []);    

        if(!this.context.ctrlBlock.sender.iss) {
            this.context.ctrlBlock.sender.iss = this.context.randomISN();
        }
        
        this.context.ctrlBlock.sender.sndUna = this.context.ctrlBlock.sender.iss+1;
        this.context.ctrlBlock.sender.sndNxt = this.context.ctrlBlock.sender.sndUna;

        this.context.ctrlBlock.receiver.rcvWnd = Math.min(this.context.maxAnnouncableWindow, this.context.recvBuffer.capacity);

        segment.withSequenceNumber(this.context.ctrlBlock.sender.iss);
        segment.withWindowAnnouncement(Math.min(this.context.maxAnnouncableWindow, this.context.recvBuffer.capacity));
        //TODO: revisar cuando 1 segmento al principio falla, si el cambio de closed a syn-sent tiene sentido tener activado bit SYN
        segment.withSynEstablishment();

        this.restartTimeout();
        
        return [segment];
    }

    public processSegmentForReceiving(segment: Segment): Error|null {
        if (!segment.controlBits.syn || !segment.controlBits.ack) {
            return new Error("three-way handshake not completed, missing either SYN or ACK bits");
        }

        //this.context.ctrlBlock.receiver.rcvNxt = segment.seqNumber+1;
        this.context.ctrlBlock.receiver.rcvNxt = segment.seqNumber;

        this.context.sendBuffer.capacity = segment.window;

        //if (this.context.ctrlBlock.sender.sndUna == segment.ackNumber) {
        if (this.context.ctrlBlock.sender.sndUna < segment.ackNumber) {
            this.context.respondWithRst(segment.source);
            return new Error(`expected ${this.context.ctrlBlock.sender.sndUna} as ackNumber, but got ${segment.ackNumber}`);
        }

        //TODO: revisar que sea equivalente (ver pseudocodigo para version original completa)
        this.context.ctrlBlock.sender.sndWnd = segment.window;
        this.context.recvBuffer.setDataOffset(segment.seqNumber);

        this.context.ctrlBlock.sender.sndWl1 = segment.seqNumber;
        this.context.ctrlBlock.sender.sndWl2 = segment.ackNumber;

        this.context.osWrite();

        this.context.transitionTo(new StateEstablished());
        this.context.events.removeFirstEventByType(SimEventType.TIMEOUT);
        this.restartEventRespondAfterGuard();
        return null;
    }
}