import { SimLogger } from "../simulation/logger";
import { ConnectionState } from "./connection-state";
import { Endpoint } from "./endpoint";
import { Peer } from "./peer";

export class PeerBuilder {
    private msl?: number;
    private timeToProcessSegment?: number;
    private timeGuardBeforeTransmitting?: number;

    private srcAddr?: Endpoint;
    private rcvBufferCap: number = 10;
    private maxAnnounceableWindow: number = 8;
    private mss: number = 536;

    private loggerInstance?: SimLogger;

    public constructor() {}

    public setMsl(mslMili?: number): PeerBuilder {
        this.msl = mslMili;
        return this;
    }

    public setTimeToProcessSegment(timeMili?: number): PeerBuilder {
        this.timeToProcessSegment = timeMili;
        return this;
    }

    public setTimeGuardBeforeTransmitting(timeMili?: number): PeerBuilder {
        this.timeGuardBeforeTransmitting = timeMili;
        return this;
    }

    public setSourceAddr(addr?: Endpoint): PeerBuilder {
        this.srcAddr = addr;
        return this;
    }

    public setReceptionBufferCapacity(capacity?: number): PeerBuilder {
        if (capacity !== undefined) {
            this.rcvBufferCap = capacity;
        }
        return this;
    }

    public setMaxAnnounceableWindow(window?: number): PeerBuilder {
        if (window !== undefined) {
            this.maxAnnounceableWindow = window;
        }
        return this;
    }

    public setMss(mss?: number): PeerBuilder {
        if (mss !== undefined) {
            this.mss = mss;
        }
        return this;
    }

    public setLogger(logger: SimLogger): PeerBuilder {
        this.loggerInstance = logger;
        return this;
    }

    public buildActivePeer(): Peer {
        if (this.srcAddr === undefined) {
            this.srcAddr = this.randomEndpoint();
        }

        const newObject = new Peer(this.srcAddr, ConnectionState.CLOSED, this.rcvBufferCap, this.maxAnnounceableWindow, this.mss);
        if (this.msl !== undefined) {
            newObject.initMsl(this.msl);
        }
        if (this.timeToProcessSegment !== undefined) {
            newObject.initTimeToProcessSegment(this.timeToProcessSegment);
        }
        if (this.timeGuardBeforeTransmitting !== undefined) {
            newObject.initGuardTime(this.timeGuardBeforeTransmitting);
        }
        newObject.logger = this.loggerInstance;

        return newObject;
    }

    public buildPassivePeer(): Peer {
        if (this.srcAddr === undefined) {
            this.srcAddr = this.randomEndpoint();
        }

        const newObject = new Peer(this.srcAddr, ConnectionState.LISTEN, this.rcvBufferCap, this.maxAnnounceableWindow, this.mss);
        if (this.msl !== undefined) {
            newObject.initMsl(this.msl);
        }
        if (this.timeToProcessSegment !== undefined) {
            newObject.initTimeToProcessSegment(this.timeToProcessSegment);
        }
        if (this.timeGuardBeforeTransmitting !== undefined) {
            newObject.initGuardTime(this.timeGuardBeforeTransmitting);
        }
        newObject.logger = this.loggerInstance;

        return newObject;
    }

    private randomEndpoint(): Endpoint {
        const endpoint: Endpoint = {
            ip: this.randomCidrIp(),
            port: this.randomEphemerealPort(),
        };
        return endpoint;
    }
    
    private randomCidrIp(): string {
        const max: number = 255, min: number = 0;

        let cidrDigits: string[] = Array.from("0".repeat(4));
        while (cidrDigits.every((digit) => digit==="0")) {
            cidrDigits = cidrDigits.map(() => {
                const randDigit = Math.floor(Math.random() * (max-min+1) + min);
                return randDigit.toString();
            });
        }
        
        return cidrDigits.join(".");
    }

    private randomEphemerealPort(): string {
        const max: number = 65535, min: number = 49152;
        const port: number = Math.floor(Math.random() * (max-min+1) + min);
        return port.toString();
    }
}