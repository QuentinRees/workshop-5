"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../src/index");
const consensus_1 = require("../../src/nodes/consensus");
const utils_1 = require("../../src/utils");
const config_1 = require("../../src/config");
const utils_2 = require("./utils");
function generateRandomValue() {
    return Math.round(Math.random());
}
function closeAllServers(servers) {
    return __awaiter(this, void 0, void 0, function* () {
        yield Promise.all(servers.map((server) => server.close(() => {
            server.closeAllConnections();
        })));
        yield (0, utils_1.delay)(50);
    });
}
describe("Ben-Or decentralized consensus algorithm", () => {
    describe("Project is setup correctly - 4 pt", () => {
        let servers = [];
        afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, consensus_1.stopConsensus)(servers.length);
            yield (0, utils_1.delay)(100);
            yield closeAllServers(servers);
            servers.splice(0);
        }));
        it("Can start 2 healthy nodes and 1 faulty node - 2pts", () => __awaiter(void 0, void 0, void 0, function* () {
            const faultyArray = [true, false, false];
            const initialValues = [1, 1, 1];
            servers = yield (0, index_1.launchNetwork)(faultyArray.length, faultyArray.filter((el) => el === true).length, initialValues, faultyArray);
            yield (0, utils_1.delay)(200);
            for (let index = 0; index < 3; index++) {
                yield fetch(`http://localhost:${config_1.BASE_NODE_PORT + index}/status`)
                    .then((res) => {
                    if (faultyArray[index]) {
                        expect(res.status).toBe(500);
                    }
                    return res.text();
                })
                    .then((body) => {
                    if (faultyArray[index]) {
                        expect(body).toBe("faulty");
                    }
                    else {
                        expect(body).toBe("live");
                    }
                });
            }
        }));
        it("Can start 8 healthy nodes and 2 faulty nodes - 2 pts", () => __awaiter(void 0, void 0, void 0, function* () {
            const faultyArray = [
                true,
                false,
                false,
                false,
                false,
                true,
                false,
                false,
                false,
                false,
            ];
            const initialValues = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
            servers = yield (0, index_1.launchNetwork)(faultyArray.length, faultyArray.filter((el) => el === true).length, initialValues, faultyArray);
            yield (0, utils_1.delay)(200);
            for (let index = 0; index < faultyArray.length; index++) {
                yield fetch(`http://localhost:${config_1.BASE_NODE_PORT + index}/status`)
                    .then((res) => {
                    if (faultyArray[index]) {
                        expect(res.status).toBe(500);
                    }
                    return res.text();
                })
                    .then((body) => {
                    if (faultyArray[index]) {
                        expect(body).toBe("faulty");
                    }
                    else {
                        expect(body).toBe("live");
                    }
                });
            }
        }));
    });
    describe("Testing Ben-Or implementation - 16 pt", () => {
        const servers = [];
        afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, consensus_1.stopConsensus)(servers.length);
            yield (0, utils_1.delay)(100);
            yield closeAllServers(servers);
            servers.splice(0);
        }));
        const timeLimit = 2000; // 2s
        it("Finality is reached - Unanimous Agreement - 2 pt", () => __awaiter(void 0, void 0, void 0, function* () {
            const faultyArray = [false, false, false, false, false];
            const initialValues = [1, 1, 1, 1, 1];
            const _servers = yield (0, index_1.launchNetwork)(faultyArray.length, faultyArray.filter((el) => el === true).length, initialValues, faultyArray);
            servers.push(..._servers);
            yield (0, consensus_1.startConsensus)(faultyArray.length);
            const time = new Date().getTime();
            let states = yield (0, utils_2.getNodesState)(faultyArray.length);
            while (new Date().getTime() - time < timeLimit &&
                !(0, utils_2.reachedFinality)(states)) {
                yield (0, utils_1.delay)(200);
                states = yield (0, utils_2.getNodesState)(faultyArray.length);
            }
            for (let index = 0; index < states.length; index++) {
                const state = states[index];
                if (faultyArray[index]) {
                    expect(state.decided).toBeNull();
                    expect(state.x).toBeNull();
                    expect(state.k).toBeNull();
                }
                else {
                    expect(state.decided).toBeTruthy();
                    expect(state.x).toBe(1);
                    expect(state.k).toBeLessThanOrEqual(2);
                }
            }
        }));
        test.todo("Hidden test - Finality is reached - Unanimous Agreement - 2 pt");
        it("Finality is reached - Simple Majority - 1 pt", () => __awaiter(void 0, void 0, void 0, function* () {
            const faultyArray = [false, false, false, false, true];
            const initialValues = [1, 1, 1, 0, 0];
            const _servers = yield (0, index_1.launchNetwork)(faultyArray.length, faultyArray.filter((el) => el === true).length, initialValues, faultyArray);
            +servers.push(..._servers);
            yield (0, consensus_1.startConsensus)(faultyArray.length);
            const time = new Date().getTime();
            let states = yield (0, utils_2.getNodesState)(faultyArray.length);
            while (new Date().getTime() - time < timeLimit &&
                !(0, utils_2.reachedFinality)(states)) {
                yield (0, utils_1.delay)(200);
                states = yield (0, utils_2.getNodesState)(faultyArray.length);
            }
            console.log("---------STATES", states);
            for (let index = 0; index < states.length; index++) {
                const state = states[index];
                if (faultyArray[index]) {
                    expect(state.decided).toBeNull();
                    expect(state.x).toBeNull();
                    expect(state.k).toBeNull();
                }
                else {
                    expect(state.decided).toBeTruthy();
                    expect(state.x).toBe(1);
                    expect(state.k).toBeLessThanOrEqual(2);
                }
            }
        }));
        test.todo("Hidden test - Simple Majority - Unanimous Agreement - 1 pt");
        it("Finality is reached - Fault Tolerance Threshold - 1 pt", () => __awaiter(void 0, void 0, void 0, function* () {
            const faultyArray = [
                true,
                true,
                true,
                true,
                false,
                false,
                false,
                false,
                false,
            ];
            const initialValues = [0, 0, 1, 1, 1, 0, 0, 1, 1];
            const _servers = yield (0, index_1.launchNetwork)(faultyArray.length, faultyArray.filter((el) => el === true).length, initialValues, faultyArray);
            servers.push(..._servers);
            const time = new Date().getTime();
            yield (0, consensus_1.startConsensus)(faultyArray.length);
            let states = yield (0, utils_2.getNodesState)(faultyArray.length);
            while (new Date().getTime() - time < timeLimit &&
                !(0, utils_2.reachedFinality)(states)) {
                yield (0, utils_1.delay)(200);
                states = yield (0, utils_2.getNodesState)(faultyArray.length);
            }
            const consensusValues = [];
            for (let index = 0; index < states.length; index++) {
                const state = states[index];
                if (faultyArray[index]) {
                    expect(state.decided).toBeNull();
                    expect(state.x).toBeNull();
                    expect(state.k).toBeNull();
                }
                else {
                    expect(state.decided).toBeTruthy();
                    expect(state.k).not.toBeNull();
                    expect(state.x).not.toBeNull();
                    consensusValues.push(state.x);
                }
            }
            expect(consensusValues.find((el) => el !== consensusValues[0])).toBeUndefined();
        }));
        test.todo("Hidden test - Fault Tolerance Threshold - Unanimous Agreement - 1 pt");
        it("Finality is reached - Exceeding Fault Tolerance - 1 pt", () => __awaiter(void 0, void 0, void 0, function* () {
            const faultyArray = [
                true,
                true,
                true,
                true,
                true,
                false,
                false,
                false,
                false,
                false,
            ];
            const initialValues = [0, 0, 1, 1, 1, 0, 0, 1, 1, 0];
            const _servers = yield (0, index_1.launchNetwork)(faultyArray.length, faultyArray.filter((el) => el === true).length, initialValues, faultyArray);
            servers.push(..._servers);
            const time = new Date().getTime();
            yield (0, consensus_1.startConsensus)(faultyArray.length);
            let states = yield (0, utils_2.getNodesState)(faultyArray.length);
            while (new Date().getTime() - time < timeLimit &&
                !(0, utils_2.reachedFinality)(states)) {
                yield (0, utils_1.delay)(200);
                states = yield (0, utils_2.getNodesState)(faultyArray.length);
            }
            for (let index = 0; index < states.length; index++) {
                const state = states[index];
                if (faultyArray[index]) {
                    expect(state.decided).toBeNull();
                    expect(state.x).toBeNull();
                    expect(state.k).toBeNull();
                }
                else {
                    expect(state.decided).not.toBeTruthy();
                    expect(state.k).toBeGreaterThan(10);
                    expect(state.x).not.toBeNull();
                }
            }
        }));
        test.todo("Hidden test - Fault Tolerance Threshold - Exceeding Fault Tolerance - 1 pt");
        it("Finality is reached - No Faulty Nodes - 1 pt", () => __awaiter(void 0, void 0, void 0, function* () {
            const faultyArray = [false, false, false, false, false];
            const _initialValues = [0, 1, 0, 1, 1];
            const _servers = yield (0, index_1.launchNetwork)(faultyArray.length, faultyArray.filter((el) => el === true).length, _initialValues, faultyArray);
            servers.push(..._servers);
            const time = new Date().getTime();
            yield (0, consensus_1.startConsensus)(faultyArray.length);
            let states = yield (0, utils_2.getNodesState)(faultyArray.length);
            while (new Date().getTime() - time < timeLimit &&
                !(0, utils_2.reachedFinality)(states)) {
                yield (0, utils_1.delay)(200);
                states = yield (0, utils_2.getNodesState)(faultyArray.length);
            }
            for (let index = 0; index < states.length; index++) {
                const state = states[index];
                if (faultyArray[index]) {
                    expect(state.decided).toBeNull();
                    expect(state.x).toBeNull();
                    expect(state.k).toBeNull();
                }
                else {
                    expect(state.decided).toBeTruthy();
                    expect(state.x).toBe(1);
                    expect(state.k).toBeLessThanOrEqual(2);
                }
            }
        }));
        test.todo("Hidden test - Fault Tolerance Threshold - No Faulty Nodes - 1 pt");
        it("Finality is reached - Randomized - 1 pt", () => __awaiter(void 0, void 0, void 0, function* () {
            const faultyArray = [false, false, true, false, true, false, false];
            const _initialValues = new Array(7).fill(0);
            const initialValue = _initialValues.map((el) => generateRandomValue());
            const _servers = yield (0, index_1.launchNetwork)(faultyArray.length, faultyArray.filter((el) => el === true).length, initialValue, faultyArray);
            servers.push(..._servers);
            const time = new Date().getTime();
            yield (0, consensus_1.startConsensus)(faultyArray.length);
            let states = yield (0, utils_2.getNodesState)(faultyArray.length);
            while (new Date().getTime() - time < timeLimit &&
                !(0, utils_2.reachedFinality)(states)) {
                yield (0, utils_1.delay)(200);
                states = yield (0, utils_2.getNodesState)(faultyArray.length);
            }
            const consensusValues = [];
            for (let index = 0; index < states.length; index++) {
                const state = states[index];
                if (faultyArray[index]) {
                    expect(state.decided).toBeNull();
                    expect(state.x).toBeNull();
                    expect(state.k).toBeNull();
                }
                else {
                    expect(state.decided).toBeTruthy();
                    expect(state.x).not.toBeNull();
                    consensusValues.push(state.x);
                }
            }
            expect(consensusValues.find((el) => el !== consensusValues[0])).toBeUndefined();
        }));
        test.todo("Hidden test - Fault Tolerance Threshold - Randomized - 1 pt");
        it("Hidden Test - Finality is reached - One node - 1 pt", () => __awaiter(void 0, void 0, void 0, function* () {
            const faultyArray = [false];
            const _initialValues = [1];
            const _servers = yield (0, index_1.launchNetwork)(faultyArray.length, faultyArray.filter((el) => el === true).length, _initialValues, faultyArray);
            servers.push(..._servers);
            const time = new Date().getTime();
            yield (0, consensus_1.startConsensus)(faultyArray.length);
            let states = yield (0, utils_2.getNodesState)(faultyArray.length);
            while (new Date().getTime() - time < timeLimit &&
                !(0, utils_2.reachedFinality)(states)) {
                yield (0, utils_1.delay)(200);
                states = yield (0, utils_2.getNodesState)(faultyArray.length);
            }
            expect(states.length).toBe(1);
            expect(states[0].decided).toBeTruthy();
            expect(states[0].x).toBe(1);
        }));
        test.todo("Hidden test - Fault Tolerance Threshold - One node - 1 pt");
        test.todo("Hidden Test - 1 pt");
    });
});
