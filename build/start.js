"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const consensus_1 = require("./nodes/consensus");
const utils_1 = require("./utils");
async function main() {
    const faultyArray = [false, false, false, false, true];
    const initialValues = [1, 1, 1, 0, 0];
    if (initialValues.length !== faultyArray.length)
        throw new Error("Lengths don't match");
    if (faultyArray.filter((faulty) => faulty === true).length >
        initialValues.length / 2)
        throw new Error("Too many faulty nodes");
    await (0, _1.launchNetwork)(initialValues.length, faultyArray.filter((el) => el === true).length, initialValues, faultyArray);
    await (0, utils_1.delay)(200);
    await (0, consensus_1.startConsensus)(initialValues.length);
}
main();
