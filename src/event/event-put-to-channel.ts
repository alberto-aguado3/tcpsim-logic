import { Channel } from "../channel";
import { Peer } from "../peer";
import { Segment } from "../segment";
import { SimEventType, SimulationEvent } from "./event";
import { EventReceive } from "./event-receive";

export class EventPutToChannel extends SimulationEvent { //implements Observer {
    //private sender: Peer; //idealmente borro sender
    private _channel: Channel;
    private _segmentDelivered: Segment; //si calculo la lógica primero, y luego mando el segmento al canal, esto sí lo necesito
    //private _absSimulationTime: Date = new Date(0);

    public constructor(executionTime: Date, segment: Segment, channel: Channel) {
        super(executionTime);
        this._segmentDelivered = segment;
        this._channel = channel;
    }

    public type(): SimEventType {
        return SimEventType.PUT_TO_CHANNEL;
    }
    
    public execute(): void {
        
        const segmentMaybeLost: Segment|null = this._channel.applyLossEffect(this._segmentDelivered);
        if (segmentMaybeLost === null) {
            return;
        }

        const delayWithVariance: number = this._channel.randomGaussianEvent() + this._channel.rtt;
        const arrivalTime: number = this._executionTime.getTime() + delayWithVariance;

        const destinationPeer = this._channel.routeByEndpoint(segmentMaybeLost.destination);
        if (destinationPeer === null) {
            const dst = this._segmentDelivered.destination;
            console.log(`Error: could not find peer to deliver with endpoint ${dst.ip}:${dst.port}`);
            return;
        }

        this._channel.events.insertEvent(new EventReceive(new Date(arrivalTime), this._segmentDelivered, destinationPeer));
    }

    /*
    public update(simTime: Date): void {
        this._absSimulationTime = simTime;
    }
    */
}