import { EventCloseConn, EventPutToChannel, EventRespondAfterGuard, SimEventType } from "../../event";
import { Segment, SegmentHeader } from "../../segment";
import { ConnectionState } from "../connection-state";
import { Endpoint } from "../endpoint";
import { Peer } from "../peer";
import { State } from "./state";


export class StateTimeWait extends State {
    public type(): ConnectionState {
        return ConnectionState.TIME_WAIT;
    }

    public processSegmentForSend(destination: Endpoint): Segment[] {
        const header = new SegmentHeader(this.context.ctrlBlock.srcEndpoint, destination);
        const segment: Segment = new Segment(header, []);    

        segment.withAcknowledgement(this.context.ctrlBlock.receiver.rcvNxt);
        
        const execTime = this.context.absSimulationTime.getTime() + 2*this.context.msl;
        const eventCloseConn = new EventCloseConn(new Date(execTime), this.context);

        this.restartCloseConn();
        return [segment];
    }

    public processSegmentForReceiving(segment: Segment): Error|null {
        if (segment.payload.length > 0) {
            console.log("Payload ignored");
        }

        //other peer waiting for last response (in state last-ack) did not receive our last ACK message. We will retransmit.
        this.restartEventRespondAfterGuard();
        return null;
    }
}