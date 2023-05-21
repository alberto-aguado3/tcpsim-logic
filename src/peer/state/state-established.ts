import { EventCloseConn, EventPutToChannel, EventRespondAfterGuard, EventTimeout } from "../../event";
import { SimEventType, SimulationEvent } from "../../event/event";
import { Segment, SegmentHeader } from "../../segment";
import { ConnectionState } from "../connection-state";
import { Endpoint } from "../endpoint";
import { Peer } from "../peer";
import { State } from "./state";
import { StateCloseWait } from "./state-close-wait";
import { StateFinWait1 } from "./state-fin-wait1";
import {inspect} from "util";



export class StateEstablished extends State {
    public type(): ConnectionState {
        return ConnectionState.ESTABLISHED;
    }

    public processSegmentForSend(destination: Endpoint): Segment[] {
        let header = new SegmentHeader(this.context.ctrlBlock.srcEndpoint, destination);
        let segment: Segment = new Segment(header, []);
        let segmentsToSend: Segment[] = [];

        this.context.ctrlBlock.sender.sndNxt = this.context.ctrlBlock.sender.sndUna;

        segment.withAcknowledgement(this.context.ctrlBlock.receiver.rcvNxt);
        segment.withSequenceNumber(this.context.ctrlBlock.sender.sndNxt);
        
        segment.withWindowAnnouncement(Math.min(this.context.maxAnnouncableWindow, this.context.ctrlBlock.receiver.rcvWnd));

        let bytesToSend = this.context.bytesAllowedForTransmission();

        console.log(`Enviando, state=ESTABLISHED, peer=${this.context.ctrlBlock.srcEndpoint.ip}. sndWnd=${this.context.ctrlBlock.sender.sndWnd}, mss=${this.context.mss},
        bytesToSend=${bytesToSend}, sndUna=${this.context.ctrlBlock.sender.sndUna}, sndNxt=${this.context.ctrlBlock.sender.sndNxt}`);
        if (bytesToSend > 0) {
            const dataToSend = this.context.sendBuffer.readChunk(this.context.ctrlBlock.sender.sndNxt, bytesToSend);
            this.context.ctrlBlock.sender.sndNxt = this.context.ctrlBlock.sender.sndNxt + bytesToSend;
            segment.withPayload(dataToSend);
        }
        
        segmentsToSend.push(segment);

        bytesToSend = this.context.bytesAllowedForTransmission();

        while (bytesToSend > 0) {
            header = new SegmentHeader(this.context.ctrlBlock.srcEndpoint, destination);
            segment = new Segment(header, []);
    
            segment.withAcknowledgement(this.context.ctrlBlock.receiver.rcvNxt);
            segment.withSequenceNumber(this.context.ctrlBlock.sender.sndNxt);
            segment.withWindowAnnouncement(Math.min(this.context.maxAnnouncableWindow, this.context.ctrlBlock.receiver.rcvWnd));
    
            const dataToSend = this.context.sendBuffer.readChunk(this.context.ctrlBlock.sender.sndNxt, bytesToSend);
            this.context.ctrlBlock.sender.sndNxt = this.context.ctrlBlock.sender.sndNxt + bytesToSend;
            segment.withPayload(dataToSend);
            
            segmentsToSend.push(segment);
            bytesToSend = this.context.bytesAllowedForTransmission();
        }

        //custom implementation: start connection close if no more application bytes to send
        //DEBUG
        //console.log("this.context.application.dataToSend.length === 0? dataToSend:", this.context.application.dataToSend);
        //console.log("this.context.ctrlBlock.sender.sndNxt === this.context.sendBuffer.firstEmptyCell()?", `${this.context.ctrlBlock.sender.sndNxt} === ${this.context.sendBuffer.firstEmptyCell()}`);
        //console.log("contenido buffer envio: ", inspect(this.context.sendBuffer), "y recibido: ", inspect(this.context.rec));
        if (this.context.application.dataToSend.length === 0 && this.context.ctrlBlock.sender.sndNxt === this.context.sendBuffer.firstEmptyCell()) {
            this.context.transitionTo(new StateFinWait1());
            segmentsToSend.at(-1)?.withFin();
        }

        return segmentsToSend;
    }

    public processSegmentForReceiving(segment: Segment): Error|null {
        const ctrlBlock = this.context.ctrlBlock;
        if (!this.context.isSequenceNumberAcceptable(segment)) {
            //TODO: If an incoming segment is not acceptable, an acknowledgment should be sent in reply
            this.context.logger?.warn(this.context.logWithAuthorAndTimestamp(
                `Sequence number ${segment.seqNumber} not acceptable, receiving window is [${ctrlBlock.receiver.rcvNxt}, ${ctrlBlock.receiver.rcvNxt+ctrlBlock.receiver.rcvWnd}`
                ));
                //DEBUG
            console.log(`established - Sequence number ${segment.seqNumber} not acceptable, receiving window is [${ctrlBlock.receiver.rcvNxt}, ${ctrlBlock.receiver.rcvNxt+ctrlBlock.receiver.rcvWnd}`);
            this.context.respondWithAck(segment.source);
            if (this.context.events.getEventsByType(SimEventType.TIMEOUT).length > 0) {
                this.restartTimeout();
            }
            return null;
        }

        if (!segment.controlBits.ack) {
            //TODO: nunca pasará... responder con ack?? early return...
            this.context.respondWithAck(segment.source);
            this.context.logger?.warn(this.context.logWithAuthorAndTimestamp("did not receive ACK and it was expected"));
            return new Error("did not receive ACK and it was expected");
        }

        //try to advance sender window (advance SND.UNA)
        try {
            this.acknowledgeBytesFromSegment(segment);
        } catch (err: any) {
            //DEBUG
            console.log("ackBytes catch: exiting..., segment.ack=", segment.ackNumber);
            return err;
        }

        //try to update sender window (SND.WND)
        this.updateSenderWindow(segment);

        if (segment.payload.length > 0) {
            this.readSegmentPayload(segment);
        }


        //TODO: ver en este "if", si también pasas antes a estado Fin-Wait1, se sigue un flujo de estados correcto??
        if (segment.controlBits.fin) {
            this.context.transitionTo(new StateCloseWait());
            this.context.osRead();
            //this.context.recvBuffer.flush();
        }

        this.restartEventRespondAfterGuard();
        return null;
    }
}