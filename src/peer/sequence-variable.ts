export class SendSequenceVariable {
    public sndUna: number = 0;
    public sndNxt: number = 0;
    public sndWnd: number = 0;
    public sndWl1: number = 0; //seq number used for last window update
    public sndWl2: number = 0; //ack number used for last window update
    public iss?: number;

    constructor() {}
}

export class ReceiveSequenceVariable {
    public rcvNxt: number = 0;
    public rcvWnd: number = 0;
    public irs?: number;
}