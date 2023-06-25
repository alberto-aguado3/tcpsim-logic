import {SimConfig, PeerConfig, ChannelConfig, Simulation} from "../src/simulation";
import { ConnectionState } from "../src/peer/connection-state";

describe("end-to-end tests, ensuring data is transfered", () => {
    const maxSteps = 500;

    
    test("data only from A to B", () => {
        const sharedMss = 10;
        const sharedMaxAnnWindow = 10;
        const sharedRcvBufCap = 10;

        const activeCfg: PeerConfig = {
            applicationData: "Hello Amigos",
            mss: sharedMss,
            maxAnnounceableWindow: sharedMaxAnnWindow,
            recvBuffCapacity: sharedRcvBufCap,

            endpoint: {
                ip:"ipActivo",
                port:"8080"
            }
        };

        const passiveCfg: PeerConfig = {
            applicationData: "",
            mss: sharedMss,
            maxAnnounceableWindow: sharedMaxAnnWindow,
            recvBuffCapacity: sharedRcvBufCap,

            endpoint: {
                ip:"ipPasivo",
                port:"8080"
            }
        };

        const chanCfg: ChannelConfig = {
            lossPercent: 0,
            rtt: 2*1000, //2ms
        };

        const simCfg: SimConfig = {
            active: activeCfg,
            passive: passiveCfg,
            channel: chanCfg
        };

        const simulator: Simulation = new Simulation();
        simulator.loadConfig(simCfg);
        
        let err = simulator.startSimulation();
        expect(err).toBeNull();

        for (let i = 0; i < maxSteps; i++) {
            if (!simulator.runNextStep()) {
                console.log("finished iterating at step " + String(i));
                break;
            };
        }

        expect(simulator.passivePeer.application.getDataReceived()).toEqual(activeCfg.applicationData);

    });

    test("data both ways", () => {
        const sharedMss = 10;
        const sharedMaxAnnWindow = 10;
        const sharedRcvBufCap = 10;

        const activeCfg: PeerConfig = {
            applicationData: "Hello Amigos",
            mss: sharedMss,
            maxAnnounceableWindow: sharedMaxAnnWindow,
            recvBuffCapacity: sharedRcvBufCap,

            endpoint: {
                ip:"ipActivo",
                port:"8080"
            }
        };

        const passiveCfg: PeerConfig = {
            applicationData: "Responding with something else, I will close connection second",
            mss: sharedMss,
            maxAnnounceableWindow: sharedMaxAnnWindow,
            recvBuffCapacity: sharedRcvBufCap,

            endpoint: {
                ip:"ipPasivo",
                port:"8080"
            }
        };

        const chanCfg: ChannelConfig = {
            lossPercent: 0,
            rtt: 2*1000, //2ms
        };

        const simCfg: SimConfig = {
            active: activeCfg,
            passive: passiveCfg,
            channel: chanCfg
        };

        const simulator: Simulation = new Simulation();
        simulator.loadConfig(simCfg);

        let err = simulator.startSimulation();
        expect(err).toBeNull();

        for (let i = 0; i < maxSteps; i++) {
            if (!simulator.runNextStep()) {
                console.log("finished iterating at step " + String(i));
                break;
            };
        }

        expect(simulator.passivePeer.application.getDataReceived()).toEqual(activeCfg.applicationData);
        expect(simulator.activePeer.application.getDataReceived()).toEqual(passiveCfg.applicationData);

    });

    test("data only from A to B with loss chance", () => {
        const sharedMss = 10;
        const sharedMaxAnnWindow = 10;
        const sharedRcvBufCap = 10;

        const activeCfg: PeerConfig = {
            applicationData: "Hello Amigos",
            mss: sharedMss,
            maxAnnounceableWindow: sharedMaxAnnWindow,
            recvBuffCapacity: sharedRcvBufCap,

            endpoint: {
                ip:"ipActivo",
                port:"8080"
            }
        };

        const passiveCfg: PeerConfig = {
            applicationData: "",
            mss: sharedMss,
            maxAnnounceableWindow: sharedMaxAnnWindow,
            recvBuffCapacity: sharedRcvBufCap,

            endpoint: {
                ip:"ipPasivo",
                port:"8080"
            }
        };

        const chanCfg: ChannelConfig = {
            lossPercent: 20,
            rtt: 2*1000, //2ms
        };

        const simCfg: SimConfig = {
            active: activeCfg,
            passive: passiveCfg,
            channel: chanCfg
        };

        const simulator: Simulation = new Simulation();
        simulator.loadConfig(simCfg);

        let err = simulator.startSimulation();
        expect(err).toBeNull();

        for (let i = 0; i < maxSteps; i++) {

            if (!simulator.runNextStep()) {
                console.log("finished iterating at step " + String(i));
                break;
            };
        }

        expect(simulator.passivePeer.application.getDataReceived()).toEqual(activeCfg.applicationData);

    });

    test("data only from A to B, multiple segments while ESTABLISHED", () => {
        const sharedMss = 4;
        const sharedMaxAnnWindow = 10;
        const sharedRcvBufCap = 10;

        const activeCfg: PeerConfig = {
            applicationData: "Hello Amigos, Afayaivos.",
            mss: sharedMss,
            maxAnnounceableWindow: sharedMaxAnnWindow,
            recvBuffCapacity: sharedRcvBufCap,

            endpoint: {
                ip:"ipActivo",
                port:"8080"
            }
        };

        const passiveCfg: PeerConfig = {
            applicationData: "",
            mss: sharedMss,
            maxAnnounceableWindow: sharedMaxAnnWindow,
            recvBuffCapacity: sharedRcvBufCap,

            endpoint: {
                ip:"ipPasivo",
                port:"8080"
            }
        };

        const chanCfg: ChannelConfig = {
            lossPercent: 0,
            rtt: 2*1000, //2ms
        };

        const simCfg: SimConfig = {
            active: activeCfg,
            passive: passiveCfg,
            channel: chanCfg
        };

        const simulator: Simulation = new Simulation();
        simulator.loadConfig(simCfg);

        let err = simulator.startSimulation();
        expect(err).toBeNull();

        for (let i = 0; i < maxSteps; i++) {

            if (!simulator.runNextStep()) {
                console.log("finished iterating at step " + String(i));
                break;
            };
        }

        expect(simulator.passivePeer.application.getDataReceived()).toEqual(activeCfg.applicationData);

    });

    test("data both ways with multiple segments", () => {
        const sharedMss = 4;
        const sharedMaxAnnWindow = 10;
        const sharedRcvBufCap = 10;

        const activeCfg: PeerConfig = {
            applicationData: "Hello Amigos",
            mss: sharedMss,
            maxAnnounceableWindow: sharedMaxAnnWindow,
            recvBuffCapacity: sharedRcvBufCap,

            endpoint: {
                ip:"ipActivo",
                port:"8080"
            }
        };

        const passiveCfg: PeerConfig = {
            applicationData: "Responding with something else, I will close connection second",
            mss: sharedMss,
            maxAnnounceableWindow: sharedMaxAnnWindow,
            recvBuffCapacity: sharedRcvBufCap,

            endpoint: {
                ip:"ipPasivo",
                port:"8080"
            }
        };

        const chanCfg: ChannelConfig = {
            lossPercent: 0,
            rtt: 2*1000, //2ms
        };

        const simCfg: SimConfig = {
            active: activeCfg,
            passive: passiveCfg,
            channel: chanCfg
        };

        const simulator: Simulation = new Simulation();
        simulator.loadConfig(simCfg);

        let err = simulator.startSimulation();
        expect(err).toBeNull();

        for (let i = 0; i < maxSteps; i++) {
            if (!simulator.runNextStep()) {
                console.log("finished iterating at step " + String(i));
                break;
            };
        }

        expect(simulator.passivePeer.application.getDataReceived()).toEqual(activeCfg.applicationData);
        expect(simulator.activePeer.application.getDataReceived()).toEqual(passiveCfg.applicationData);

    });

    test("data both ways with multiple segments and loss chance", () => {
        const sharedMss = 4;
        const sharedMaxAnnWindow = 10;
        const sharedRcvBufCap = 10;

        const activeCfg: PeerConfig = {
            applicationData: "Hello Amigos",
            mss: sharedMss,
            maxAnnounceableWindow: sharedMaxAnnWindow,
            recvBuffCapacity: sharedRcvBufCap,

            endpoint: {
                ip:"ipActivo",
                port:"8080"
            }
        };

        const passiveCfg: PeerConfig = {
            applicationData: "Responding with something else, I will close connection second",
            mss: sharedMss,
            maxAnnounceableWindow: sharedMaxAnnWindow,
            recvBuffCapacity: sharedRcvBufCap,

            endpoint: {
                ip:"ipPasivo",
                port:"8080"
            }
        };

        const chanCfg: ChannelConfig = {
            lossPercent: 5,
            rtt: 2*1000, //2ms
        };

        const simCfg: SimConfig = {
            active: activeCfg,
            passive: passiveCfg,
            channel: chanCfg
        };

        const simulator: Simulation = new Simulation();
        simulator.loadConfig(simCfg);

        let err = simulator.startSimulation();
        expect(err).toBeNull();

        for (let i = 0; i < maxSteps; i++) {
            /*
            let activePeer = simulator.activePeer;
            let passivePeer = simulator.passivePeer;
            
            if (i >= 13 && i < 35) {

                console.log("Iteration ", i, "\n",
                //"Simulation time: ", simulator["_simulationClock"].simulationTime, "\n",
                //"Active peer events: ", inspect(simulator.activePeer.events), "|| state: ", getNameOfState(simulator.activePeer.ctrlBlock.connState), `ip: ${activePeer.ctrlBlock.srcEndpoint.ip}`, "\n",
                //"Passive peer events: ", inspect(simulator.passivePeer.events), "|| state: ", getNameOfState(simulator.passivePeer.ctrlBlock.connState), `ip: ${passivePeer.ctrlBlock.srcEndpoint.ip}`,"\n",
                getNameOfState(simulator.activePeer.ctrlBlock.connState), `ip: ${activePeer.ctrlBlock.srcEndpoint.ip}`, getNameOfState(simulator.passivePeer.ctrlBlock.connState), `ip: ${passivePeer.ctrlBlock.srcEndpoint.ip}`,"\n",
                //"Channel events: ", inspect(simulator["_channel"].events), "\n",
                //"Active peer block: ", inspect(activePeer.ctrlBlock), "\n",
                //"Passive peer block: ", inspect(passivePeer.ctrlBlock), "\n",
                //"active simTime: ", activePeer.absSimulationTime, "\n",
                //"passive simTime: ", passivePeer.absSimulationTime, "\n",
                //"simulator simTime: ", simulator["_simulationClock"].simulationTime, "\n",
                //"passive recvBuffer: ", inspect(passivePeer.recvBuffer), "\n",
                "active sendBuffer: ", inspect(activePeer.sendBuffer), "\n",
                //"passive sendBuffer: ", inspect(passivePeer.sendBuffer), "\n",
                //"active recvBuffer: ", inspect(activePeer.recvBuffer), "\n",
                //"passive sendAppData: ", passivePeer.application.dataToSend, " | active recvAppData: ", activePeer.application.dataReceived, "\n",
                "active sendAppData: ", activePeer.application.dataToSend, " | passive recvAppData: ", passivePeer.application.dataReceived, "\n",
                );

            }
            */

            if (!simulator.runNextStep()) {
                console.log("finished iterating at step " + String(i));
                break;
            };
        }

        expect(simulator.passivePeer.application.getDataReceived()).toEqual(activeCfg.applicationData);
        //expect(simulator.activePeer.application.dataReceived).toEqual(passiveCfg.applicationData);

    });

});

function getNameOfState(state: ConnectionState): string {
    let algo = ConnectionState[state];
    return algo;
}