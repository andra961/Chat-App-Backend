import { Channel, ConsumeMessage } from "amqplib";
import initRabbit from "./config/rabbitMQ.config";
import { postMessage } from "./services/postgres";
const initWorker = async () => {
  const channel = await initRabbit();
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

  await channel.consume("chat-msgs", consumer(channel));
};

void initWorker();
