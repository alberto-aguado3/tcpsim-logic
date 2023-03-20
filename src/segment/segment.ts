import { SegmentHeader } from "./segment-header";

export class Segment {
    private _header: SegmentHeader;
    public readonly payload: string[];

    constructor(header: SegmentHeader, payload: string[]) {
        this._header = header;
        this.payload = payload;
    }

    public get controlBits() {
        return this._header.bits;
    }

    public get seqNumber() {
        return this._header.seqNumber;
    }

    public get ackNumber() {
        return this._header.ackNumber;
    }

    public get window() {
        return this._header.window;
    }
}