"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.node = void 0;
const body_parser_1 = __importDefault(require("body-parser"));
const express_1 = __importDefault(require("express"));
const config_1 = require("../config");
async function node(nodeId, // the ID of the node
N, // total number of nodes in the network
F, // number of faulty nodes in the network
initialValue, // initial value of the node
isFaulty, // true if the node is faulty, false otherwise
nodesAreReady, // used to know if all nodes are ready to receive requests
setNodeIsReady // this should be called when the node is started and ready to receive requests
) {
    const node = (0, express_1.default)();
    node.use(express_1.default.json());
    node.use(body_parser_1.default.json());
    const nodeState = {
        killed: false, // this is used to know if the node was stopped by the /stop route. It's important for the unit tests but not very relevant for the Ben-Or implementation
        x: isFaulty ? null : initialValue, // the current consensus value
        decided: isFaulty ? null : false, // used to know if the node reached finality
        k: isFaulty ? null : 0 // current step of the node
    };
    let receivedMessages = [];
    const handleMessage = (message) => {
        if (!nodeState.decided && nodeState.x !== "?") {
            if (!isFaulty) {
                // Only proceed if the node is not faulty
                receivedMessages.push(message);
                if (receivedMessages.length === 1) {
                    // First message received
                    nodeState.x = message;
                }
                else {
                    // Second message received
                    if (receivedMessages[0] !== message) {
                        // If received messages are different, set x to "?"
                        nodeState.x = "?";
                    }
                    nodeState.decided = F < Math.ceil(N / 2);
                }
            }
        }
    };
    node.get("/status", (req, res) => {
        if (isFaulty) {
            res.status(500).send("faulty");
        }
        else {
            res.status(200).send("live");
        }
    });
    node.post("/message", (req, res) => {
        const message = req.body.message;
        handleMessage(message);
        res.sendStatus(200);
    });
    // Route to start the consensus algorithm
    node.get("/start", async (req, res) => {
        if (nodesAreReady()) {
            // Broadcast the initial value to all other nodes
            const broadcastPromises = [];
            for (let i = 0; i < N; i++) {
                if (i !== nodeId) {
                    const port = config_1.BASE_NODE_PORT + i;
                    broadcastPromises.push(fetch(`http://localhost:${port}/message`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ message: initialValue })
                    }));
                }
            }
            await Promise.all(broadcastPromises);
            res.sendStatus(200);
        }
        else {
            res.sendStatus(500); // Nodes are not ready
        }
    });
    // Route to stop the consensus algorithm
    node.get("/stop", async (req, res) => {
        // Reset nodeState
        nodeState.killed = true;
        nodeState.x = null;
        nodeState.decided = null;
        nodeState.k = null;
        res.sendStatus(200);
    });
    node.get("/getState", (req, res) => {
        res.json(nodeState);
    });
    // start the server
    const server = node.listen(config_1.BASE_NODE_PORT + nodeId, async () => {
        console.log(`Node ${nodeId} is listening on port ${config_1.BASE_NODE_PORT + nodeId}`);
        // the node is ready
        setNodeIsReady(nodeId);
    });
    return server;
}
exports.node = node;
