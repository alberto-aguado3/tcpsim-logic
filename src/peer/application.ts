

export class Application {
    private _dataToSend: string = "";
    private _dataReceived: string = "";

    constructor(){}

    public get dataToSend(): string {
        return this._dataToSend;
    }

    public get dataReceived(): string {
        return this._dataReceived;
    }

    public queueDataToSend(data: string) {
        this._dataToSend = this.dataToSend + data;
    }

    public retrieveNextNBytesToSend(bytes: number): string[] {
        const firstNBytes = this._dataToSend.slice(0, bytes);
        this._dataToSend = this._dataToSend.substring(bytes);

        return Array.from(firstNBytes);
    }

    public writeBytesReceived(bytes: string[]) {
        this._dataReceived =  this._dataReceived.concat(...bytes);
    }
}