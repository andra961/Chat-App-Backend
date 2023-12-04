// import pool from "../config/postgres.config";
import prisma from "../config/prisma.config";
import { DirectMessage, GroupMessage } from "../models/message";
import { promises } from "fs";
import path from "path";

// export const createTable = async () => {
//   await pool.query(`
//   CREATE TABLE IF NOT EXISTS "messages" (
//     ID SERIAL PRIMARY KEY,
//     op VARCHAR(30),
//     text VARCHAR(1000),
//     timestamp TIMESTAMP
//   );`);
// };

const { readFile } = promises;

export const getMessages = async (id: string) => {
  // const results = await pool.query<Message>("SELECT * FROM messages");

  const results = await prisma.groupMessage.findMany({
    where: {
      chatId: Number(id),
    },
  });
  // console.log("prisma", resultsPrisma);
  // return results.rows;
  return results;
};

export const createUser = async (username: string, passwordHash: string) => {
  const user = await prisma.user.create({
    data: {
      username,
      password_hash: passwordHash,
    },
  });

  return user;
};

export const postMessage = async (message: DirectMessage | GroupMessage) => {
  // const results = await pool.query<Message>(
  //   "INSERT INTO messages (op, text, timestamp) VALUES ($1, $2, to_timestamp($3))",
  //   [message.op, message.text, message.timestamp || Date.now() / 1000.0]
  // );

  if ("receiver" in message) {
    const msg = await prisma.message.create({
      data: {
        senderId: message.senderId,
        receiverId: message.receiver,
        text: message.text,
        timestamp:
          message.timestamp !== undefined
            ? new Date(message.timestamp)
            : new Date(),
      },
    });
    return msg;
  } else {
    const msg = await prisma.groupMessage.create({
      data: {
        senderId: message.senderId,
        chatId: Number(message.chatId),
        text: message.text,
        timestamp:
          message.timestamp !== undefined
            ? new Date(message.timestamp)
            : new Date(),
      },
    });
    return msg;
  }
};

export const verifyWsTicket = async (ticket: string) => {
  const match = await prisma.wsTicket.findFirst({
    where: {
      ticket,
    },
    include: {
      user: true,
    },
  });

  if (match === null) throw new Error("Invalid ws ticket");

  if (match.expiration.getTime() <= Date.now())
    throw new Error("Expired ws ticket");

  // invalidate ticket
  void prisma.wsTicket.delete({
    where: {
      id: match.id,
    },
  });
  return { userId: match.userId, username: match.user.username };
};

//shoud be equivalent to innerjoin SELECT * FROM "Chat" INNER JOIN _member ON "Chat".id = _member.A WHERE _member.B = 28
export const getChats = async (userId: number) => {
  const chats = await prisma.chat.findMany({
    where: {
      members: {
        some: {
          id: userId,
        },
      },
    },
  });

  return chats;
};

export const createGroup = async (ownerId: number, name: string) => {
  // const query = await readFile(
  //   path.join(__dirname, "..", "sql", "createGroup.sql"),
  //   { encoding: "utf8" }
  // );
  const chat = await prisma.chat.create({
    data: {
      ownerId,
      name,
      members: {
        connect: { id: ownerId },
      },
    },
  });

  // await prisma.$queryRawUnsafe(query, [ownerId, name]);

  return chat;
};
