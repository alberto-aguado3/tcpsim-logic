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

export function GetConnectionStateString(state: ConnectionState): string {
    const connectionStateKeys = Object.keys(ConnectionState) as Array<keyof typeof ConnectionState>;
    const connectionStateStrings = connectionStateKeys.filter(k => ConnectionState[k] === state);
    return connectionStateStrings[0] || "";
}