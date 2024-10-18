import jwt from "jsonwebtoken";
import { User } from "../SocketManager";
// import { Player } from '../Game';
import { WebSocket } from "ws";

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

export interface userJwtClaims {
  userId: string;
  name: string;
  avatar: string;
  isGuest?: boolean;
}

export const extractAuthUser = (token: string, socket: WebSocket): User => {
  if (token) {
    const decoded = jwt.verify(token, JWT_SECRET) as userJwtClaims;
    return new User(socket, decoded);
  } else {
    return new User(socket, {
      userId: "1",
      name: "Rohit",
      avatar: "https://i.imgur.com/tYbi9eI.png",
    });
  }
};
