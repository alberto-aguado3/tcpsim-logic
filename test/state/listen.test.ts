import { SimEventType } from "../../src/event";
import { Peer, PeerBuilder } from "../../src/peer";
import { Endpoint } from "../../src/peer/endpoint";
import { StateClosed, StateListen } from "../../src/peer/state";
import { Segment, SegmentHeader } from "../../src/segment";

describe("test closed conn", () => {
    const dst: Endpoint = {ip:"ip", port:"port"};
    test("send", ()=>{
        const dummyPeer: Peer = new PeerBuilder().buildActivePeer();
        dummyPeer.transitionTo(new StateListen());

        //const stateClosed: StateClosed = new StateClosed();
        const segmentsToSend: Segment[] = dummyPeer["_connState"].processSegmentForSend(dst);

        expect(segmentsToSend).toHaveLength(0);
    });

    describe("receive", () => {
        test("with SYN", () => {
            const dummyPeer: Peer = new PeerBuilder().buildActivePeer();
            dummyPeer.transitionTo(new StateListen());
            
            dummyPeer.ctrlBlock.dstEndpoint = {ip: "ipB", port:"portB"};
            const rcvSegment: Segment = new Segment(new SegmentHeader(dummyPeer.ctrlBlock.srcEndpoint, dummyPeer.ctrlBlock.dstEndpoint), []);
            rcvSegment.withSynEstablishment();
            rcvSegment.withSequenceNumber(42);
    
            const err: Error|null = dummyPeer["_connState"].processSegmentForReceiving(rcvSegment);
            expect(err).toEqual(null);
            expect(dummyPeer.events.getEventsByType(SimEventType.RESPOND_AFTER_GUARD)).toHaveLength(1);
        });

        test("without SYN", () => {
            const dummyPeer: Peer = new PeerBuilder().buildActivePeer();
            dummyPeer.transitionTo(new StateListen());
            
            dummyPeer.ctrlBlock.dstEndpoint = {ip: "ipB", port:"portB"};
            const rcvSegment: Segment = new Segment(new SegmentHeader(dummyPeer.ctrlBlock.srcEndpoint, dummyPeer.ctrlBlock.dstEndpoint), []);
            //rcvSegment.withSynEstablishment();
            rcvSegment.withSequenceNumber(42);
    
            const err: Error|null = dummyPeer["_connState"].processSegmentForReceiving(rcvSegment);
            
            expect(err).toBeInstanceOf(Error);
        });
        
    });
});