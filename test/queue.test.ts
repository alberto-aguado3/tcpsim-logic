import { EventCloseConn, EventQueue, SimulationEvent } from "../src/event";
import { Peer, PeerBuilder } from "../src/peer";

describe("Event queue", () => {
    const eventFactory = function(timeMili: number): SimulationEvent {
        const dummyPeer: Peer = new PeerBuilder().buildActivePeer();
        const event = new EventCloseConn(new Date(timeMili), dummyPeer);
        return event;
    };

    describe.each([
        {events: [100, 400, 300],  expected: [100, 300, 400]},
        //TODO: add events with same time... though should never happen in simulation
    ])("inserting events in order", ({events, expected}) => {
        test(`total events: ${events.length}, with times ${events}, expecting ${expected}`, () => {
            const queue = new EventQueue();
            events.forEach((time) => {
                queue.insertEvent(eventFactory(time));
            });

            const actualTimes = queue["_events"].map((elem) => elem.executionTime.getTime());

            expect(actualTimes).toEqual(expected);
        });
    });

    describe.each([
        {events: [100, 400, 300], expected: 100, remainingEvents: [300, 400]},
        {events: [400, 300], expected: 300, remainingEvents: [400]},
        {events: [400, 300, 100], expected: 100, remainingEvents: [300, 400]},
        {events: [], expected: undefined, remainingEvents: []},
    ])("extracting next event in chronological order", ({events, expected, remainingEvents}) => {
        test(`events with timeouts ${events}, expecting ${remainingEvents}`, () => {
            const queue = new EventQueue();
            events.forEach((time) => {
                queue.insertEvent(eventFactory(time));
            });

            const actualEvent = queue.retrieveNextEvent();
            const actualTimes = queue["_events"].map((elem) => elem.executionTime.getTime());
    
            expect(actualEvent?.executionTime.getTime()).toEqual(expected);
            expect(actualTimes).toEqual(remainingEvents);
        });



    });
});