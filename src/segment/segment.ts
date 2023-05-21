import { Endpoint } from "../peer/endpoint";
import { SegmentHeader } from "./segment-header";

export class Segment {
    private _header: SegmentHeader;
    private _payload: string[];

    constructor(header: SegmentHeader, payload: string[]) {
        this._header = header;
        this._payload = payload;
    }

    public withSynEstablishment(): void {
        this.controlBits.syn = true;
    }

    public withWindowAnnouncement(size: number): void {
        this.window = size;
    }

    public withSequenceNumber(seq: number): void {
        this.seqNumber = seq;
    }

    public withAcknowledgement(ack: number): void {
        this.controlBits.ack = true;
        this.ackNumber = ack;
    }

    public withFin(): void {
        this.controlBits.fin = true;
    }

    public withPayload(payload: string[]): void {
        this._payload = payload;
    }

    public withReset(): void {
        this.controlBits.rst = true;
    }

    public get payload(): string[] {
        return this._payload;
    }



    public get controlBits() {
        return this._header.controlBits;
    }

    public get seqNumber() {
        return this._header.seqNumber;
    }

    public set seqNumber(seq: number) {
        this._header.seqNumber = seq;
    }

    public get ackNumber() {
        return this._header.ackNumber;
    }

    public set ackNumber(ack: number) {
        this._header.ackNumber = ack;
    }

    public get window() {
        return this._header.window;
    }

    public set window(win: number) {
        this._header.window = win;
    }

    public get source(): Endpoint {
        return this._header.srcAddr;
    }

    public get destination(): Endpoint {
        return this._header.dstAddr;
    }
}