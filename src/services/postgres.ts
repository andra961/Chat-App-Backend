// import pool from "../config/postgres.config";
import prisma from "../config/prisma.config";
import { Message } from "../models/message";

// export const createTable = async () => {
//   await pool.query(`
//   CREATE TABLE IF NOT EXISTS "messages" (
//     ID SERIAL PRIMARY KEY,
//     op VARCHAR(30),
//     text VARCHAR(1000),
//     timestamp TIMESTAMP
//   );`);
// };

export const getMessages = async () => {
  // const results = await pool.query<Message>("SELECT * FROM messages");

  const results = await prisma.message.findMany();
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

export const postMessage = async (message: Message) => {
  // const results = await pool.query<Message>(
  //   "INSERT INTO messages (op, text, timestamp) VALUES ($1, $2, to_timestamp($3))",
  //   [message.op, message.text, message.timestamp || Date.now() / 1000.0]
  // );

  const msg = await prisma.message.create({
    data: {
      op: message.op,
      text: message.text,
      timestamp:
        message.timestamp !== undefined
          ? new Date(message.timestamp)
          : new Date(),
    },
  });
  return msg;
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

  //invalidate ticket
  // await prisma.wsTicket.delete({
  //   where: {
  //     id: match.id,
  //   },
  // });

  if (match.expiration.getTime() <= Date.now())
    throw new Error("Expired ws ticket");

  return { userId: match.userId, username: match.user.username };
};
