
export class TerminationError extends Error {
    constructor() {
        super("Early segment processing termination");
        this.name = "TerminationError";
    }
}