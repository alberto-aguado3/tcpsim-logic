import {describe, expect, test} from "@jest/globals";
import { Endpoint } from "../src/peer/endpoint";
import {ControlBits, SegmentHeader, Segment} from "../src/segment";

describe("segment creation", () => {
    const ctrlBits: ControlBits = new ControlBits();

    const src: Endpoint = {
        ip:"ip",
        port:"port"
    };
    const dst: Endpoint = Object.assign({}, src);

    const payload: string[] = ["H", "e", "l", "l", "o"];

    test("Success case", () => {
        const window = 3;

        let segment: Segment = new Segment(new SegmentHeader(src, dst), payload);
        segment.window = window;
    });

    test("window negative, should throw error", () => {       
        const window = -3;

        expect(() => {
            let segment: Segment = new Segment(new SegmentHeader(src, dst), payload);
            segment.window = window;
        }).toThrow("Window must be positive number, got -3");
    });
});
