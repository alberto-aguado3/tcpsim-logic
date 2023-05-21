import { Endpoint } from "../peer/endpoint";
import { ControlBits } from "./control-bits";

export class SegmentHeader {
    public seqNumber: number = 0;
    public ackNumber: number = 0;
    public controlBits: ControlBits = new ControlBits();
    private _announcedWndw: number = 0;
    public readonly srcAddr: Endpoint;
    public readonly dstAddr: Endpoint;

    constructor(source: Endpoint, destination: Endpoint) {
        this.srcAddr = source;
        this.dstAddr = destination;
    }

    public get window() {
        return this._announcedWndw;
    }

    public set window(win: number) {
        if (win < 0) {
            throw new RangeError(`Window must be positive number, got ${win}`);
        }
        this._announcedWndw = win;
    }
}