import { EventCloseConn, EventPutToChannel, EventRespondAfterGuard, SimEventType } from "../../event";
import { Segment } from "../../segment";
import { ConnectionState } from "../connection-state";
import { Endpoint } from "../endpoint";
import { Peer } from "../peer";
import { State } from "./state";
import { StateSynReceived } from "./state-syn-received";


export class StateListen extends State {

    public type(): ConnectionState {
        return ConnectionState.LISTEN;
    }

    public processSegmentForSend(destination: Endpoint): Segment[] {       
        console.log("error: cannot send segments when in listen mode");
        return [];
    }

    public processSegmentForReceiving(segment: Segment): Error|null {
        if (!segment.controlBits.syn) {
            return new Error("Did not start handshake correctly, missing SYN bit");
        }

        if (this.context.ctrlBlock.sender.iss == undefined) {
            this.context.ctrlBlock.sender.iss = this.context.randomISN();
            this.context.sendBuffer.setDataOffset(this.context.ctrlBlock.sender.iss+1);
        }

        this.context.sendBuffer.capacity = segment.window;

        this.context.ctrlBlock.sender.sndUna = this.context.ctrlBlock.sender.iss+1;
        this.context.ctrlBlock.sender.sndNxt = this.context.ctrlBlock.sender.sndUna;

        //TODO: revisar que sea equivalente (ver pseudocodigo para version original completa)
        this.context.ctrlBlock.sender.sndWnd = segment.window;
        this.context.ctrlBlock.receiver.rcvNxt = segment.seqNumber+1;
        this.context.recvBuffer.setDataOffset(segment.seqNumber+1);


        this.context.ctrlBlock.receiver.rcvWnd = Math.min(this.context.maxAnnouncableWindow, this.context.recvBuffer.capacity);

        this.context.transitionTo(new StateSynReceived());

        this.restartEventRespondAfterGuard();        
        return null;
    }
}