export enum ConnectionState {
    LISTEN,
    SYN_SENT,
    SYN_RECEIVED,
    ESTABLISHED,
    FIN_WAIT1,
    FIN_WAIT2,
    CLOSE_WAIT,
    LAST_ACK,
    TIME_WAIT,
    CLOSED
}