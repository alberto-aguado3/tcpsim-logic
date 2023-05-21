export abstract class SimulationEvent {
    protected _executionTime: Date;

    constructor(executionTime: Date){
        this._executionTime = executionTime;
    }

    public abstract execute():void
    public abstract type(): SimEventType

    public get executionTime(): Date {
        return this._executionTime;
    }
}

export enum SimEventType {
    CLOSE_CONN,
    PUT_TO_CHANNEL,
    RECEIVE,
    RESPOND_AFTER_GUARD,
    TIMEOUT
}