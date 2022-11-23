import WebSocket from "ws";
import express from "express";
//@ts-ignore
import cors from "cors";
import bodyParser from "body-parser";
import { createTable, getMessages, postMessage } from "./services/postgres";

let totalConnections = 0;
let connections = 0;

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get("/messages", async (req, res) => {
  const results = await getMessages();

  res.status(200).send(results);
});

const wss = new WebSocket.Server({ port: 8080 }, () =>
  console.log("Server listening on port 8080")
);

wss.on("connection", (ws) => {
  totalConnections++;
  connections++;
  console.log("open connections: ", connections);
  ws.on("message", (message) => {
    console.log(`New message received: ${message} ${wss.clients.size}`);
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
    void postMessage(JSON.parse(message.toString()));
  });
  ws.on("close", () =>
    console.log("one connection closed, remaining:", --connections)
  );
});

//create table if it doesn't exist
createTable()
  .then(() => app.listen(4000, () => console.log("app listening on port 4000")))
  .catch((error) => console.error(`Could not get products: ${error}`));
