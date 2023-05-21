import {Application} from "../src/peer";

describe("application reading and writing", ()=> {    
    describe.each([
        {data: "Hola mundo", expected: "Hola mundo", n: 0, expectedAfterRead: "Hola mundo"},
        {data: "Hola mundo", expected: "Hola mundo", n: 3, expectedAfterRead: "a mundo"},
    ])("reading data to send", ({data, expected, n, expectedAfterRead}) => {
        test(`should initialize given [${data}] and match with expected [${expected}]`, () => {
            const application = new Application();
            
            application.queueDataToSend(data);

            expect(application.dataToSend).toEqual(expected);
        });

        test("reading first n bytes", () => {
            const application = new Application();

            application.queueDataToSend(data);
            application.retrieveNextNBytesToSend(n);

            expect(application.dataToSend).toEqual(expectedAfterRead);
        });
    });

    describe.each([
        {initial: ["S", "o", "m", "e", "t", "h", "i", "n", "g"], toWrite: [" ", "u", "s", "e", "f", "u", "l"], expected: "Something useful"},
        {initial: ["S", "o", "m", "e", "t", "h", "i", "n", "g"], toWrite: [""], expected: "Something"},
    ])("writing bytes to data received from other peer", ({initial, toWrite, expected}) => {
        test(`have ${initial}, write ${toWrite}, want ${expected}`, () => {
            const application = new Application();
            application.writeBytesReceived(initial);

            application.writeBytesReceived(toWrite);

            expect(application.dataReceived).toEqual(expected);
        });
    });
});