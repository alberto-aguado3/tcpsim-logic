import { SimEventType } from "../../src/event";
import { Peer, PeerBuilder } from "../../src/peer";
import { Endpoint } from "../../src/peer/endpoint";
import { StateClosed } from "../../src/peer/state";
import { Segment, SegmentHeader } from "../../src/segment";

describe("test closed conn", () => {
    const dst: Endpoint = {ip:"ip", port:"port"};
    test("send", ()=>{
        const dummyPeer: Peer = new PeerBuilder().buildActivePeer();
        dummyPeer.transitionTo(new StateClosed());

        //const stateClosed: StateClosed = new StateClosed();
        const segmentsToSend: Segment[] = dummyPeer["_connState"].processSegmentForSend(dst);

        expect(segmentsToSend).toHaveLength(1);
        expect(dummyPeer.ctrlBlock.sender.iss).not.toBeUndefined();
        expect(segmentsToSend[0].seqNumber).toEqual(dummyPeer.ctrlBlock.sender.iss);
        expect(segmentsToSend[0].ackNumber).toEqual(0);
    });

    test("receive", () => {
        const dummyPeer: Peer = new PeerBuilder().buildActivePeer();
        dummyPeer.transitionTo(new StateClosed());
        
        dummyPeer.ctrlBlock.dstEndpoint = {ip: "ipB", port:"portB"};
        const rcvSegment: Segment = new Segment(new SegmentHeader(dummyPeer.ctrlBlock.srcEndpoint, dummyPeer.ctrlBlock.dstEndpoint), []);

        const err: Error|null = dummyPeer["_connState"].processSegmentForReceiving(rcvSegment);
        expect(err).toBeInstanceOf(Error);
        expect(dummyPeer.events.getEventsByType(SimEventType.RESPOND_AFTER_GUARD)).toHaveLength(0);
    });
});