import { Peer } from "../peer";
import { SimEventType, SimulationEvent } from "./event";

export class EventTimeout extends SimulationEvent {
    public readonly createdTime: Date;
    private _peer: Peer;

    public constructor(createdTime: Date, executionTime: Date, peer: Peer) {
        super(executionTime);
        this.createdTime = createdTime;
        this._peer = peer;
    }

    public type(): SimEventType {
        return SimEventType.TIMEOUT;
    }

    public execute(): void {
        this._peer.ctrlBlock.sender.sndNxt = this._peer.ctrlBlock.sender.sndUna; //reset send window

        //DEBUG
        console.log("TIMEOUT: Soy ", this._peer.ctrlBlock.srcEndpoint.ip);

        const err = this._peer.prepareSendSegments(); //TODO: handle error
        this._peer.ctrlBlock.timeoutExpired = true;
    }
}