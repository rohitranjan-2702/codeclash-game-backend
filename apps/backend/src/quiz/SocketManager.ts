import WebSocket from "ws";
import { EventEmitter } from "events";
import { GameState } from "./Game";
import { v4 as uuidv4 } from "uuid";
import { KafkaProducer } from "./KafkaProducer";

interface SocketClient {
  id: string;
  socket: WebSocket;
  playerId: string | null;
}

interface SocketMessage {
  type: string;
  [key: string]: any;
}

export class SocketManager extends EventEmitter {
  private clients: Map<string, SocketClient>;
  private gameState: GameState;
  private kafkaProducer: KafkaProducer;

  constructor(gameState: GameState, kafkaProducer: KafkaProducer) {
    super();
    this.clients = new Map();
    this.gameState = gameState;
    this.kafkaProducer = kafkaProducer;

    // Register as an observer to the game state
    this.gameState.addObserver({
      update: (gameState: GameState) => {
        this.broadcastGameState();
      },
    });

    // Set up event listeners for Kafka publishing
    this.setupKafkaEventListeners();
  }

  private setupKafkaEventListeners(): void {
    const publishToKafka = (topic: string, message: any) => {
      this.kafkaProducer
        .sendMessage(topic, message)
        .catch((error) => console.error("Error publishing to Kafka:", error));
    };

    this.on("clientConnected", (clientId) => {
      publishToKafka("client-events", { type: "clientConnected", clientId });
    });

    this.on("clientDisconnected", (clientId) => {
      publishToKafka("client-events", { type: "clientDisconnected", clientId });
    });

    this.on("playerJoined", (clientId, playerId, name) => {
      publishToKafka("game-events", {
        type: "playerJoined",
        clientId,
        playerId,
        name,
      });
    });

    this.on("gameStarted", () => {
      publishToKafka("game-events", { type: "gameStarted" });
    });

    this.on("answerSubmitted", (playerId, answerIndex) => {
      publishToKafka("game-events", {
        type: "answerSubmitted",
        playerId,
        answerIndex,
      });
    });

    this.on("nextQuestion", () => {
      publishToKafka("game-events", { type: "nextQuestion" });
    });

    this.on("gameStateUpdated", (gameState) => {
      publishToKafka("game-events", { type: "gameStateUpdated", gameState });
    });

    this.on("error", (error) => {
      publishToKafka("error-events", { type: "error", error: error.message });
    });
  }

  public addClient(socket: WebSocket): string {
    const clientId = uuidv4();
    this.clients.set(clientId, { id: clientId, socket, playerId: null });

    socket.on("message", (message: string) => {
      this.handleMessage(clientId, message);
    });

    socket.on("close", () => {
      this.removeClient(clientId);
    });

    this.emit("clientConnected", clientId);
    return clientId;
  }

  private removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client && client.playerId) {
      this.gameState.removePlayer(client.playerId);
    }
    this.clients.delete(clientId);
    this.emit("clientDisconnected", clientId);
  }

  private handleMessage(clientId: string, message: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      const data: SocketMessage = JSON.parse(message);
      this.emit("message", clientId, data);

      switch (data.type) {
        case "join":
          const playerId = this.gameState.addPlayer(data.name);
          client.playerId = playerId;
          this.sendToClient(clientId, { type: "joined", playerId });
          this.emit("playerJoined", clientId, playerId, data.name);
          break;
        case "start":
          this.gameState.startGame();
          this.emit("gameStarted");
          break;
        case "answer":
          if (client.playerId) {
            this.gameState.submitAnswer(client.playerId, data.answerIndex);
            this.emit("answerSubmitted", client.playerId, data.answerIndex);
          }
          break;
        case "next":
          this.gameState.nextQuestion();
          this.emit("nextQuestion");
          break;
        default:
          console.log("Unknown message type:", data.type);
          this.emit("unknownMessage", clientId, data);
      }
    } catch (error) {
      console.error("Error handling message:", error);
      this.emit("error", error);
    }
  }

  private broadcastGameState(): void {
    const gameStateData = {
      status: this.gameState.getStatus(),
      players: this.gameState.getPlayers(),
      currentQuestion: this.gameState.getCurrentQuestion(),
      leaderboard: this.gameState.getLeaderboard(),
    };

    this.broadcast({
      type: "gameState",
      data: gameStateData,
    });

    this.emit("gameStateUpdated", gameStateData);
  }

  public broadcast(message: any): void {
    const messageString = JSON.stringify(message);
    for (const client of this.clients.values()) {
      client.socket.send(messageString);
    }
    this.emit("broadcast", message);
  }

  public sendToClient(clientId: string, message: any): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.socket.send(JSON.stringify(message));
      this.emit("messageSent", clientId, message);
    }
  }
}
