import { Peer } from "../peer";
import { Segment } from "../segment";
import { SimEventType, SimulationEvent } from "./event";

export class EventReceive extends SimulationEvent {
    private _receiver: Peer;
    private _segment: Segment;

    public constructor(executionTime: Date, segment: Segment, receiver: Peer) {
        super(executionTime);
        this._receiver = receiver;
        this._segment = segment;
    }

    public type(): SimEventType {
        return SimEventType.RECEIVE;
    }
    
    public execute(): void {
        this._receiver.receiveSegment(this._segment);
    }
}