import WebSocket from "ws";
import dotenv from "dotenv";

import {
  initMessageExchange,
  initRabbitChannel,
} from "./config/rabbitMQ.config";
import { createServer, IncomingMessage } from "http";
import url, { URLSearchParams } from "url";
import { verifyWsTicket } from "./services/db";
import prisma from "./config/prisma.config";
import { DirectMessage, GroupMessage, MessageBase } from "./models/message";

const port = process.env.WS_SERVER_PORT || 8080;

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
  server.listen(port);

  //hashmap userId => active connections
  const usersConnections: Record<number, Set<WebSocket.WebSocket>> = {};

  //no server means we have to call the connection event manually with an external http server that will handle auth too
  //see https://github.com/websockets/ws/blob/master/doc/ws.md#new-websocketserveroptions-callback
  const wss = new WebSocket.Server({ noServer: true }, () =>
    console.log(`WS Server listening on port ${port}`)
  );

  console.log(`WS Server listening on port ${port}`);

  const forwardToUsers = async (msg: any) => {
    if (msg.chatId !== undefined) {
      const members = (
        await prisma.chat.findUnique({
          where: {
            id: Number(msg.chatId),
          },
          include: {
            members: true,
          },
        })
      )?.members;

      if (members === undefined) return;

      members.forEach((u) => {
        if (u.id in usersConnections)
          usersConnections[u.id].forEach((c) => c.send(JSON.stringify(msg)));
      });
    }
  };

  const { channel } = await initRabbitChannel();

  const { publishMsg } = await initMessageExchange(channel, (msgRaw) => {
    const msg = JSON.parse(msgRaw);
    forwardToUsers(msg);
  });

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
        const sender: Pick<MessageBase, "senderId"> = { senderId: username };
        const enrichedMsg: DirectMessage | GroupMessage = {
          ...JSON.parse(msg.toString()),
          ...sender,
        };

        const enrichedMsgString = JSON.stringify(enrichedMsg);
        publishMsg(enrichedMsgString);
        console.log(usersConnections);
        console.log(
          `New message received from ws: ${enrichedMsgString} ${wss.clients.size}`
        );
        // wss.clients.forEach((client) => {
        //   if (client !== ws && client.readyState === WebSocket.OPEN) {
        //     client.send(enrichedMsgString.toString());
        //   }
        // });
        //Send a enrichedMsgString to the queue
        //channel.sendToQueue("chat-msgs", Buffer.from(enrichedMsgString.toString()));
      });
      ws.on("close", () => {
        console.log("one connection closed, remaining:", --connections);
        usersConnections[userId].delete(ws);
        if (usersConnections[userId].size === 0)
          delete usersConnections[userId];
      });
    }
  );
};

void initApp();
