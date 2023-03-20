import { ControlBits } from "./control-bits";

export class SegmentHeader {
    private _seqNumber: number;
    private _ackNumber: number;
    private _controlBits: ControlBits;
    private _announcedWndw: number;

    constructor(seq: number, ack: number, wndw: number, bits: ControlBits) {
        if (wndw < 0) {
            throw new RangeError(`Window must be positive number, got ${wndw}`);
        }

        this._seqNumber = seq;
        this._ackNumber = ack;
        this._announcedWndw = wndw;
        this._controlBits = bits;
    }

    public get seqNumber() {
        return this._seqNumber;
    }

    public get ackNumber() {
        return this._ackNumber;
    }

    public get bits() {
        return this._controlBits;
    }

    public get window() {
        return this._announcedWndw;
    }
}