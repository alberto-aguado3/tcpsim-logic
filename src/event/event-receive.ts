import { Channel } from "../channel";
import { Peer } from "../peer";
import { Segment } from "../segment";
import { SimEventType, SimulationEvent } from "./event";

export class EventReceive extends SimulationEvent {
    private _receiver: Peer;
    private _segment: Segment;
    private _channel: Channel;

    public constructor(executionTime: Date, segment: Segment, receiver: Peer, channel: Channel) {
        super(executionTime);
        this._receiver = receiver;
        this._segment = segment;
        this._channel = channel;
    }

    public type(): SimEventType {
        return SimEventType.RECEIVE;
    }
    
    public execute(): void {
        this._receiver.receiveSegment(this._segment);

        this._channel.moveToDelivered(this._segment.id, this._executionTime);
    }
}