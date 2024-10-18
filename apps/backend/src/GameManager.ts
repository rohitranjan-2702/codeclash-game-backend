import { WebSocket } from "ws";
import { Quiz } from "./Quiz";
import { socketManager, User } from "./SocketManager";
import { Player } from "./types/types";

export class GameManager {
  private static instance: GameManager;
  private games: Quiz[];
  private pendingGameId: string | null;
  private users: User[];

  constructor() {
    this.games = [];
    this.pendingGameId = null;
    this.users = [];
  }

  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  getGames(): Quiz[] {
    return this.games;
  }

  getPlayers(quizId: string): Player[] {
    return this.games.find((x) => x.quizId === quizId)?.getPlayers() ?? [];
  }

  addUser(user: User) {
    // if (this.users.find((x) => x.userId === user.userId)) {
    //   console.error("User already exists in the list?");
    //   return;
    // }
    this.users.push(user);
    this.addHandler(user);
    console.log("ADDING USER", user.name);
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
        userId: user.userId,
        name: user.name,
        gameState: this.getGames().map((x) => {
          return {
            quizId: x.quizId,
            quizName: x.quizName,
            players: this.getPlayers(x.quizId).map((y) => {
              return {
                name: y.name,
                userId: y.userId,
                avatar: y.avatar,
              };
            }),
          };
        }),
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

          this.pendingGameId = newQuiz.quizId;
          socketManager.addUser(user, newQuiz.quizId); // add user to the game_room
          newQuiz.addPlayer(user); // add user to the quiz

          // send a message to the game_room to notify the user that a new game has been created
          socketManager.broadcast(
            newQuiz.quizId,
            JSON.stringify({
              type: "GAME_ADDED",
              quizId: newQuiz.quizId,
              gameState: this.getGames().map((x) => {
                return {
                  quizId: x.quizId,
                  quizName: x.quizName,
                  players: this.getPlayers(x.quizId).map((y) => {
                    return {
                      name: y.name,
                      userId: y.userId,
                      avatar: y.avatar,
                    };
                  }),
                };
              }),
            })
          );
          console.log("New quiz created:", newQuiz);
          this.games.push(newQuiz);

          break;

        case "JOIN_GAME":
          const quizId = message.quizId;
          const quiz = this.games.find((x) => x.quizId === quizId);
          if (!quiz) {
            console.error("Quiz not found?");
            return socket.send(
              JSON.stringify({
                type: "QUIZ_NOT_FOUND",
                quizId: quizId,
                gameState: this.getGames().map((x) => {
                  return {
                    quizId: x.quizId,
                    quizName: x.quizName,
                    players: this.getPlayers(x.quizId).map((y) => {
                      return {
                        name: y.name,
                        userId: y.userId,
                        avatar: y.avatar,
                      };
                    }),
                  };
                }),
              })
            );
          }

          // restrict user from joining its own quiz
          const isUserAlreadyJoined = quiz
            .getPlayers()
            .find((x) => x.userId === user.userId);

          if (isUserAlreadyJoined) {
            console.error("User already joined the quiz?");
            return socket.send(
              JSON.stringify({
                type: "ALREADY_JOINED",
                quizId: quiz.quizId,
                gameState: this.getGames().map((x) => {
                  return {
                    quizId: x.quizId,
                    quizName: x.quizName,
                    players: this.getPlayers(x.quizId).map((y) => {
                      return {
                        name: y.name,
                        userId: y.userId,
                        avatar: y.avatar,
                      };
                    }),
                  };
                }),
              })
            );
          }
          quiz.addPlayer(user);
          socketManager.addUser(user, quiz.quizId);
          socketManager.broadcast(
            quiz.quizId,
            JSON.stringify({
              type: "USER_JOINED",
              userId: user.userId,
              name: user.name,
              quizId: quiz.quizId,
              gameState: this.getGames().map((x) => {
                return {
                  quizId: x.quizId,
                  quizName: x.quizName,
                  players: this.getPlayers(x.quizId).map((y) => {
                    return {
                      name: y.name,
                      userId: y.userId,
                      avatar: y.avatar,
                    };
                  }),
                };
              }),
            })
          );

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
