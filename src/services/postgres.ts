import pool from "../config/postgres.config";
import { Message } from "../models/message";

export const createTable = async () => {
  await pool.query(`
  CREATE TABLE IF NOT EXISTS "messages" (
    ID SERIAL PRIMARY KEY,
    op VARCHAR(30),
    text VARCHAR(1000),
    timestamp TIMESTAMP
  );`);
};

export const getMessages = async () => {
  const results = await pool.query<Message>("SELECT * FROM messages");

  return results.rows;
};

export const postMessage = async (message: Message) => {
  const results = await pool.query<Message>(
    "INSERT INTO messages (op, text, timestamp) VALUES ($1, $2, to_timestamp($3))",
    [message.op, message.text, message.timestamp || Date.now() / 1000.0]
  );

  return results.rows[0];
};
