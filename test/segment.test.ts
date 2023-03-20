import {describe, expect, test} from "@jest/globals";
import {ControlBits, SegmentHeader, Segment} from "../src/segment";

describe("segment creation", () => {
    const ctrlBits: ControlBits = new ControlBits();

    const seq: number = 1, ack: number = 2;

    const payload: string[] = ["H", "e", "l", "l", "o"];

    test("Success case", () => {
        const window = 3;

        let segment: Segment = new Segment(new SegmentHeader(seq, ack, window, ctrlBits), payload);
    });

    test("window negative, should throw error", () => {       
        const window = -3;

        expect(() => {
            let segment: Segment = new Segment(new SegmentHeader(seq, ack, window, ctrlBits), payload);
        }).toThrow("Window must be positive number, got -3");
    });
});
