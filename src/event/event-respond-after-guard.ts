import { Peer } from "../peer";
import { SimEventType, SimulationEvent } from "./event";
import { EventTimeout } from "./event-timeout";

export class EventRespondAfterGuard extends SimulationEvent {
    private _peer: Peer;

    public constructor(executionTime: Date, peer: Peer) {
        super(executionTime);
        this._peer = peer;
    }

    public type(): SimEventType {
        return SimEventType.RESPOND_AFTER_GUARD;
    }
    
    public execute(): void {
        const err = this._peer.prepareSendSegments();
        if (err !== null) {
            console.log(err.message);
        }
    }
}