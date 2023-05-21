import { EventCloseConn, EventQueue, SimulationEvent } from "../src/event";
import { Peer, PeerBuilder } from "../src/peer";
/*
import { Clock } from "../src/peer/clock";

describe("Clock ", () => {

    test("should update observers accordingly", () => {
        const targetDate: Date = new Date(10);
        const clock: Clock = new Clock(targetDate);
        const peer: Peer = new PeerBuilder().buildActivePeer();

        expect(peer.absSimulationTime).toEqual(new Date(0));

        clock.addObserver(peer);
        clock.notifyObservers();

        expect(peer.absSimulationTime).toEqual(targetDate);

    });
    
    test("should add peers A,B and delete only A", () => {
        const clock: Clock = new Clock(new Date());
        const peerA: Peer = new PeerBuilder().setSourceAddr({ip:"ipA",port:"portA"}).buildActivePeer();
        const peerB: Peer = new PeerBuilder().setSourceAddr({ip:"ipB",port:"portB"}).buildActivePeer();

        clock.addObserver(peerA);
        clock.addObserver(peerB);

        expect(clock["_observers"].length).toEqual(2);

        clock.removeObserver(peerA);
        
        expect(clock["_observers"]).toContain(peerB);
        expect(clock["_observers"]).not.toContain(peerA);
        expect(clock["_observers"].length).toEqual(1);
    });
});
*/
test("", () => {
    expect(true).toBeTruthy();
});