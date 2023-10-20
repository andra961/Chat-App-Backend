import client, { Connection } from "amqplib";

export const rabbitConnect = async () => {
  const connectionString = `amqp://${process.env.RABBITMQ_USER}:${
    process.env.RABBITMQ_PASSWORD
  }@${process.env.RABBITMQ_HOST}:${parseInt(
    process.env.RABBITMQ_PORT || "5672"
  )}`;
  console.log("connecting to rabbit with URL", connectionString);

  const connection: Connection = await client.connect(connectionString);
  console.log(`connected to`, connectionString);
  return connection;
};
