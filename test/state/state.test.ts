import { EventCloseConn, EventRespondAfterGuard, SimEventType } from "../../src/event";
import { PeerBuilder } from "../../src/peer";

describe("State abstract class", () => {
    const currentTime = new Date(0).getTime();

    describe.each([
        {guard: 500, scheduledExec: [currentTime + 400]},
        {guard: 500, scheduledExec: []},
    ])("restartEventRespondAfterGuard", ({guard, scheduledExec}) => {
        test(`peer with ${scheduledExec.length} events RespondAfterGuard should end with 1 event`, () => {
            const peer = new PeerBuilder().setTimeGuardBeforeTransmitting(guard).buildActivePeer();
            scheduledExec.forEach(execTime => {
                const eventRespond = new EventRespondAfterGuard(new Date(execTime), peer);
                peer.events.insertEvent(eventRespond);
            });

            expect(peer.events.getEventsByType(SimEventType.RESPOND_AFTER_GUARD).length).toEqual(scheduledExec.length);

            peer["_connState"].restartEventRespondAfterGuard();

            expect(peer.events.getEventsByType(SimEventType.RESPOND_AFTER_GUARD).length).toEqual(1);
            expect(peer.events.getEventsByType(SimEventType.RESPOND_AFTER_GUARD)[0].executionTime.getTime()).toEqual(currentTime+guard);
        });
    });

    describe.each([
        {msl: 1000, scheduledExec: [currentTime + 400]},
        {msl: 1000, scheduledExec: []},
    ])("restartEventRespondAfterGuard", ({msl, scheduledExec}) => {
        test(`peer with ${scheduledExec.length} events RespondAfterGuard should end with 1 event`, () => {
            const peer = new PeerBuilder().setMsl(msl).buildActivePeer();
            scheduledExec.forEach(execTime => {
                const eventRespond = new EventCloseConn(new Date(execTime), peer);
                peer.events.insertEvent(eventRespond);
            });

            expect(peer.events.getEventsByType(SimEventType.CLOSE_CONN).length).toEqual(scheduledExec.length);

            peer["_connState"].restartCloseConn();

            expect(peer.events.getEventsByType(SimEventType.CLOSE_CONN).length).toEqual(1);
            expect(peer.events.getEventsByType(SimEventType.CLOSE_CONN)[0].executionTime.getTime()).toEqual(currentTime+2*msl);
        });
    });
});