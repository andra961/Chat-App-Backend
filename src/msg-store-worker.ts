import { Channel, ConsumeMessage } from "amqplib";
import {
  initRabbitChannel,
  initStoreMessageQueue,
} from "./config/rabbitMQ.config";
import { postMessage } from "./services/postgres";

const initWorker = async () => {
  const { channel } = await initRabbitChannel();
  const consumer = (channel: Channel) => async (msg: ConsumeMessage | null) => {
    if (msg) {
      const msgText = msg.content.toString();
      // Display the received message
      console.log("consuming", msgText);
      await postMessage(JSON.parse(msgText));
      // Acknowledge the message
      channel.ack(msg);
    }
  };

  //assert the queue exists
  await initStoreMessageQueue(channel);

  await channel.consume(
    process.env.RABBITMQ_MSG_STORE_QUEUE || "msgs2store",
    consumer(channel)
  );
};

void initWorker();
