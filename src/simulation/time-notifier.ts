import { Observable } from "../utils";


export class TimeNotifier extends Observable{
    //private _observers: Observer[] = [];
    private _simulationTime: Date;

    constructor(initialTime: Date) {
        super();
        this._simulationTime = initialTime;
    }

    public get simulationTime(): Date {
        return this._simulationTime;
    }

    public updateSimulationTime(newTime: Date): void {
        this._simulationTime = newTime;

        this.notifyObservers(this._simulationTime);
    }
}