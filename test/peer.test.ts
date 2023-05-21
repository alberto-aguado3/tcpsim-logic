import { DataBuffer, Peer, PeerBuilder } from "../src/peer";

describe("peer utilities", () => {
    
    test("calculate ISN, should be between 20 and 80 included", () => {
        const dummyPeer: Peer = new PeerBuilder().buildActivePeer();
        const iterations = 10;
        const max = 80, min = 20;

        for (let i = 0; i < iterations; i++) {
            const randomNumber = dummyPeer.randomISN();

            expect(randomNumber).toBeGreaterThanOrEqual(min);
            expect(randomNumber).toBeLessThanOrEqual(max);
            expect(randomNumber % 10).toEqual(0); //divisible by 10, not required, just implementation decision
        }
    });

    describe.each([
        //{mss: 10, dataInSendBuffer: ["h", "e", "l", "l", "o"], sendBuffCap: 5, sndUna: 30, sndWnd: 5, sendBuffStart: 30, expected: 5},
        {mss: 10, dataInSendBuffer: ["h", "e", "l", "l", "o"], sendBuffCap: 5, sndUna: 30, sndWnd: 5, sendBuffStart: 30, expected: 0},
        /*
        {mss: 10, dataInSendBuffer: ["h", "e", "l", "l", "o"], sendBuffCap: 5, sndUna: 31, sndWnd: 31, sendBuffStart: 30, expected: 4},
        {mss: 10, dataInSendBuffer: ["h", "e", "l", "l", "o"], sendBuffCap: 5, sndUna: 31, sndWnd: 35, sendBuffStart: 30, expected: 0},
        {mss: 10, dataInSendBuffer: ["h", "e", "l", "l", "o"], sendBuffCap: 5, sndUna: 31, sndWnd: 34, sendBuffStart: 30, expected: 1},
        {mss: 10, dataInSendBuffer: ["h", "e", "l", "l", "o"], sendBuffCap: 5, sndUna: 30, sndWnd: 33, sendBuffStart: 30, expected: 2},
        {mss: 2, dataInSendBuffer: ["h", "e", "l", "l", "o"], sendBuffCap: 5, sndUna: 30, sndWnd: 30, sendBuffStart: 30, expected: 2},
        {mss: 10, dataInSendBuffer: ["h", "e"], sendBuffCap: 5, sndUna: 31, sndWnd: 31, sendBuffStart: 30, expected: 1},
        {mss: 10, dataInSendBuffer: ["h", "e"], sendBuffCap: 5, sndUna: 30, sndWnd: 30, sendBuffStart: 30, expected: 2},
        {mss: 10, dataInSendBuffer: ["h", "e"], sendBuffCap: 5, sndUna: 30, sndWnd: 31, sendBuffStart: 30, expected: 1},
        {mss: 10, dataInSendBuffer: ["h", "e"], sendBuffCap: 5, sndUna: 30, sndWnd: 32, sendBuffStart: 30, expected: 0},
        */
    ])("bytes allowed for transmission", ({mss, dataInSendBuffer, sendBuffCap, sndUna, sndWnd, sendBuffStart, expected}) => {
        test(`mss: ${mss} with data in buffer: ${dataInSendBuffer.length}, sndWnd-sndUna = ${sndWnd-sndUna}`, () => {
            const peer: Peer = new PeerBuilder().setMss(mss).buildActivePeer();

            peer.sendBuffer = new DataBuffer(sendBuffCap);
            peer.ctrlBlock.sender.sndWnd = sndWnd;
            peer.ctrlBlock.sender.sndUna = sndUna;
            peer.sendBuffer.setDataOffset(sendBuffStart);

            peer.sendBuffer.write(dataInSendBuffer);

            const actual = peer.bytesAllowedForTransmission();

            expect(expected).toEqual(actual);
        });
    });

});