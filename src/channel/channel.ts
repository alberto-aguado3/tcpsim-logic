import { EventQueue, EventReceive, SimulationEvent } from "../event";
import { Peer } from "../peer";
import { Endpoint } from "../peer/endpoint";
import { Segment } from "../segment";

export class Channel {
    private _lossPercent: number;
    public readonly rtt: number;
    private _channelVariance: number;

    public readonly deliveredSegments: SegmentWithTimestamp[] = [];
    public readonly lostSegments: SegmentWithTimestamp[] = [];

    public events: EventQueue = new EventQueue();
    private _peerRegistry: Map<Endpoint, Peer> = new Map<Endpoint, Peer>();


    constructor(lossPercent: number, rtt: number, channelVariance: number = 0) {
        this._lossPercent = lossPercent;
        this.rtt = rtt;
        this._channelVariance = channelVariance;
    }

    public applyLossEffect(segment: Segment): Segment | null {
        const randomNum = Math.random();
        const lossThreshold = this._lossPercent / 100;

        if (randomNum < lossThreshold) {
            console.log("Se desintegra segmento from ", segment.source.ip, " to ", segment.destination.ip);
            return null;
        }

        return segment;
    }

    public randomGaussianEvent(mean: number = 0): number {
        let u = 0, v = 0;
        while (u === 0) u = Math.random(); //random variable which is not 0
        while (v === 0) v = Math.random();

        const indepRandVar = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2* Math.PI * v); //Box-Muller transform
        return indepRandVar * Math.sqrt(this._channelVariance) + mean;
    }

    public registerPeer(peer: Peer): void {
        const peerEndpoint = peer.ctrlBlock.srcEndpoint;
        this._peerRegistry.set(peerEndpoint, peer);
    }

    public routeByEndpoint(endpoint: Endpoint): Peer|null {
        const destPeer = this._peerRegistry.get(endpoint);
        if (destPeer === undefined) {
            return null;
        }
        return destPeer;
    }

    public addLostSegment(segment: Segment, timestamp: Date): void {
        const segmentWithDate: SegmentWithTimestamp = {
            segment: segment,
            date: timestamp,
        };

        this.sortedInsertByDate(segmentWithDate, this.lostSegments);
    }

    public addDeliveredSegment(segment: Segment, timestamp: Date): void {
        const segmentWithDate: SegmentWithTimestamp = {
            segment: segment,
            date: timestamp,
        };

        this.sortedInsertByDate(segmentWithDate, this.deliveredSegments);
    }

    private sortedInsertByDate(newSegment: SegmentWithTimestamp, arr: SegmentWithTimestamp[]): void {
        const index = arr.findIndex(segment => segment.date > newSegment.date);
        if (index === -1) {
            arr.push(newSegment);
        } else {
            arr.splice(index, 0, newSegment);
        }
    }

}

export type SegmentWithTimestamp = {
    segment: Segment,
    date: Date,
}