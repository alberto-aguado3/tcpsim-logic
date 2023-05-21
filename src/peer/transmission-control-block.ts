import { ConnectionState } from "./connection-state";
import { Endpoint } from "./endpoint";
import { ReceiveSequenceVariable, SendSequenceVariable } from "./sequence-variable";

export class TransmissionControlBlock {
    public sender: SendSequenceVariable;
    public receiver: ReceiveSequenceVariable;
    public connState: ConnectionState;
    public srcEndpoint: Endpoint;
    public dstEndpoint?: Endpoint;
    public timeoutExpired: boolean = false;

    constructor(sender: SendSequenceVariable, receiver: ReceiveSequenceVariable, connState: ConnectionState, srcEndpoint: Endpoint) {
        this.sender = sender;
        this.receiver = receiver;
        this.connState = connState;
        this.srcEndpoint = srcEndpoint;
    }

}