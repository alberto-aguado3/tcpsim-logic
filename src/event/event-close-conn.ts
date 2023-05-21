import { Peer } from "../peer";
import { StateClosed } from "../peer/state";
import { SimEventType, SimulationEvent } from "./event";

export class EventCloseConn extends SimulationEvent {
    private _caller: Peer;

    constructor(executionTime: Date, caller: Peer) {
        super(executionTime);
        this._caller = caller;
    }

    public type(): SimEventType {
        return SimEventType.CLOSE_CONN;
    }
    
    public execute(): void {
        this._caller.transitionTo(new StateClosed());
    }
}