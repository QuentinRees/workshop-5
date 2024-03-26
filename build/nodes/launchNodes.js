"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchNodes = void 0;
const node_1 = require("./node");
async function launchNodes(N, // total number of nodes in the network
F, // number of faulty nodes in the network
initialValues, // initial values of each node
faultyList // list of faulty values for each node, true if the node is faulty, false otherwise
) {
    if (initialValues.length !== faultyList.length || N !== initialValues.length)
        throw new Error("Arrays don't match");
    if (faultyList.filter((el) => el === true).length !== F)
        throw new Error("faultyList doesnt have F faulties");
    const promises = [];
    const nodesStates = new Array(N).fill(false);
    function nodesAreReady() {
        return nodesStates.find((el) => el === false) === undefined;
    }
    function setNodeIsReady(index) {
        nodesStates[index] = true;
    }
    // launch nodes
    for (let index = 0; index < N; index++) {
        const newPromise = (0, node_1.node)(index, N, F, initialValues[index], faultyList[index], nodesAreReady, setNodeIsReady);
        promises.push(newPromise);
    }
    const servers = await Promise.all(promises);
    return servers;
}
exports.launchNodes = launchNodes;
