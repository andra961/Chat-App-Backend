import WebSocket from "ws";

import initRabbit from "./config/rabbitMQ.config";

let totalConnections = 0;
let connections = 0;

const initApp = async () => {
  const channel = await initRabbit();

  const wss = new WebSocket.Server({ port: 8080 }, () =>
    console.log("Server listening on port 8080")
  );

  wss.on("connection", (ws) => {
    totalConnections++;
    connections++;
    console.log("open connections: ", connections);
    console.log("total connections since up: ", totalConnections);
    ws.on("message", (message) => {
      console.log(`New message received: ${message} ${wss.clients.size}`);
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message.toString());
        }
      });
      //Send a message to the queue
      channel.sendToQueue("chat-msgs", Buffer.from(message.toString()));
    });
    ws.on("close", () =>
      console.log("one connection closed, remaining:", --connections)
    );
  });
};

void initApp();
