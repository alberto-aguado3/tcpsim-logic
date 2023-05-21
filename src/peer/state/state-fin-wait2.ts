import { EventCloseConn, EventPutToChannel, EventRespondAfterGuard, EventTimeout, SimEventType } from "../../event";
import { Segment, SegmentHeader } from "../../segment";
import { ConnectionState } from "../connection-state";
import { Endpoint } from "../endpoint";
import { Peer } from "../peer";
import { State } from "./state";
import { StateCloseWait } from "./state-close-wait";
import { StateFinWait1 } from "./state-fin-wait1";
import { StateTimeWait } from "./state-time-wait";


export class StateFinWait2 extends State {
    public type(): ConnectionState {
        return ConnectionState.FIN_WAIT2;
    }

    public processSegmentForSend(destination: Endpoint): Segment[] {
        const header = new SegmentHeader(this.context.ctrlBlock.srcEndpoint, destination);
        const segment: Segment = new Segment(header, []);    

        segment.withAcknowledgement(this.context.ctrlBlock.receiver.rcvNxt);
        segment.withSequenceNumber(this.context.ctrlBlock.sender.sndNxt);

        segment.withWindowAnnouncement(Math.min(this.context.maxAnnouncableWindow, this.context.ctrlBlock.receiver.rcvWnd));

        //TODO: this should not include FIN, but if both ESTABLISHED, one sends FIN and goes to FIN-WAIT1, and it gets lost, the other will
        //reply with 
        
        return [segment];
    }

    public processSegmentForReceiving(segment: Segment): Error|null {
        const ctrlBlock = this.context.ctrlBlock;
        if (!this.context.isSequenceNumberAcceptable(segment)) {
            //TODO: If an incoming segment is not acceptable, an acknowledgment should be sent in reply
            this.context.logger?.warn(this.context.logWithAuthorAndTimestamp(
                `Sequence number ${segment.seqNumber} not acceptable, receiving window is [${ctrlBlock.receiver.rcvNxt}, ${ctrlBlock.receiver.rcvNxt+ctrlBlock.receiver.rcvWnd}`
                ));
            //DEBUG
            console.log(`FIN-WAIT2 - Sequence number ${segment.seqNumber} not acceptable, receiving window is [${ctrlBlock.receiver.rcvNxt}, ${ctrlBlock.receiver.rcvNxt+ctrlBlock.receiver.rcvWnd}`);
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


        //TODO: ver en este "if", si también pasas antes a estado Fin-Wait1, se sigue un flujo de estados correcto??
        if (segment.controlBits.fin) {
            this.context.transitionTo(new StateTimeWait());
            this.context.osRead();
            //this.context.recvBuffer.flush();
        }

        this.restartEventRespondAfterGuard();
        return null;
    }
}