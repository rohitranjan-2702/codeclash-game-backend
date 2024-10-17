import { WebSocket } from "ws";
import { Quiz } from "./Quiz";
import { socketManager, User } from "./SocketManager";
// import {  } from "./types/types";

export class GameManager {
  private games: Quiz[];
  private pendingGameId: string | null;
  private users: User[];

  constructor() {
    this.games = [];
    this.pendingGameId = null;
    this.users = [];
  }

  addUser(user: User) {
    this.users.push(user);
    this.addHandler(user);
  }

  removeUser(socket: WebSocket) {
    const user = this.users.find((user) => user.socket === socket);
    if (!user) {
      console.error("User not found?");
      return;
    }
    this.users = this.users.filter((user) => user.socket !== socket);
    socketManager.removeUser(user);
  }

  removeGame(gameId: string) {
    this.games = this.games.filter((g) => g.quizId !== gameId);
  }

  private addHandler(user: User) {
    const socket = user.socket;
    socket.send(
      JSON.stringify({
        type: "USER_CONNECTED",
        userId: user.id,
        name: user.name,
      })
    );

    // socket.emit(
    //   "GAME_ALERTS",
    //   JSON.stringify({
    //     type: "USER_CONNECTED",
    //     userId: user.id,
    //     name: user.name,
    //   })
    // );
    socket.on("message", async (data) => {
      const message = JSON.parse(data.toString());
      console.log(message);
      // write game logic here
      switch (message.type) {
        // search for a pending game in the list of games, if not found, create a new one
        case "INIT_GAME":
          if (this.pendingGameId) {
            const quiz = this.games.find(
              (x) => x.quizId === this.pendingGameId
            );
            if (!quiz) {
              console.error("Pending game not found?");
              return;
            }
          }
          const newQuiz = new Quiz(message.quizName);
          this.games.push(newQuiz);
          console.log("New quiz created:", newQuiz);

          this.pendingGameId = newQuiz.quizId;
          socketManager.addUser(user, newQuiz.quizId); // add user to the game_room
          newQuiz.addPlayer(user); // add user to the quiz
          // send a message to the game_room to notify the user that a new game has been created
          socketManager.broadcast(
            newQuiz.quizId,
            JSON.stringify({
              type: "GAME_ADDED",
              quizId: newQuiz.quizId,
            })
          );

          break;
        case "JOIN_GAME":
          break;
        case "START_GAME":
          break;
        case "ANSWER_QUESTION":
          break;
        case "NEXT_QUESTION":
          break;
        default:
          console.error("Unknown message type:", message.type);
      }
    });
  }
}
