import express from "express";
import crypto from "crypto";
//@ts-ignore
import cors from "cors";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import {
  createGroup,
  createUser,
  deleteGroup,
  getChat,
  getChats,
  getMessages,
} from "./services/db";
import bcrypt from "bcrypt";
import morgan from "morgan";
import dotenv from "dotenv";
import prisma from "./config/prisma.config";
import { authenticateToken } from "./middleware/check-JWT";

dotenv.config();

const initApp = async () => {
  const app = express();
  const port = process.env.API_SERVER_PORT || 4000;

  app.use(cors());
  app.use(bodyParser.json());

  app.use(
    morgan(":method :url :status :res[content-length] - :response-time ms", {
      stream: {
        write: (str) => {
          console.info(str);
        },
      },
    })
  );

  app.get("/ws-ticket", authenticateToken, async (req, res) => {
    const ticket = crypto.randomBytes(32).toString("hex");

    const { userId } = req.user;

    await prisma.wsTicket.create({
      data: {
        ticket,
        expiration: new Date(
          Date.now() + (Number(process.env.WS_TICKET_EXP) || 120000)
        ),
        userId,
      },
    });

    res.status(200).json({
      ticket,
    });
  });

  app.get("/messages/:chatId", authenticateToken, async (req, res) => {
    const { chatId } = req.params;

    const results = await getMessages(chatId);

    res.status(200).send(results);
  });

  app.get("/chats", authenticateToken, async (req, res) => {
    const { userId } = req.user;

    const results = await getChats(userId);

    res.status(200).send(results);
  });

  app.get("/chats/:chatId", authenticateToken, async (req, res) => {
    const { userId } = req.user;

    const { chatId } = req.params;

    const results = await getChat(Number(chatId));

    //if the user is asking is not a member of the chat return 401
    if (!results.members.some((m) => m.id === userId))
      return res.sendStatus(401);

    res.status(200).send(results);
  });

  app.post("/is-authenticated", authenticateToken, async (req, res) => {
    res.status(200).json({ ...req.user, id: req.user.userId });
  });

  app.post("/chats", authenticateToken, async (req, res) => {
    const { userId } = req.user;
    const { name } = req.body;
    await createGroup(userId, name);
    res.status(200).json(req.user);
  });

  app.delete("/chats/:chatId", authenticateToken, async (req, res) => {
    const { userId } = req.user;
    const { chatId } = req.params;

    const chat = await getChat(Number(chatId));
    //if not owner return 401
    if (chat.ownerId !== userId) return res.sendStatus(401);
    await deleteGroup(Number(chatId));
    res.status(200).json(chat);
  });

  app.post("/login", async (req, res, next) => {
    const { username, password } = req.body;

    try {
      const user = await prisma.user.findUniqueOrThrow({
        where: {
          username,
        },
      });
      const match = await bcrypt.compare(password, user.password_hash);

      if (!match) throw Error("Password not matching");

      //Creating jwt token
      const token = jwt.sign(
        { userId: user.id, username: username },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "1h" }
      );

      console.log(token);

      res.status(201).json({ token: token, username, id: user.id });
    } catch (err) {
      const error = new Error(
        err instanceof Error ? err.message : "Something went wrong"
      );
      return next(error);
    }
  });

  app.post("/register", async (req, res, next) => {
    const { username, password } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    console.log(hash);

    try {
      const user = await createUser(username, hash);
      const token = jwt.sign(
        { userId: user.id, username: username },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "1h" }
      );

      console.log(token);

      res.status(201).json({ token: token, username, id: user.id });
    } catch (err) {
      const error = new Error(
        err instanceof Error ? err.message : "Something went wrong"
      );
      return next(error);
    }
  });

  app.listen(port, () => console.log(`API Server listening on port ${port}`));
};

void initApp();
