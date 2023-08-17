import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
declare module "express-serve-static-core" {
  interface Request {
    user: { userId: number; username: string };
  }
}

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.headers["authorization"];

  console.log(token);

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET as string, (err: any, user: any) => {
    if (err) return res.sendStatus(401);

    req.user = { ...user, token };

    next();
  });
}
