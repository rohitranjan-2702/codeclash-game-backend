import { WebSocketServer } from "ws";
import { GameState } from "./Game";
import { SocketManager } from "./SocketManager";
import { KafkaProducer } from "./KafkaProducer";

const KAFKA_BROKERS = ["localhost:9092"]; // Replace with your Redpanda brokers
const KAFKA_CLIENT_ID = "quiz-game-producer";

async function main() {
  const wss = new WebSocketServer({ port: 8080 });
  const gameState = GameState.getInstance();

  const kafkaProducer = new KafkaProducer(KAFKA_BROKERS, KAFKA_CLIENT_ID);
  await kafkaProducer.connect();

  const socketManager = new SocketManager(gameState, kafkaProducer);

  wss.on("connection", (socket) => {
    socketManager.addClient(socket);
  });

  console.log("WebSocket server is running on port 8080");

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("Shutting down...");
    await kafkaProducer.disconnect();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("Error starting the server:", error);
  process.exit(1);
});
