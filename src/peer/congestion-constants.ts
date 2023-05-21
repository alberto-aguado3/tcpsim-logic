class CongestionConstants {
    public K: number = 3;
    public alpha: number = 1/8;
    public beta: number = 1/4;
}

export class Congestion {
    public constants: CongestionConstants = new CongestionConstants();
    public srtt?: number;
    public rttvar: number = 0;
    //public measureRTTs: boolean;
}