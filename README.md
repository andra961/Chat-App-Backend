# Chat-App-Backend

Backend side of a Chat application made with `Express`, `PostgreSQL` and `Websocket` and `RabbitMQ`.

The system is composed of 3 microservices:

- `ws-server`: handles ws connections and broadcasts messages to connected users, publishes incoming messages to the `RabbitMQ` message queue for later process;
- `msg-api`: simple API to retrieve old messages (GET method) stored in `PostgreSQL` db and store them trough POST method;
- `msg-store-worker`: worker that consumes the message queue and stores them by POSTing to `msg-api`;

The servers connects to a `PostgreSQL` database available locally to store all incoming messages and allow the frontend to fetch them.
When launched, it connects to `PostgreSQL` and listens to incoming `Websocket` connections from clients. It then broadcasts incoming messages to all the other clients connected to form a group chat.

## Install

Run

```shell
npm install
```

to install the npm packages.

## Docker

`PostgreSQL` and `RabbitMQ` can be installed either locally or made available in a container easily using the `docker-compose.yaml` file in the root of the project.

If using the latter, be sure to have `Docker` installing and running on your system.

## Create .env

Create in the root folder a file called `.env`, writing the variables copying the contents of `.env.example`. You can of course also change their values.

## Launch the project

First, be sure `PostgreSQL` is installed and running on your computer. If instead of using a local instance you are using `Docker`, just run

```shell
docker-compose up
```

from the root of the project.

Then, launch the microservices with

```shell
ts-node-dev \"./src/ws-server.ts\"
```

```shell
ts-node-dev \"./src/msg-api.ts\"
```

```shell
ts-node-dev \"./src/msg-store-server.ts\"
```
