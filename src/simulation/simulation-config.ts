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

export type SimConfig =  {
    active: PeerConfig
    passive: PeerConfig
    channel: ChannelConfig
}
