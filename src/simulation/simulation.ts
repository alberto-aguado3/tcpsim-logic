import { Channel } from "../channel";
import { EventQueue, SimulationEvent } from "../event";
import { Peer } from "../peer";
import { ConnectionState } from "../peer/connection-state";
import { PeerBuilder } from "../peer/peer-builder";
import { SimLogger } from "./logger";
import { SimConfig } from "./simulation-config";
import { TimeNotifier } from "./time-notifier";

export class Simulation {
    public readonly activePeer: Peer;
    public readonly passivePeer: Peer;
    public readonly channel: Channel;
    private _simulationClock: TimeNotifier = new TimeNotifier(new Date(0));
    private _logger: SimLogger = new SimLogger();


    constructor(cfg: SimConfig){
        let activePeerBuilder: PeerBuilder = new PeerBuilder().
            setSourceAddr(cfg.active.endpoint).
            setMss(cfg.active.mss).
            setMsl(cfg.active.msl).
            setMaxAnnounceableWindow(cfg.active.maxAnnounceableWindow).
            setReceptionBufferCapacity(cfg.active.recvBuffCapacity).
            setTimeToProcessSegment(cfg.active.timeToProcessSegment).
            setTimeGuardBeforeTransmitting(cfg.active.timeGuardBeforeTransmitting);
        this.activePeer = activePeerBuilder.buildActivePeer();

        let passivePeerBuilder: PeerBuilder = new PeerBuilder().
            setSourceAddr(cfg.passive.endpoint).
            setMss(cfg.passive.mss).
            setMsl(cfg.passive.msl).
            setMaxAnnounceableWindow(cfg.passive.maxAnnounceableWindow).
            setReceptionBufferCapacity(cfg.passive.recvBuffCapacity).
            setTimeToProcessSegment(cfg.passive.timeToProcessSegment).
            setTimeGuardBeforeTransmitting(cfg.passive.timeGuardBeforeTransmitting);
        this.passivePeer = passivePeerBuilder.buildPassivePeer();

        if (cfg.active.applicationData !== undefined) {
            this.activePeer.application.queueDataToSend(cfg.active.applicationData);
        }
        if (cfg.passive.applicationData !== undefined) {
            this.passivePeer.application.queueDataToSend(cfg.passive.applicationData);
        }

        this.activePeer.setRemoteHost(this.passivePeer.ctrlBlock.srcEndpoint);
        this.passivePeer.setRemoteHost(this.activePeer.ctrlBlock.srcEndpoint);

        this.channel = new Channel(cfg.channel.lossPercent, cfg.channel.rtt, cfg.channel.variance);

        this._simulationClock.addObserver(this.activePeer);
        this._simulationClock.addObserver(this.passivePeer);

        this.activePeer.logger = this._logger;
        this.passivePeer.logger = this._logger;

        this.linkPeers();
    }

    public linkPeers(): void {
        this.activePeer.linkToNetwork(this.channel);
        this.passivePeer.linkToNetwork(this.channel);

        this.channel.registerPeer(this.activePeer);
        this.channel.registerPeer(this.passivePeer);
    }

    public startSimulation(): Error|null {
        const err = this.activePeer.prepareSendSegments();
        if (err !== null) {
            console.log("could not start simulation");
        }

        return err;
    }

    public runNextStep(): boolean {
        const elementsWithQueue: objectWithEventQueue[] = [this.activePeer, this.passivePeer, this.channel];
        const objectWithNextEvent: objectWithEventQueue|null = this.selectObjectWithLowestDate(elementsWithQueue);
        //console.log("runNextStep() - Events of selected peer: ", objectWithNextEvent?.events["_events"], "|||||");

        if (objectWithNextEvent === null) {
            console.log("Finished simulation");
            return false;
        } else {
            let nextEvent: SimulationEvent = objectWithNextEvent.events.retrieveNextEvent()!;
            this._simulationClock.updateSimulationTime(nextEvent.executionTime);

            nextEvent.execute();
            return true;
        }
    }

    private selectObjectWithLowestDate(objects: objectWithEventQueue[]): objectWithEventQueue|null {
        let lowestDate: Date|null = null;
        let objectWithLowestDate: objectWithEventQueue|null = null;
        
        objects.forEach(obj => {
            const nextEvent = obj.events.peekNextEvent();
            if (nextEvent !== null && (lowestDate === null || nextEvent.executionTime < lowestDate)) {
                lowestDate = nextEvent.executionTime;
                objectWithLowestDate = obj;
            }
        });

        return objectWithLowestDate;
    }
}

interface objectWithEventQueue {
    events: EventQueue
}