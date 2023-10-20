import { Channel } from "amqplib";
import { rabbitConnect } from "../services/rabbitMQ";

import dotenv from "dotenv";

dotenv.config();

export const initRabbitChannel = async () => {
  const rabbitConn = await rabbitConnect();
  const ch = await rabbitConn.createChannel();

  return { connection: rabbitConn, channel: ch };
};

export const initStoreMessageQueue = async (ch: Channel) => {
  // Makes the queue available to the client
  const queue = await ch.assertQueue(
    process.env.RABBITMQ_MSG_STORE_QUEUE || "msgs2store",
    {
      durable: true,
    }
  );

  return { storeQueue: queue };
};

export const initMessageExchange = async (
  ch: Channel,
  onMsg: (msg: string) => void
) => {
  //assert the queue for sending the msgs to be stored in the db by workers
  await initStoreMessageQueue(ch);

  //assert fanout (broadcast) exchange
  const exchange = await ch.assertExchange(
    process.env.RABBITMQ_MSG_EXCHANGE || "msgs",
    "fanout",
    {
      durable: false,
    }
  );

  //create unique queue for this worker, exclusive means that it's created with a unique name and it's destroyed as soon as this worker is down
  const queue = await ch.assertQueue("", {
    exclusive: true,
  });

  await ch.bindQueue(queue.queue, exchange.exchange, "");

  const publishMsg = (msg: string) => {
    //publish in the exchange for every ws server to read
    ch.publish(
      process.env.RABBITMQ_MSG_EXCHANGE || "msgs",
      "",
      Buffer.from(msg)
    );

    //send to the store queue for workers to store it in db
    ch.sendToQueue(
      process.env.RABBITMQ_MSG_STORE_QUEUE || "msgs2store",
      Buffer.from(msg)
    );
  };

  ch.consume(queue.queue, (msg) => {
    console.log("New msg received from queue:", msg);
    if (msg?.content) {
      onMsg(msg.content.toString());
    }
  });

  return { publishMsg, queue };
};
