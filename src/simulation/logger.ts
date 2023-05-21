import { Endpoint } from "../peer/endpoint";
import { Log, Observer } from "../utils";

export class SimLogger {
    //private _logs: LogWithLevel[] = [];
    private _logs: Log[] = [];
    public logLevel: LogLevel = LogLevel.INFO;

    public debug(log: Log): void {
        const loggableLevels: LogLevel[] = [LogLevel.DEBUG];
        if (loggableLevels.includes(this.logLevel)) {
            //this._logs.push({log: log, level: LogLevel.DEBUG});
            this._logs.push(log);
        }
    }

    public info(log: Log): void {
        const loggableLevels: LogLevel[] = [LogLevel.DEBUG, LogLevel.INFO];
        if (loggableLevels.includes(this.logLevel)) {
            this._logs.push(log);
        }
    }

    public warn(log: Log): void {
        const loggableLevels: LogLevel[] = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN];
        if (loggableLevels.includes(this.logLevel)) {
            this._logs.push(log);
        }
    }

    public error(log: Log): void {
        const loggableLevels: LogLevel[] = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
        if (loggableLevels.includes(this.logLevel)) {
            this._logs.push(log);
        }
    }
}

/*
type LogWithLevel = {
    log: Log,
    level: LogLevel
}
*/

export enum LogLevel {
    DEBUG,
    INFO,
    WARN,
    ERROR,
}