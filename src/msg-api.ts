import express from "express";
import crypto from "crypto";
//@ts-ignore
import cors from "cors";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import { createUser, getMessages } from "./services/postgres";
import bcrypt from "bcrypt";

import dotenv from "dotenv";
import prisma from "./config/prisma.config";
import { authenticateToken } from "./middleware/check-JWT";

dotenv.config();

const initApp = async () => {
  const app = express();
  const port = process.env.API_SERVER_PORT || 4000;

  app.use(cors());
  app.use(bodyParser.json());

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

  app.get("/messages", authenticateToken, async (req, res) => {
    const results = await getMessages();

    res.status(200).send(results);
  });

  //create table if it doesn't exist
  // try {
  //   await createTable();
  // } catch (e) {
  //   console.error(`${e}`);
  // }

  app.post("/is-authenticated", authenticateToken, async (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/login", async (req, res, next) => {
    const { username, password } = req.body;

    // let existingUser;
    // try {
    //   existingUser = await User.findOne({ email: email });
    // } catch {
    //   const error = new Error("Error! Something went wrong.");
    //   return next(error);
    // }
    // if (!existingUser || existingUser.password != password) {
    //   const error = Error("Wrong details please check at once");
    //   return next(error);
    // }
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

      res.status(201).json({ token: token, username });
    } catch (err) {
      const error = new Error(
        err instanceof Error ? err.message : "Something went wrong"
      );
      return next(error);
    }
  });

  // Handling post request
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

      res.status(201).json({ token: token, username });
    } catch (err) {
      const error = new Error(
        err instanceof Error ? err.message : "Something went wrong"
      );
      return next(error);
    }
  });

  app.listen(port, () => console.log(`API Aerver listening on port ${port}`));
};

void initApp();
