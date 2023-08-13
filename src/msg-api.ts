import express from "express";
//@ts-ignore
import cors from "cors";
import bodyParser from "body-parser";
import { getMessages } from "./services/postgres";

const initApp = async () => {
  const app = express();

  app.use(cors());
  app.use(bodyParser.json());

  app.get("/messages", async (req, res) => {
    const results = await getMessages();

    res.status(200).send(results);
  });

  //create table if it doesn't exist
  // try {
  //   await createTable();
  // } catch (e) {
  //   console.error(`${e}`);
  // }

  app.listen(4000, () => console.log("app listening on port 4000"));
};

void initApp();
