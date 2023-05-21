import { Channel } from "../channel";
import { EventQueue, SimulationEvent } from "../event";
import { Peer } from "../peer";
import { ConnectionState } from "../peer/connection-state";
import { PeerBuilder } from "../peer/peer-builder";
import { SimLogger } from "./logger";
import { SimConfig } from "./simulation-config";
import { TimeNotifier } from "./time-notifier";

export class Simulation {
    private _activePeer: Peer;
    private _passivePeer: Peer;
    private _channel: Channel;
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
        this._activePeer = activePeerBuilder.buildActivePeer();

        let passivePeerBuilder: PeerBuilder = new PeerBuilder().
            setSourceAddr(cfg.passive.endpoint).
            setMss(cfg.passive.mss).
            setMsl(cfg.passive.msl).
            setMaxAnnounceableWindow(cfg.passive.maxAnnounceableWindow).
            setReceptionBufferCapacity(cfg.passive.recvBuffCapacity).
            setTimeToProcessSegment(cfg.passive.timeToProcessSegment).
            setTimeGuardBeforeTransmitting(cfg.passive.timeGuardBeforeTransmitting);
        this._passivePeer = passivePeerBuilder.buildPassivePeer();

        if (cfg.active.applicationData !== undefined) {
            this._activePeer.application.queueDataToSend(cfg.active.applicationData);
        }
        if (cfg.passive.applicationData !== undefined) {
            this._passivePeer.application.queueDataToSend(cfg.passive.applicationData);
        }

        this._activePeer.setRemoteHost(this._passivePeer.ctrlBlock.srcEndpoint);
        this._passivePeer.setRemoteHost(this._activePeer.ctrlBlock.srcEndpoint);

        this._channel = new Channel(cfg.channel.lossPercent, cfg.channel.rtt, cfg.channel.variance);

        this._simulationClock.addObserver(this._activePeer);
        this._simulationClock.addObserver(this._passivePeer);

        this._activePeer.logger = this._logger;
        this._passivePeer.logger = this._logger;
    }

    public get ActivePeer(): Peer {
        return this._activePeer;
    }

    public get PassivePeer(): Peer {
        return this._passivePeer;
    }

    public get Channel(): Channel {
        return this._channel;
    }

    public linkPeers(): void {
        this._activePeer.linkToNetwork(this._channel);
        this._passivePeer.linkToNetwork(this._channel);

        this._channel.registerPeer(this._activePeer);
        this._channel.registerPeer(this._passivePeer);
    }


    public startSimulation(): Error|null {
        const err = this._activePeer.prepareSendSegments();
        if (err !== null) {
            console.log("could not start simulation");
        }

        return err;
    }

    public runNextStep(): boolean {
        const elementsWithQueue: objectWithEventQueue[] = [this._activePeer, this._passivePeer, this._channel];
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