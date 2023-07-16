import { SimEventType, SimulationEvent } from "./event";
import { EventReceive } from "./event-receive";


export class EventQueue {
    private _events: SimulationEvent[];

    constructor() {
        this._events = [];
    }

    public insertEvent(event: SimulationEvent): void {
        this._events = this._events.concat(event);

        this.sortByTime();
    }

    public retrieveNextEvent(): SimulationEvent|null {
        const event: SimulationEvent|undefined = this._events.shift();
        return event === undefined ? null: event;
    }

    //TODO: test
    public peekNextEvent(): SimulationEvent|null {
        if (this._events.length > 0) {
            return this._events[0];
        }
        return null;
    }

    //TODO: test
    public removeFirstEventByType(type: SimEventType) {
        for (let i = 0; i < this._events.length; i++) {
            if (this._events[i].type() === type) {
                this._events.splice(i, 1);
                i--;
            }
        }
    }

    public removeSegmentToReceiveById(id: string): void {
        this._events = this._events.filter(event => {
            return !(event.type() === SimEventType.RECEIVE && (event as EventReceive)["_segment"].id === id);
        });
    }

    private sortByTime(): void {
        this._events = this._events.sort((e1, e2) => {
            return e1.executionTime.getTime() - e2.executionTime.getTime();
        });
    }

    public getEventsByType(type: SimEventType): SimulationEvent[] {
        return this._events.filter((event): event is SimulationEvent => {return event.type() == type;});
    }

    //public eventsQueued
}