import client, { Connection } from "amqplib";

export const rabbitConnect = async () => {
  const connection: Connection = await client.connect(
    `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${
      process.env.RABBITMQ_HOST
    }:${parseInt(process.env.RABBITMQ_PORT || "5672")}`
  );
  return connection;
};
