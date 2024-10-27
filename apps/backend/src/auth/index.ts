import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "../SocketManager";
import { WebSocket } from "ws";

export interface userJwtClaims {
  userId: string;
  name: string;
  avatar: string;
  isGuest?: boolean;
}

export const extractAuthUser = (token: string, socket: WebSocket): User => {
  // if (token) {
  // const decoded = jwt.verify(token, JWT_SECRET) as userJwtClaims;
  const decoded = jwt.decode(token) as JwtPayload;
  console.log(decoded);

  const user = {
    userId: decoded?.sub ?? "user-id-test",
    name: decoded?.name ?? "Test",
    avatar: decoded?.picture ?? "okok",
  } satisfies userJwtClaims;

  return new User(socket, user);
  // }
};
