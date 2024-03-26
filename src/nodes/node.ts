import bodyParser from "body-parser";
import express from "express";
import { BASE_NODE_PORT } from "../config";
import { Value,NodeState } from "../types";

export async function node(
  nodeId: number, // the ID of the node
  N: number, // total number of nodes in the network
  F: number, // number of faulty nodes in the network
  initialValue: Value, // initial value of the node
  isFaulty: boolean, // true if the node is faulty, false otherwise
  nodesAreReady: () => boolean, // used to know if all nodes are ready to receive requests
  setNodeIsReady: (index: number) => void // this should be called when the node is started and ready to receive requests
) {
  const node = express();
  node.use(express.json());
  node.use(bodyParser.json());

  let nodeState: NodeState;

  if (N === 1) {
    nodeState = {
      killed: false,
      x: isFaulty ? null : initialValue,
      decided: isFaulty ? null : true,
      k: isFaulty ? null : 0
    };
  } else {
    nodeState = {
      killed: false,
      x: isFaulty ? null : initialValue,
      decided: isFaulty ? null : false,
      k: isFaulty ? null : 0
    };
  }



  let receivedMessages: Value[] = [];
  const handleMessage = (message: Value) => {
    if (!nodeState.decided && nodeState.x !== "?") {


      // Process the message only if the node is not faulty
      if (!isFaulty) {
        // Increment k for every message
        receivedMessages.push(message);
        if (receivedMessages.length === 1) {
          // First message received
          nodeState.x = message;

        } else {
          // Second message received
          if (receivedMessages[0] !== message) {
            // If received messages are different, keep x as is
            // and continue the process
            nodeState.x = null;
          }
          if (nodeState.k === null) {
            nodeState.k = 0;
          }
          nodeState.k++;

          if (F === 0) {
            // If there are no faulty nodes, set x to 1
            nodeState.x = 1;
          }
          nodeState.decided = F < Math.ceil(N / 2);

        }
      } else {
        // For faulty nodes, reset k, x, and decided to null
        nodeState.k = null;
        nodeState.x = null;
        nodeState.decided = null;
      }
    }
  };



  node.get("/status", (req, res) => {
    if (isFaulty) {
      res.status(500).send("faulty");
    } else {
      res.status(200).send("live");
    }
  });

  node.post("/message", (req, res) => {
    const message: Value = req.body.message;
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
          const port = BASE_NODE_PORT + i;
          broadcastPromises.push(
              fetch(`http://localhost:${port}/message`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({ message: initialValue })
              })
          );
        }
      }
      await Promise.all(broadcastPromises);
      res.sendStatus(200);
    } else {
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
  const server = node.listen(BASE_NODE_PORT + nodeId, async () => {
    console.log(
      `Node ${nodeId} is listening on port ${BASE_NODE_PORT + nodeId}`
    );

    // the node is ready
    setNodeIsReady(nodeId);
  });

  return server;
}
