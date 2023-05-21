import { Segment } from "../../segment";
import { ConnectionState } from "../connection-state";
import {EventPutToChannel, EventReceive, EventRespondAfterGuard, EventTimeout, EventCloseConn, SimEventType} from "../../event";
import { Peer } from "../peer";
import { Endpoint } from "../endpoint";
import { TerminationError } from "../../error";

export abstract class State {
    protected context!: Peer;

    public setContext(context: Peer) {
        this.context = context;
    }

    public abstract type(): ConnectionState;
    public abstract processSegmentForSend(destination: Endpoint): Segment[]
    public abstract processSegmentForReceiving(segment: Segment): Error|null

    public restartEventRespondAfterGuard(): void {
        this.context.events.removeFirstEventByType(SimEventType.RESPOND_AFTER_GUARD);
        const newExecutionTimeMili: number = this.context.absSimulationTime.getTime() + this.context.guardTimeMili;
        this.context.events.insertEvent(new EventRespondAfterGuard(new Date(newExecutionTimeMili), this.context));
    }

    public restartCloseConn(): void {
        this.context.events.removeFirstEventByType(SimEventType.CLOSE_CONN);
        const newExecutionTimeMili: number = this.context.absSimulationTime.getTime() + 2*this.context.msl;
        this.context.events.insertEvent(new EventCloseConn(new Date(newExecutionTimeMili), this.context));
    }

    public restartTimeout(): void {
        this.context.events.removeFirstEventByType(SimEventType.TIMEOUT);
        const newExecutionTimeMili: number = this.context.absSimulationTime.getTime() + this.context.rto;
        this.context.events.insertEvent(new EventTimeout(this.context.absSimulationTime, new Date(newExecutionTimeMili), this.context));
    }

    public acknowledgeBytesFromSegment(segment: Segment): void {
        //TODO: revisar if
        //if (this.context.ctrlBlock.sender.sndUna < segment.ackNumber && segment.ackNumber <= this.context.ctrlBlock.sender.sndNxt) {
        //DEBUG
        console.log("acknowledgeBytesFrom segment. sndUNA=",this.context.ctrlBlock.sender.sndUna," sndNXT=", this.context.ctrlBlock.sender.sndNxt);
        if (this.context.ctrlBlock.sender.sndUna < segment.ackNumber && segment.ackNumber <= this.context.ctrlBlock.sender.sndNxt) {
            this.context.ctrlBlock.sender.sndUna = segment.ackNumber;

            if (this.context.ctrlBlock.sender.sndUna === this.context.ctrlBlock.sender.sndNxt) {
                //TODO: ver si en este trozo, puede existir la posibilidad de que haya 0 timeouts. En caso que sea así, cambiar el "if":
                //if (timeouts.length > 0) {updateRttEstimation; removeFirstEventByType;}
                const timeouts: EventTimeout[] = this.context.events.getEventsByType(SimEventType.TIMEOUT) as EventTimeout[];
                if (timeouts.length === 0) {
                    console.log("Error: expected to find a retransmission event when updating SND.UNA");
                }

                this.context.updateRttEstimation(timeouts[0].createdTime);
                this.context.events.removeFirstEventByType(SimEventType.TIMEOUT); //remove timeout. If you don't send any more data, no more timeouts on your side
            }
            
        } else if (segment.ackNumber <= this.context.ctrlBlock.sender.sndUna) {
            //it's a duplicate, ignore
            //console.log(`Already ACK'd bytes until ${this.context.ctrlBlock.sender.sndUna}`);
        } else {
            this.context.respondWithAck(segment.source);
            throw new TerminationError();
        }
    }

    public updateSenderWindow(segment: Segment): void {
        //try to update sender window (SND.WND)
        const {sender} = this.context.ctrlBlock;

        //DEBUG
        //console.log("una =< ackNumber <= nxt: ", [sender.sndUna, segment.ackNumber, sender.sndNxt]);
        //console.log(sender.sndUna <= segment.ackNumber, segment.ackNumber <= sender.sndNxt);
        if (sender.sndUna <= segment.ackNumber && segment.ackNumber <= sender.sndNxt) {
            //DEBUG
            //console.log("Avanzamos.", "wl1 < seqNumber: ", sender.sndWl1 < segment.seqNumber, "\n",
            //"wl1 == seqNumber: ", sender.sndWl1 === segment.seqNumber, " wl2 <= ackNumber: ", segment.ackNumber
            //);
            if (sender.sndWl1 < segment.seqNumber || (sender.sndWl1 === segment.seqNumber && sender.sndWl2 <= segment.ackNumber)) {
                const unaBufferIndex = this.context.sendBuffer.removeOffsetToNumber(sender.sndUna);
                
                //TODO: ha sido cambiado
                //const spaceFromUnaToEndOfBuffer = this.context.sendBuffer.capacity - (sender.sndUna - unaBufferIndex);
                const spaceFromUnaToEndOfBuffer = this.context.sendBuffer.capacity - (unaBufferIndex);
                this.context.ctrlBlock.sender.sndWnd = Math.min(segment.window, spaceFromUnaToEndOfBuffer);
                this.context.ctrlBlock.sender.sndWl1 = segment.seqNumber;
                this.context.ctrlBlock.sender.sndWl2 = segment.ackNumber;

                //DEBUG
                /*
                console.log("unaBufferIndex",unaBufferIndex, "\n",
                "spaceFromUnaToEndOfBuffer", spaceFromUnaToEndOfBuffer, "\n",
                "sender.sndWnd", this.context.ctrlBlock.sender.sndWnd, "\n",
                this.context.ctrlBlock.sender.sndWl1, this.context.ctrlBlock.sender.sndWl2,
                "buffer capacity: ", this.context.sendBuffer.capacity, "\n", 
                );
                */

                //try to read more data if send buffer is empty
                if (this.context.ctrlBlock.sender.sndWnd === 0) {
                    const numBytesWritten = this.context.osWrite();
                    this.context.ctrlBlock.sender.sndWnd = Math.min(segment.window, numBytesWritten);
                    this.context.sendBuffer.shiftDataOffsetForward();

                    /*
                    //custom implementation: start connection close if no more application bytes to send
                    if (this.context.application.dataToSend.length === 0) {
                        this.context.transitionTo(new StateFinWait1());
                    }
                    */
                    /*
                    if (numBytesWritten <= 0) {
                        this.context.transitionTo(new StateFinWait1());
                    }
                    */
                }
            }
        }
    }

    public readSegmentPayload(segment: Segment): void {
        //const bufferSectionToWriteStart = this.context.recvBuffer.removeOffsetToNumber(segment.seqNumber);
        //const bufferSectionToWriteEnd = bufferSectionToWriteStart + (segment.payload.length);
        //WARN: cambio en el uso de isChunkPopulated
        if (this.context.recvBuffer.isChunkPopulated(segment.seqNumber, segment.payload.length)) {
            console.log(`Overwriting data in receiver buffer, starting at ${segment.seqNumber} (${segment.payload.length} bytes)`);
        }

        this.context.recvBuffer.writeChunk(segment.seqNumber, segment.payload);

        //move reception window
        const bufferFirstEmptyPlace = this.context.recvBuffer.firstEmptyCell();
        this.context.ctrlBlock.receiver.rcvNxt = bufferFirstEmptyPlace;
        const bufferFirstEmptyPlaceWithoutOffset = this.context.recvBuffer.removeOffsetToNumber(bufferFirstEmptyPlace);
        this.context.ctrlBlock.receiver.rcvWnd = Math.min(this.context.maxAnnouncableWindow, this.context.recvBuffer.capacity - bufferFirstEmptyPlaceWithoutOffset);
        if (this.context.ctrlBlock.receiver.rcvWnd === 0) {
            //read rcvBuffer data to rcvApplication
            this.context.osRead();
            this.context.recvBuffer.flush();
            this.context.recvBuffer.shiftDataOffsetForward();
            
            this.context.ctrlBlock.receiver.rcvWnd = Math.min(this.context.maxAnnouncableWindow, this.context.recvBuffer.capacity);
        }
    }
}
