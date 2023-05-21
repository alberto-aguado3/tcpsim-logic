import {describe, expect, test} from "@jest/globals";
import {DataBuffer} from "../src/peer";

describe("buffer: reading and writing", () => {

    describe.each([
        {cap: 8, bytes: 8, expected: null},
        {cap: 8, bytes: 6, expected: null},
        {cap: 8, bytes: 9, expected: new RangeError("buffer.Write - data length [9] exceeds buffer length [8]")},
        {cap: 4, bytes: 0, expected: null}
    ])("write $bytes in buffer with length $cap", ({cap, bytes, expected}) => {
        test(`returns error: ${expected}`, () => {
            const buffer = new DataBuffer(cap);
            const data = Array(bytes).fill("x");

            const actualErr = buffer.write(data);

            expect(actualErr).toEqual(expected);
        });
    });

    describe.each([
        {capacity: 5, bytes: "12345", expected: ["1", "2", "3", "4", "5"]},
        {capacity: 5, bytes: "34", expected: ["3", "4"]},
    ])("read bytes", ({capacity, bytes, expected})=>{
        test(`returns same, in array form: ${expected}`, () => {
            const buffer = new DataBuffer(capacity);
            const data = Array.from(bytes);

            const actualErr = buffer.write(data);

            const actualData = buffer.read();

            expect(actualData).toEqual(expected);
            expect(actualErr).toBeNull();
            expect(actualData).toHaveLength(expected.length);
        });
    }); 
});

describe("buffer: reading and writing chunks", () => {
    const bufferFactory = (capacity: number, dataOffset: number, data?: string[], dataPlace?: number): DataBuffer => {
        const buf = new DataBuffer(capacity);
        buf.setDataOffset(dataOffset);
        if (data) {
            const err = buf.writeChunk(dataPlace!, data);
            if (err) {
                console.log(err.message);
            }
        }
        return buf;
    };

    describe.each([
        {capacity: 5, dataOffset: 0, start: 3, data: ["a", "b"], expectedError: null},
        {capacity: 5, dataOffset: 31, start: 34, data: ["a", "b"], expectedError: null},
        {capacity: 5, dataOffset: 31, start: 35, data: ["a", "b"], expectedError: new RangeError("buffer.WriteChunk - data length [2] starting at [35] exceeds buffer range [31,36)")},
        {capacity: 5, dataOffset: 50, start: 51, data: ["a", "b", "c", "d"], expectedError: null},
        {capacity: 5, dataOffset: 50, start: 50, data: ["a", "b", "c", "d"], expectedError: null},
        {capacity: 5, dataOffset: 50, start: 50, data: ["a", "b", "c", "d", "e"], expectedError: null},

    ])("writing chunks", ({capacity, dataOffset, start, data, expectedError}) => {
        test(`positions [${start}, ${start+data.length}), with capacity ${capacity}`, () => {
            const buffer = bufferFactory(capacity, dataOffset);

            const actualErr = buffer.writeChunk(start, data);

            expect(actualErr).toEqual(expectedError);
        });
    });

    describe.each([
        {capacity: 5, dataOffset: 0, readStart: 0, data: ["a", "b"], dataStart: 0, dataToRead: 2, expected: ["a", "b"]},
        {capacity: 5, dataOffset: 0, readStart: 1, data: ["a", "b"], dataStart: 0, dataToRead: 2, expected: ["b"]},
        {capacity: 5, dataOffset: 0, readStart: 0, data: ["a", "b"], dataStart: 0, dataToRead: 1, expected: ["a"]},
        {capacity: 5, dataOffset: 11, readStart: 11, data: ["a", "b", "c", "d", "e"], dataStart: 11, dataToRead: 5, expected: ["a", "b", "c", "d", "e"]},
        {capacity: 5, dataOffset: 11, readStart: 13, data: ["a", "b", "c", "d", "e"], dataStart: 11, dataToRead: 5, expected: ["c", "d", "e"]},
        {capacity: 5, dataOffset: 11, readStart: 13, data: ["a", "b", "c", "d", "e"], dataStart: 11, dataToRead: 3, expected: ["c", "d", "e"]},
        {capacity: 5, dataOffset: 11, readStart: 13, data: ["a", "b", "c", "d", "e"], dataStart: 11, dataToRead: 2, expected: ["c", "d"]},
    ])("reading chunks", ({capacity, dataOffset, readStart, data, dataStart, dataToRead, expected}) => {
        test(`reading ${dataToRead} cells, initial data ${data} with offset ${dataStart-dataOffset}, expecting ${expected}`, () => {
            const buffer = bufferFactory(capacity, dataOffset, data, dataStart);

            const actual = buffer.readChunk(readStart, dataToRead);

            expect(actual).toEqual(expected);
        });
    });

    describe.each([
        {capacity: 5, dataOffset: 0, readStart: 0, data: ["a", "b"], dataStart: 0, dataToRead: 3, expected: true},
        {capacity: 5, dataOffset: 0, readStart: 0, data: [], dataStart: 0, dataToRead: 5, expected: false},
        {capacity: 5, dataOffset: 0, readStart: 0, data: [], dataStart: 0, dataToRead: 1, expected: false},
        {capacity: 5, dataOffset: 0, readStart: 0, data: ["a", "b"], dataStart: 1, dataToRead: 2, expected: true},
        {capacity: 5, dataOffset: 0, readStart: 0, data: ["a", "b"], dataStart: 2, dataToRead: 2, expected: false},
    ])("is chunk populated", ({capacity, dataOffset, readStart, data, dataStart, dataToRead, expected}) => {
        test("testName", () => {
            const buffer = bufferFactory(capacity, dataOffset, data, dataStart);

            const isPopulated = buffer.isChunkPopulated(readStart, dataToRead);

            expect(isPopulated).toEqual(expected);
        });
    });

    describe.each([
        {capacity: 5, dataOffset: 0, data: ["a", "b"], dataStart: 0, expected: 2},
        {capacity: 5, dataOffset: 0, data: [], dataStart: 0, expected: 0},
        {capacity: 5, dataOffset: 0,  data: ["a", "b"], dataStart: 1, expected: 0},
        {capacity: 5, dataOffset: 0, data: ["a", "b"], dataStart: 2, expected: 0},
        {capacity: 5, dataOffset: 31, data: ["a", "b"], dataStart: 31, expected: 33},
        {capacity: 5, dataOffset: 31, data: ["a", "b", "c", "d"], dataStart: 31, expected: 35},
        {capacity: 5, dataOffset: 31, data: ["a", "b", "c", "d"], dataStart: 32, expected: 31},
        {capacity: 5, dataOffset: 31, data: ["a", "b", "c", "d", "e"], dataStart: 31, expected: 36},
    ])("first empty cell", ({capacity, dataOffset, data, dataStart, expected}) => {
        test(`data starting at ${dataStart - dataOffset} (${dataStart} - ${dataOffset}), writing data ${data}`, () => {
            const buffer = bufferFactory(capacity, dataOffset, data, dataStart);

            const index = buffer.firstEmptyCell();

            expect(index).toEqual(expected);
        });
    });
});