"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchNetwork = void 0;
const launchNodes_1 = require("./nodes/launchNodes");
async function launchNetwork(N, F, initialValues, faultyList) {
    // launch all nodes
    const nodes = await (0, launchNodes_1.launchNodes)(N, F, initialValues, faultyList);
    return nodes;
}
exports.launchNetwork = launchNetwork;
