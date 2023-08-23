import { Channel } from "amqplib";
import { rabbitConnect } from "../services/rabbitMQ";

import dotenv from "dotenv";

dotenv.config();

const MSG_EXCHANGE = "msgs";

export const initRabbit = async () => {
  const rabbitConn = await rabbitConnect();
  const ch = await rabbitConn.createChannel();

  // Makes the queue available to the client
  await ch.assertQueue("chat-msgs");

  return ch;
};

export const initRabbitPubSub = async (onMsg: (msg: string) => void) => {
  const rabbitConn = await rabbitConnect();
  console.log("connected rabbit");

  const ch = await rabbitConn.createChannel();

  const exchange = await ch.assertExchange(MSG_EXCHANGE, "fanout", {
    durable: false,
  });

  const queue = await ch.assertQueue("", {
    exclusive: true,
  });

  // console.log(ch, queue, rabbitConn);
  await ch.bindQueue(queue.queue, exchange.exchange, "");

  const publishMsg = (msg: string) => {
    ch.publish(MSG_EXCHANGE, "", Buffer.from(msg));
  };

  ch.consume(queue.queue, (msg) => {
    console.log("New msg received from queue:", msg);
    if (msg?.content) {
      onMsg(msg.content.toString());
    }
  });

  return { publishMsg, channel: ch, queue, connection: rabbitConn };
};

export default initRabbit;
