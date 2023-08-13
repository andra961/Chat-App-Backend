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

  const results = await prisma.messages.findMany();
  // console.log("prisma", resultsPrisma);
  // return results.rows;
  return results;
};

export const createUser = async (username: string, passwordHash: string) => {
  const user = prisma.user.create({
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

  const msg = await prisma.messages.create({
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
