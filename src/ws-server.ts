import WebSocket from "ws";

import initRabbit from "./config/rabbitMQ.config";
import { createServer, IncomingMessage } from "http";
import url, { URLSearchParams } from "url";
import { verifyWsTicket } from "./services/postgres";

let totalConnections = 0;
let connections = 0;

const server = createServer();

//handle auth
const authenticate = async (req: IncomingMessage) => {
  if (!req.url) throw new Error("Invalid Url");
  const parsedUrl = url.parse(req.url);
  if (!parsedUrl.query) throw new Error("No ticket");
  const parsedQs = new URLSearchParams(parsedUrl.query);
  const ticket = parsedQs.get("ticket");
  if (!ticket) throw new Error("No ticket");

  return await verifyWsTicket(ticket);
};

const initApp = async () => {
  const channel = await initRabbit();
  server.on("upgrade", async function upgrade(request, socket, head) {
    try {
      const data = await authenticate(request);
      console.log("handling upgrade of user: ", data.userId);
      wss.handleUpgrade(request, socket, head, function done(ws) {
        wss.emit("connection", ws, request, data);
      });
    } catch (e) {
      if (e instanceof Error) console.error(e.message);
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }
  });
  server.listen(8080);

  //no server means we have to call the connection event manually with an external http server that will handle auth too
  //see https://github.com/websockets/ws/blob/master/doc/ws.md#new-websocketserveroptions-callback
  const wss = new WebSocket.Server({ noServer: true }, () =>
    console.log("Server listening on port 8080")
  );

  //hashmap userId => active connections
  const usersConnections: Record<number, Set<WebSocket.WebSocket>> = {};

  wss.on(
    "connection",
    (ws: any, req: any, userData: { userId: number; username: string }) => {
      const { userId, username } = userData;
      totalConnections++;
      connections++;
      console.log("open connections: ", connections);
      console.log("total connections since up: ", totalConnections);
      // const ip = req.socket.remoteAddress;
      // console.log("ip", ip);
      if (userId in usersConnections) usersConnections[userId].add(ws);
      else usersConnections[userId] = new Set([ws]);

      ws.on("message", (msg: any) => {
        const enrichedMsg = JSON.stringify({
          ...JSON.parse(msg.toString()),
          op: username,
        });
        console.log(usersConnections);
        console.log(`New message received: ${enrichedMsg} ${wss.clients.size}`);
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(enrichedMsg.toString());
          }
        });
        //Send a enrichedMsg to the queue
        channel.sendToQueue("chat-msgs", Buffer.from(enrichedMsg.toString()));
      });
      ws.on("close", () => {
        console.log("one connection closed, remaining:", --connections);
        usersConnections[userId].delete(ws);
      });
    }
  );
};

void initApp();
