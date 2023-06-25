import {Channel, Segment, SegmentHeader} from "../src";

describe("channel", ()=> {    
    const segmentFactory = (): Segment => {
        const newSegment = new Segment(new SegmentHeader({ip: "src", port: ""},{ip: "dst", port: ""}), []);
        return newSegment;
    };

    describe.each([
        {newSegmentTimestampMs: 10, currentSegmentTimestampsMs: [], expectedTimestampsMs: [10], desc: "sorted insert, initially empty"},
        {newSegmentTimestampMs: 0, currentSegmentTimestampsMs: [1, 400], expectedTimestampsMs: [0, 1, 400], desc: "sorted insert start"},
        {newSegmentTimestampMs: 1, currentSegmentTimestampsMs: [0, 400], expectedTimestampsMs: [0, 1, 400], desc: "sorted insert middle"},
        {newSegmentTimestampMs: 400, currentSegmentTimestampsMs: [0, 1], expectedTimestampsMs: [0, 1, 400], desc: "sorted insert end"},
        //{newSegmentTimestampMs: 30, currentSegmentTimestampsMs: [0, 400, 401, 31], expectedTimestampsMs: [0, 30, 400, 401, 31], desc: "array is not ordeded, only inserted element is sorted"},

    ])("inserting ordered created segments by createdAt", ({newSegmentTimestampMs, currentSegmentTimestampsMs, expectedTimestampsMs, desc}) => {
        test(`should return dates (in ms) as: [${expectedTimestampsMs}], in case: ${desc}`, () => {
            const channel: Channel = new Channel(0, 0);
            currentSegmentTimestampsMs.forEach((dateMs) => {
                channel.addWanderingSegment(segmentFactory(), new Date(dateMs));
            });

            expect(channel.wanderingSegments.map(pair => pair.createdAt.getTime())).toEqual(currentSegmentTimestampsMs);

            channel.addWanderingSegment(segmentFactory(), new Date(newSegmentTimestampMs));

            expect(channel.wanderingSegments.map(pair => pair.createdAt.getTime())).toEqual(expectedTimestampsMs);
        });
    });

    describe.each([
        {segmentCurrentIndexToMove: 1, currentMs: [0, 400], expectedCurrentMs: [0], deliveredMs: [], expectedDeliveredMs: [400]},
        {segmentCurrentIndexToMove: 0, currentMs: [0, 400], expectedCurrentMs: [400], deliveredMs: [], expectedDeliveredMs: [0]},
        {segmentCurrentIndexToMove: 0, currentMs: [0, 400], expectedCurrentMs: [400], deliveredMs: [], expectedDeliveredMs: [0]},
        

    ])("moving a segment to DELIVERED", ({segmentCurrentIndexToMove, currentMs, expectedCurrentMs, deliveredMs, expectedDeliveredMs}) => {
        test(`should remove element ${currentMs[segmentCurrentIndexToMove]} in current: ${currentMs}, to delivered`, () => {
            const channel: Channel = new Channel(0, 0);
            currentMs.forEach((dateMs) => {
                channel.addWanderingSegment(segmentFactory(), new Date(dateMs));
            });

            deliveredMs.forEach((dateMs) => {
                const segment = segmentFactory();
                channel.addWanderingSegment(segment, new Date(dateMs));
                channel.moveToDelivered(segment.id, new Date(dateMs));
            });

            expect(channel.deliveredSegments.length).toEqual(deliveredMs.length);
            expect(channel.wanderingSegments.length).toEqual(currentMs.length);


            const segmentToMoveId = channel.wanderingSegments[segmentCurrentIndexToMove].segment.id;
            channel.moveToDelivered(segmentToMoveId, new Date(0));

            expect(channel.wanderingSegments.map(segWithTime => segWithTime.createdAt.getTime())).toEqual(expectedCurrentMs);
            expect(channel.deliveredSegments.map(segWithTime => segWithTime.createdAt.getTime())).toEqual(expectedDeliveredMs);
        });
    });

    describe("remove not existing element, should not make changes", () => {
        const idToRemove: string = "someId";

        const currentMs = [0, 400];
        const channel: Channel = new Channel(0, 0);
        currentMs.forEach((dateMs) => {
            channel.addWanderingSegment(segmentFactory(), new Date(dateMs));
        });

        expect(channel.wanderingSegments.map(segmentWithTimestamp => segmentWithTimestamp.segment.id)).not.toContain(idToRemove);
    });
});