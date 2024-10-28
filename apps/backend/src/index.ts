import { WebSocket } from "ws";
import express, { Request, Response } from "express";
import url from "url";
import cors from "cors";
import { GameManager } from "./GameManager";
import { extractAuthUser } from "./auth";
import { WebSocketServer } from "ws";

import { KafkaProducer } from "./Producer";

const KAFKA_BROKERS = [process.env.BROKERS || "localhost:9092"]; // Replace with your Redpanda brokers
const KAFKA_CLIENT_ID = "quiz-game-producer";

const PORT = process.env.PORT || 8000;
const app = express();

app.use(cors());
app.use(express.json());

async function main() {
  const httpServer = app.listen(PORT, () =>
    console.log(`Listening on port ${PORT}`)
  );
  const wss = new WebSocketServer({ server: httpServer });

  const kafkaProducer = new KafkaProducer(KAFKA_BROKERS, KAFKA_CLIENT_ID);

  const gameManager = GameManager.getInstance();

  wss.on("connection", (socket: WebSocket, req: Request) => {
    //@ts-ignore
    const token: string = url.parse(req.url, true).query.token;
    console.log("token", token);
    const user = extractAuthUser(token, socket);

    console.log(req.url);
    gameManager.addUser(user);
    console.log(gameManager);

    console.log("User Connected", user.userId, user.name);

    socket.on("disconnect", () => {
      console.log("User Disconnected", socket.url);
      gameManager.removeUser(socket);
    });
  });

  app.get("/", (req: Request, res: Response) => {
    res.send("Server Running Fine 🚀");
  });

  app.get("/games", async (req: Request, res: Response) => {
    console.log(gameManager);
    const games = gameManager.getGames().map((x) => {
      return {
        quizId: x.quizId,
        quizName: x.quizName,
        players: gameManager.getPlayers(x.quizId).map((y) => {
          return {
            name: y.name,
            userId: y.userId,
            avatar: y.avatar,
          };
        }),
      };
    });

    res.json(games);
  });

  app.get("/games/:gameId", async (req: Request, res: Response) => {
    const gameId = req.params.gameId;
    const players = gameManager.getPlayers(gameId).map((x) => {
      return {
        name: x.name,
        userId: x.userId,
        avatar: x.avatar,
      };
    });

    res.json({
      gameId,
      players,
    });
  });

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("Shutting down...");
    // await kafkaProducer.disconnect();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("Error starting the server:", error);
  process.exit(1);
});
