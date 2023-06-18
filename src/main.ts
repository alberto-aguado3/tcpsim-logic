//import Simulation, {SimConfig, PeerConfig, ChannelConfig} from "./simulation/";
import { Peer } from "./peer";
import { PeerConfig, ChannelConfig, SimConfig, Simulation } from "./simulation";

const sharedMss = 10;
const sharedMaxAnnWindow = 10;
const sharedRcvBufCap = 10;

console.log("hello");


const activeCfg: PeerConfig = {
    applicationData: "Hello Amigos",
    mss: sharedMss,
    maxAnnounceableWindow: sharedMaxAnnWindow,
    recvBuffCapacity: sharedRcvBufCap,
    //timeGuardBeforeTransmitting:

};

console.log(activeCfg);

const passiveCfg: PeerConfig = {
    applicationData: "",
    mss: sharedMss,
    maxAnnounceableWindow: sharedMaxAnnWindow,
    recvBuffCapacity: sharedRcvBufCap,
};

const chanCfg: ChannelConfig = {
    lossPercent: 0,
    rtt: 2*1000, //2ms
};

const simCfg: SimConfig = new SimConfig(activeCfg, passiveCfg, chanCfg);

const simulator: Simulation = new Simulation(simCfg);

simulator.linkPeers();

let isDone: boolean = false;
while (!isDone) {
    isDone = simulator.runNextStep();
    const activePeer = simulator["activePeer"];
    const passivePeer = simulator["passivePeer"];
    console.log(`Active side: ${activePeer} | Passive side: ${passivePeer}`);
}

function ShowEvents (active: Peer, passive: Peer): void {
    console.log(`Active side: ${active.events["_events"]} | Passive side: ${passive.events["_events"]}`);
}
