import {Channel, Segment, SegmentHeader} from "../src";

describe("channel", ()=> {    
    const segmentFactory = (): Segment => {
        return new Segment(new SegmentHeader({ip: "src", port: ""},{ip: "dst", port: ""}), []);
    };

    describe.each([
        {newSegmentTimestampMs: 10, currentSegmentTimestampsMs: [], expectedTimestampsMs: [10], desc: "sorted insert, initially empty"},
        {newSegmentTimestampMs: 0, currentSegmentTimestampsMs: [1, 400], expectedTimestampsMs: [0, 1, 400], desc: "sorted insert start"},
        {newSegmentTimestampMs: 1, currentSegmentTimestampsMs: [0, 400], expectedTimestampsMs: [0, 1, 400], desc: "sorted insert middle"},
        {newSegmentTimestampMs: 400, currentSegmentTimestampsMs: [0, 1], expectedTimestampsMs: [0, 1, 400], desc: "sorted insert end"},
        //{newSegmentTimestampMs: 30, currentSegmentTimestampsMs: [0, 400, 401, 31], expectedTimestampsMs: [0, 30, 400, 401, 31], desc: "array is not ordeded, only inserted element is sorted"},

    ])("inserting ordered lost segments", ({newSegmentTimestampMs, currentSegmentTimestampsMs, expectedTimestampsMs, desc}) => {
        test(`should return dates (in ms) as: ${expectedTimestampsMs}, in case: ${desc}`, () => {
            const channel: Channel = new Channel(0, 0);
            currentSegmentTimestampsMs.forEach((dateMs) => {
                channel.addLostSegment(segmentFactory(), new Date(dateMs));
            });

            //const currentTimestamps: Date[] = currentSegmentTimestampsMs.map((dateMs) => new Date(dateMs));

            expect(channel.lostSegments.map(pair => pair.date.getTime())).toEqual(currentSegmentTimestampsMs);

            channel.addLostSegment(segmentFactory(), new Date(newSegmentTimestampMs));

            expect(channel.lostSegments.map(pair => pair.date.getTime())).toEqual(expectedTimestampsMs);
        });
    });

    describe.each([
        {newSegmentTimestampMs: 10, currentSegmentTimestampsMs: [], expectedTimestampsMs: [10], desc: "sorted insert, initially empty"},
        {newSegmentTimestampMs: 0, currentSegmentTimestampsMs: [1, 400], expectedTimestampsMs: [0, 1, 400], desc: "sorted insert start"},
        {newSegmentTimestampMs: 1, currentSegmentTimestampsMs: [0, 400], expectedTimestampsMs: [0, 1, 400], desc: "sorted insert middle"},
        {newSegmentTimestampMs: 400, currentSegmentTimestampsMs: [0, 1], expectedTimestampsMs: [0, 1, 400], desc: "sorted insert end"},
        //{newSegmentTimestampMs: 30, currentSegmentTimestampsMs: [0, 400, 401, 31], expectedTimestampsMs: [0, 30, 400, 401, 31], desc: "array is not ordeded, only inserted element is sorted"},

    ])("inserting ordered delivered segments", ({newSegmentTimestampMs, currentSegmentTimestampsMs, expectedTimestampsMs, desc}) => {
        test(`should return dates (in ms) as: ${expectedTimestampsMs}, in case: ${desc}`, () => {
            const channel: Channel = new Channel(0, 0);
            currentSegmentTimestampsMs.forEach((dateMs) => {
                channel.addDeliveredSegment(segmentFactory(), new Date(dateMs));
            });

            //const currentTimestamps: Date[] = currentSegmentTimestampsMs.map((dateMs) => new Date(dateMs));

            expect(channel.deliveredSegments.map(pair => pair.date.getTime())).toEqual(currentSegmentTimestampsMs);

            channel.addDeliveredSegment(segmentFactory(), new Date(newSegmentTimestampMs));

            expect(channel.deliveredSegments.map(pair => pair.date.getTime())).toEqual(expectedTimestampsMs);
        });
    });
});