import { Segment, SegmentHeader } from "../segment";
import { SimEventType, EventCloseConn, EventPutToChannel, EventQueue, EventRespondAfterGuard, EventTimeout, SimulationEvent } from "../event";

import { ConnectionState } from "./connection-state";
import { ReceiveSequenceVariable, SendSequenceVariable } from "./sequence-variable";
import { TransmissionControlBlock } from "./transmission-control-block";
import { DataBuffer } from "./buffer";
import { State, StateClosed, StateListen } from "./state";
import { Application } from "./application";
import { Endpoint } from "./endpoint";
import { Log, Observer } from "../utils";
import { Congestion } from "./congestion-constants";
import { Channel } from "../channel";
import { SimLogger } from "../simulation/logger";

export class Peer implements Observer{
    public ctrlBlock: TransmissionControlBlock;
    public sendBuffer: DataBuffer;
    public recvBuffer: DataBuffer;
    public readonly application: Application;

    private readonly _maxAnnouncableWindow: number;
    private readonly _mss: number;

    private _connState!: State;
    public absSimulationTime: Date = new Date(0);
    public events: EventQueue = new EventQueue();
    private _timeToProcessSegmentMili: number = 2; //ms
    private _guardTimeMili: number = 100; //ms
    private _msl: number = 12000; //ms, it's 12s of MSL
    private _nic?: Channel;

    public congestion: Congestion = new Congestion();
    public readonly clockGranularity: number = 1; //ms

    public logger?: SimLogger;

    public initTimeToProcessSegment(timeMili: number) {
        this._timeToProcessSegmentMili = timeMili;
    }

    public initGuardTime(timeMili: number) {
        this._guardTimeMili = timeMili;
    }

    public initMsl(timeMili: number) {
        this._msl = timeMili;
    }

    public get timeToProcessSegmentMili(): number {
        return this._timeToProcessSegmentMili;
    }

    public get guardTimeMili(): number {
        return this._guardTimeMili;
    }

    public get msl(): number {
        return this._msl;
    }

    public transitionTo(state: State): void {
        this._connState = state;
        this._connState.setContext(this);
        //TODO: revisar si quito o dejo el connState en el ctrlBlock
        this.ctrlBlock.connState = state.type();
    }

    public update(currentTime: Date): void {
        this.absSimulationTime = currentTime;
    }

    public setRemoteHost(endpoint: Endpoint): void {
        this.ctrlBlock.dstEndpoint = endpoint;
    }

    public linkToNetwork(nic: Channel) {
        this._nic = nic;
    }

    public updateRttEstimation(timeoutStart: Date): void {
        //called after acknowledging all the data
        if (this.ctrlBlock.timeoutExpired === true) {
            //Karn: do not update if there was a retransmission
            this.ctrlBlock.timeoutExpired = false;
            return;
        }

        const RTTm = this.absSimulationTime.getTime() - timeoutStart.getTime();
        if (this.congestion.srtt !== undefined) {
            this.congestion.rttvar = (1-this.congestion.constants.beta) * this.congestion.rttvar +
              this.congestion.constants.beta * this.congestion.rttvar + Math.abs(this.congestion.srtt - RTTm);
            
            this.congestion.srtt = (1-this.congestion.constants.alpha) * this.congestion.srtt + this.congestion.constants.alpha + this.congestion.srtt;
        } else {
            this.congestion.rttvar = RTTm / 2;
            this.congestion.srtt = RTTm;
        }
    }

    public get rto(): number {
        if(this.congestion.srtt !== undefined) {
            //TODO: add unit management, as of now everything is in ms
            return this.congestion.srtt + Math.max(this.clockGranularity*0.001, this.congestion.constants.K * this.congestion.rttvar);
        } else {
            //8ms default, when uninitialized
            return 8*1000;
        }
    }


    //take data from application to sndBuffer
    public osWrite(): number {
        const dataToWrite = this.application.retrieveNextNBytesToSend(this.sendBuffer.capacity);

        this.sendBuffer.flush();
        //TODO: handle error
        const err = this.sendBuffer.write(dataToWrite);

        return dataToWrite.length;
    }

    //put rcvBuffer data into application receiver
    public osRead(): number {
        const dataReceived = this.recvBuffer.read();
        //TODO: handle error
        const err = this.application.writeBytesReceived(dataReceived);

        return dataReceived.length;
    }

    public get maxAnnouncableWindow(): number {
        return this._maxAnnouncableWindow;
    }

    public get mss(): number {
        return this._mss;
    }

    constructor(endpoint: Endpoint, initialState: ConnectionState.CLOSED | ConnectionState.LISTEN, rcvBufferCapacity: number,
        maxAnnouncableWindow: number, mss: number) {
        this.sendBuffer = new DataBuffer();
        this.recvBuffer = new DataBuffer(rcvBufferCapacity);

        // TODO: refactor into constructor
        const sender = new SendSequenceVariable();
        const receiver = new ReceiveSequenceVariable();

        this.ctrlBlock = new TransmissionControlBlock(sender, receiver, initialState, endpoint);

        this._maxAnnouncableWindow = maxAnnouncableWindow;
        this.application = new Application();
        this._mss = mss;

        if (initialState === ConnectionState.CLOSED) {
            this.transitionTo(new StateClosed());
        } else {
            this.transitionTo(new StateListen());
        }
    }

    // prepareSendSegment: use peer logic to create a Segment, and create EventSend that will put the Segment in the channel after Tsx
    public prepareSendSegments(): Error|null {
        if (this._nic === undefined) {
            return new Error("channel has not been set");
        }

        const dstAddr = this.ctrlBlock.dstEndpoint;
        if (!dstAddr) {
            return new Error("Cannot send when destination address and port have not been set");
        }        

        const segmentsToSend = this._connState.processSegmentForSend(dstAddr);
        
        segmentsToSend.forEach((segment, index) => {
            const execTime = this.absSimulationTime.getTime() + (index+1) * this.timeToProcessSegmentMili;
            const eventSend = new EventPutToChannel(new Date(execTime), segment, this._nic!);
            this.events.insertEvent(eventSend);
        });

        if (segmentsToSend.length > 0 && segmentsToSend[0].payload.length > 0) {
            const createdAtMili = this.absSimulationTime.getTime() + segmentsToSend.length * this.timeToProcessSegmentMili;
            const executionTimeMili = createdAtMili + this.rto;
            //TODO: restart only when the timer is not "running". We would like to measure the elapsed time, even when we retransmit.
            this.events.removeFirstEventByType(SimEventType.TIMEOUT);
            this.events.insertEvent(new EventTimeout(new Date(createdAtMili), new Date(executionTimeMili), this));
        }

        return null;
    }

    public receiveSegment(segment: Segment): void{
        if (segment.controlBits.rst) {
            this.transitionTo(new StateClosed());
        }

        //DEBUG
        console.log(`Soy ${this.ctrlBlock.srcEndpoint.ip}, state=${ConnectionState[this.ctrlBlock.connState]}. Received segment: `, (segment));

        const err = this._connState.processSegmentForReceiving(segment);
        if (err !== null) {
            //log error. Revisar si otros sí pueden generar EventRespondAfterGuard, y qué hacer en esos casos
            console.log("Error: ", (err));
        }
        
    }

    // randomISN - returns random number [20,30,40,50,60,70,80]
    //TODO: the passive peer should make sure the ISN isn't the same as the active peer's ISN
    public randomISN(): number {
        const max = 8;
        const min = 2;
        
        return 10*Math.floor(Math.random() *(max-min+1) + min);
    }

    public bytesAllowedForTransmission(): number {

        const start = this.ctrlBlock.sender.sndNxt;
        //TODO: revisar end
        //const end = this.ctrlBlock.sender.sndUna + this.ctrlBlock.sender.sndNxt;
        //const end = this.ctrlBlock.sender.sndNxt - this.ctrlBlock.sender.sndUna;
        //const windowBytes = this.ctrlBlock.sender.sndWnd;
        const distanceBetweenNxtAndWnd = (this.ctrlBlock.sender.sndUna + this.ctrlBlock.sender.sndWnd) - this.ctrlBlock.sender.sndNxt;
        let dataBetweenNxtAndWnd = this.sendBuffer.readChunk(start, distanceBetweenNxtAndWnd); //returned array discards empty cells, in case wnd>actualDataInBuffer

        //const usableBytes = (this.ctrlBlock.sender.sndUna + this.ctrlBlock.sender.sndWnd) - this.ctrlBlock.sender.sndNxt;
        return Math.min(this._mss, dataBetweenNxtAndWnd.length);
    }

    //reference: RFC9293 - section 3.10.7.4, first step "Check sequence number". Acceptability test for incoming segments
    public isSequenceNumberAcceptable(segment: Segment): boolean {
        const segmentLength: number = segment.payload.length;
        const receiveWindow: number = this.ctrlBlock.receiver.rcvWnd;

        const rcvNxt: number = this.ctrlBlock.receiver.rcvNxt;
        let isAcceptable: boolean = false;
        if (segmentLength === 0 && receiveWindow === 0) {
            isAcceptable = segment.seqNumber === rcvNxt;
        } else if (segmentLength === 0 && receiveWindow > 0) {
            isAcceptable = rcvNxt <= segment.seqNumber && segment.seqNumber < rcvNxt+receiveWindow;
        } else if (segmentLength > 0 && receiveWindow === 0) {
            isAcceptable = false;
        } else if (segmentLength > 0 && receiveWindow > 0) {
            const cond1: boolean = rcvNxt <= segment.seqNumber && segment.seqNumber < rcvNxt+receiveWindow;
            const cond2: boolean = rcvNxt <= segment.seqNumber+segmentLength-1 && segment.seqNumber+segmentLength-1 < rcvNxt+receiveWindow;
            isAcceptable = cond1 || cond2;
        }

        return isAcceptable;
    }

    public respondWithAck(destination: Endpoint): void {
        if (this._nic === undefined) {
            this.logger?.error(this.logWithAuthorAndTimestamp("Err: channel was not set"));
            console.log("respondWithAck - channel not set");
            return;
        }
        const header: SegmentHeader = new SegmentHeader(this.ctrlBlock.srcEndpoint, destination);
        const segment = new Segment(header, []);
        segment.withAcknowledgement(this.ctrlBlock.receiver.rcvNxt);
        segment.withSequenceNumber(this.ctrlBlock.sender.sndNxt);
        segment.withWindowAnnouncement(Math.min(this.maxAnnouncableWindow, this.ctrlBlock.receiver.rcvWnd));

        const execTime = this.absSimulationTime.getTime() + this.timeToProcessSegmentMili;
        const eventSend = new EventPutToChannel(new Date(execTime), segment, this._nic);
        this.events.insertEvent(eventSend);
    }

    public respondWithRst(destination: Endpoint): void {
        if (this._nic === undefined) {
            this.logger?.error(this.logWithAuthorAndTimestamp("Err: channel was not set"));
            console.log("respondWithAck - channel not set");
            return;
        }
        const header: SegmentHeader = new SegmentHeader(this.ctrlBlock.srcEndpoint, destination);
        const segment = new Segment(header, []);
        segment.withReset();

        const execTime = this.absSimulationTime.getTime() + this.timeToProcessSegmentMili;
        const eventSend = new EventPutToChannel(new Date(execTime), segment, this._nic);
        this.events.insertEvent(eventSend);
    }

    public logWithAuthorAndTimestamp(msg: string): Log {
        const log: Log = {
            message: msg,
            author: this.ctrlBlock.srcEndpoint.ip,
            timestamp: this.absSimulationTime.getTime(),
        };

        return log;
    }
}
