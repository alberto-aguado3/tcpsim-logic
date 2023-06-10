export class DataBuffer {
    private _data: BufferCell[] = [];
    private _dataOffset: number = 0;

    constructor(size?: number) {
        if (size) {
            this._data = Array(size).fill(undefined);
        }
    }

    public setDataOffset(offset: number): void {
        this._dataOffset = offset;
    }

    public get capacity(): number {
        return this._data.length;
    }

    public set capacity(size: number) {
        this._data = Array(size).fill(undefined);
    }

    public flush(): void {
        this._data = this._data.map(() => undefined);
    }

    public write(data: string[]): Error | null {
        if (data.length > this.capacity) {
            return new RangeError(`buffer.Write - data length [${data.length}] exceeds buffer length [${this.capacity}]`);
        }

        this._data = this._data.map((elem, index) => {
            return data[index];
        });

        return null;
    }

    public read(): string[] {
        const res: string[] =  this._data.filter((elem): elem is string => {
            return elem != undefined;
        });

        return res;
    }

    public dumpContent(): BufferCell[] {
        return this._data;
    }

    public readChunk(start: number, cells: number): string[] {
        const buffIndex = this.removeOffsetToNumber(start);

        const chunk: BufferCell[] = this._data.slice(buffIndex, buffIndex+cells);

        return chunk.filter((elem): elem is string => elem != undefined);
    }

    public writeChunk(start: number, data: string[]): Error | null {
        const buffIndex = this.removeOffsetToNumber(start);
        if (buffIndex + data.length > this.capacity) {
            return new RangeError(`buffer.WriteChunk - data length [${data.length}] starting at [${start}] exceeds buffer range [${this._dataOffset},${this._dataOffset+this.capacity})`);
        }

        for (let i: number = buffIndex; i < buffIndex + data.length; i++) {
            this._data[i] = data[i-buffIndex];
        }
        return null;
    }

    public isChunkPopulated(start: number, cells: number): boolean {
        const buffIndex = this.removeOffsetToNumber(start);
        for (let i = buffIndex; i < buffIndex+cells; i++) {
            if (this._data[i] != undefined) {
                return true;
            }
        }

        return false;
    }

    public firstEmptyCell(): number {
        for (let i = 0; i < this._data.length; i++) {
            if (this._data[i] == undefined) {
                return i + this._dataOffset;
            }
        }
        return this._data.length + this._dataOffset;
    }

    public removeOffsetToNumber(number: number): number {
        return number - this._dataOffset;
    }

    //TODO: testear que lo tire palante la cantidad adecuada
    public shiftDataOffsetForward(): void {
        this._dataOffset += this.capacity;
    }
}

type BufferCell = string|undefined;