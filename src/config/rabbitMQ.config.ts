import { Channel } from "amqplib";
import { rabbitConnect } from "../services/rabbitMQ";

import dotenv from "dotenv";

dotenv.config();

const initRabbit = async () => {
  const rabbitConn = await rabbitConnect();
  const channel: Channel = await rabbitConn.createChannel();

  // Makes the queue available to the client
  await channel.assertQueue("chat-msgs");

  return channel;
};

export default initRabbit;
