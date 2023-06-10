import { ConnectionState, GetConnectionStateString } from "../src/peer/connection-state";

describe("state enum", ()=> {    
    describe.each([
        {state: ConnectionState.LISTEN, expected: "LISTEN"},
        {state: ConnectionState.SYN_SENT, expected: "SYN_SENT"},
        {state: ConnectionState.SYN_RECEIVED, expected: "SYN_RECEIVED"},
        {state: ConnectionState.ESTABLISHED, expected: "ESTABLISHED"},
        {state: ConnectionState.FIN_WAIT1, expected: "FIN_WAIT1"},
        {state: ConnectionState.FIN_WAIT2, expected: "FIN_WAIT2"},
        {state: ConnectionState.CLOSE_WAIT, expected: "CLOSE_WAIT"},
        {state: ConnectionState.LAST_ACK, expected: "LAST_ACK"},
        {state: ConnectionState.TIME_WAIT, expected: "TIME_WAIT"},
        {state: ConnectionState.CLOSED, expected: "CLOSED"},
    ])("GetConnectionStateString()", ({state, expected}) => {
        test("should match the representation", () => {
            const actual = GetConnectionStateString(state);

            expect(actual).toEqual(expected);
        });
    });
});