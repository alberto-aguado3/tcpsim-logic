import { Endpoint } from "../peer/endpoint";

export type PeerConfig = {
    endpoint?: Endpoint,
    mss?: number,
    msl?: number,
    maxAnnounceableWindow?: number,
    recvBuffCapacity?: number,
    timeToProcessSegment?: number,
    timeGuardBeforeTransmitting?: number,

    applicationData?: string,
}

export type ChannelConfig = {
    rtt: number,
    lossPercent: number,
    variance?: number,
}

export class SimConfig {
    public active: PeerConfig;
    public passive: PeerConfig;
    public channel: ChannelConfig;

    constructor(activePeer: PeerConfig, passivePeer: PeerConfig, channel: ChannelConfig){
        this.active = activePeer;
        this.passive = passivePeer;
        this.channel = channel;
    }
}
