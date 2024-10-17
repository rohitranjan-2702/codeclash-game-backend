import prisma from "db";
import { WebSocket } from "ws";
import express, { Request, Response } from "express";
import url from "url";
import cors from "cors";
import { GameManager } from "./GameManager";
import { extractAuthUser } from "./auth";
import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 8000;
const app = express();

app.use(cors());
app.use(express.json());

const httpServer = app.listen(PORT, () =>
  console.log(`Listening on port ${PORT}`)
);
const wss = new WebSocketServer({ server: httpServer });

const gameManager = new GameManager();

wss.on("connection", (socket: WebSocket, req: Request) => {
  //@ts-ignore
  const token: string = url.parse(req.url, true).query.token;
  const user = extractAuthUser(token, socket);
  gameManager.addUser(user);

  console.log("User Connected", user.userId, user.name);

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.url);
    gameManager.removeUser(socket);
  });
});

app.get("/", (req: Request, res: Response) => {
  res.send("Server Running Fine 🚀");
});

app.get("/users", async (req: Request, res: Response) => {
  const users = await prisma.user.findMany();
  res.json(users);
});
