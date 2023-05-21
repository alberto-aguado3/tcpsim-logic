import { Observer } from "./observer";

export abstract class Observable {
    private _observers: Observer[] = [];

    constructor() {
        //this._time = time;
    }

    public addObserver(observer: Observer): void {
        this._observers.push(observer);
    }

    public removeObserver(observer: Observer): void {
        this._observers = this._observers.filter(obs => obs !== observer);
    }

    public notifyObservers(value: any): void {
        this._observers.forEach(observer => observer.update(value));
    }
}