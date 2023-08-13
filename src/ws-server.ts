import WebSocket from "ws";

import initRabbit from "./config/rabbitMQ.config";
import { createServer, IncomingMessage } from "http";
import url, { URLSearchParams } from "url";

let totalConnections = 0;
let connections = 0;

const server = createServer();

//handle auth
const authenticate: (req: IncomingMessage) => {
  userId: string;
  ticket: string;
} = (req: IncomingMessage) => {
  if (!req.url) throw new Error("Invalid Url");
  const parsedUrl = url.parse(req.url);
  if (!parsedUrl.query) throw new Error("No ticket");
  const parsedQs = new URLSearchParams(parsedUrl.query);
  const ticket = parsedQs.get("ticket");
  if (!ticket) throw new Error("No ticket");
  //TODO look in db for userId
  return { userId: "", ticket };
};

const initApp = async () => {
  const channel = await initRabbit();
  server.on("upgrade", function upgrade(request, socket, head) {
    try {
      const { userId, ticket } = authenticate(request);
      console.log("auth ticket", ticket);
    } catch (e) {
      if (e instanceof Error) console.error(e.message);
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, function done(ws) {
      wss.emit("connection", ws, request);
    });
  });
  server.listen(8080);

  //no server means we have to call the connection event manually with an external http server that will handle auth too
  //see https://github.com/websockets/ws/blob/master/doc/ws.md#new-websocketserveroptions-callback
  const wss = new WebSocket.Server({ noServer: true }, () =>
    console.log("Server listening on port 8080")
  );

  wss.on("connection", (ws, req) => {
    totalConnections++;
    connections++;
    console.log("open connections: ", connections);
    console.log("total connections since up: ", totalConnections);
    const ip = req.socket.remoteAddress;
    console.log("ip", ip);

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
