import bodyParser from "body-parser";
import express from "express";
import { BASE_NODE_PORT } from "../config";
import { NodeState, Value, Message, MessageCount } from "../types";
import { delay } from "../utils";

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

  let nodeState: NodeState = isFaulty ? 
  { killed: false, x: null, decided: null, k: null } : 
  { killed: false, x: initialValue, decided: false, k: 1 };

  let messagesR: MessageCount[] = [];
  let messagesP: MessageCount[] = [];

  // DONE implement this
  // this route allows retrieving the current status of the node
  node.get("/status", (req, res) => {
    if (isFaulty){
      res.status(500).send('faulty');
    } else{
      res.status(200).send('live');
    }
  });

  // DONE implement this
  // this route allows the node to receive messages from other nodes
  node.post("/message", (req, res) => {
    const msg = req.body as Message;
    if (!isFaulty && !nodeState.killed){
      let count = collectMessage(msg);
      if (count.n >= N - F){
        
        if (msg.type === 'R'){
          let x: Value = 
            count.nb0 > N / 2 ? 0 : 
            count.nb1 > N / 2 ? 1 : "?";
          sendMessage({ type: "P", k: msg.k, x: x })
        } else 
        
        if (msg.type === 'P'){
          nodeState.x = 
            count.nb0 >= F + 1 ? 0 :
            count.nb1 >= F + 1 ? 1 : "?";
          nodeState.decided = nodeState.x !== "?";
          if (!nodeState.decided){
            nodeState.x = 
              count.nb0 > count.nb1 ? 0 : 
              count.nb1 > count.nb0 ? 1 : 
              Math.random() < 0.5 ? 0 : 1;
            nodeState.k = msg.k + 1;
            sendMessage({ type: "R", k: nodeState.k, x: nodeState.x });
          }
        }

      }
    }
    res.status(200).send("ok");
  });

  // DONE implement this
  // this route is used to start the consensus algorithm
  node.get("/start", async (req, res) => {
    while (!nodesAreReady()) {
      await delay(10);
    }
    if (!isFaulty){
      sendMessage({ type: 'R', k: nodeState.k!, x: nodeState.x! });
    }
    res.status(200).send("started");
  });

  // DONE implement this
  // this route is used to stop the consensus algorithm
  node.get("/stop", async (req, res) => { 
    nodeState.killed=true; 
    res.status(200).send("stoped");
  });

  // DONE implement this
  // get the current state of a node
  node.get("/getState", (req, res) => { res.status(200).send(nodeState); });

  // start the server
  const server = node.listen(BASE_NODE_PORT + nodeId, async () => {
    console.log(
      `Node ${nodeId} is listening on port ${BASE_NODE_PORT + nodeId}`
    );

    // the node is ready
    setNodeIsReady(nodeId);
  });

  function sendMessage(message: Message){
    for (let index = 0; index < N; index++){
      fetch(`http://localhost:${BASE_NODE_PORT + index}/message`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(message)
      });
    }
  }

  function collectMessage(msg: Message){
    let messages = msg.type === "R" ? messagesR : messagesP;
    if (messages.length === msg.k-1){
      messages.push({n:0, nb0:0, nb1:0});
    } 
    let count = messages[msg.k-1];
    count.n++;
    msg.x === 0 && count.nb0++;
    msg.x === 1 && count.nb1++;
    return count;
  }

  return server;
}
