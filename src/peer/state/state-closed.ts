import { EventCloseConn, EventPutToChannel, EventRespondAfterGuard } from "../../event";
import { Segment, SegmentHeader } from "../../segment";
import { ConnectionState } from "../connection-state";
import { Endpoint } from "../endpoint";
import { Peer } from "../peer";
import { State } from "./state";
import { StateSynSent } from "./state-syn-sent";


export class StateClosed extends State {
    public type(): ConnectionState {
        return ConnectionState.CLOSED;
    }

    public processSegmentForSend(destination: Endpoint): Segment[] {
        const header = new SegmentHeader(this.context.ctrlBlock.srcEndpoint, destination);
        const segment: Segment = new Segment(header, []);

        if(!this.context.ctrlBlock.sender.iss) {
            this.context.ctrlBlock.sender.iss = this.context.randomISN();
            this.context.sendBuffer.setDataOffset(this.context.ctrlBlock.sender.iss+1);
        }
        
        this.context.ctrlBlock.sender.sndUna = this.context.ctrlBlock.sender.iss+1;
        this.context.ctrlBlock.sender.sndNxt = this.context.ctrlBlock.sender.sndUna;

        this.context.ctrlBlock.receiver.rcvWnd = Math.min(this.context.maxAnnouncableWindow, this.context.recvBuffer.capacity);

        segment.withSequenceNumber(this.context.ctrlBlock.sender.iss);
        segment.withWindowAnnouncement(Math.min(this.context.maxAnnouncableWindow, this.context.recvBuffer.capacity));
        segment.withSynEstablishment();

        this.context.transitionTo(new StateSynSent());

        this.restartTimeout();
                    
        return [segment];
    }

    public processSegmentForReceiving(segment: Segment): Error|null {
        const ip = this.context.ctrlBlock.srcEndpoint.ip;
        const port = this.context.ctrlBlock.srcEndpoint.port;
        return new Error(`peer with ip:port ${ip}:${port} is closed, cannot receive ip traffic`);
    }
}