"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopConsensus = exports.startConsensus = void 0;
const config_1 = require("../config");
async function startConsensus(N) {
    // launch a node
    for (let index = 0; index < N; index++) {
        await fetch(`http://localhost:${config_1.BASE_NODE_PORT + index}/start`);
    }
}
exports.startConsensus = startConsensus;
async function stopConsensus(N) {
    // launch a node
    for (let index = 0; index < N; index++) {
        await fetch(`http://localhost:${config_1.BASE_NODE_PORT + index}/stop`);
    }
}
exports.stopConsensus = stopConsensus;
