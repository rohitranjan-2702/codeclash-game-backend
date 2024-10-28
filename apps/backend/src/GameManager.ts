import { WebSocket } from "ws";
import { Quiz } from "./Quiz";
import { socketManager, User } from "./SocketManager";
import { Player } from "./types/types";
import db from "./db";

const collection = db.collection("leaderboard");

export class GameManager {
  private static instance: GameManager;
  private games: Quiz[];
  private users: User[];

  constructor() {
    this.games = [];
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
    if (this.users.find((x) => x.userId === user.userId)) {
      this.users = this.users.filter((x) => x.userId !== user.userId);
    }
    const socket = user.socket;
    this.users.push(user);
    this.addHandler(user);
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

    socket.on("message", async (data) => {
      const message = JSON.parse(data.toString());
      console.log(message);
      // write game logic here
      switch (message.type) {
        // search for a pending game in the list of games, if not found, create a new one
        case "CREATE_GAME":
          /*
            {
                "type": "CREATE_GAME",
                "quizName": "QUIZZZ",
                "questions": [{
                  "id": "1",
                  "text": "What is the capital of France?",
                  "options": ["London", "Berlin", "Paris", "Madrid"],
                  "correctAnswer": 2
                },
                {
                  "id": "2",
                  "text": "Which planet is known as the Red Planet?",
                  "options": ["Venus", "Mars", "Jupiter", "Saturn"],
                  "correctAnswer": 1
                }]
            }
          */
          const newQuiz = new Quiz(message.quizName, user);

          socketManager.addUser(user, newQuiz.quizId); // add user to the game_room
          newQuiz.addPlayer(user); // add user to the quiz
          newQuiz.addQuestions(message.questions); // add questions

          console.log("New quiz created:", newQuiz);
          this.games.push(newQuiz);

          const gameState = this.getGames().filter(
            (x) => x.quizId === newQuiz.quizId
          );

          console.log(gameState);

          // send a message to the game_room to notify the user that a new game has been created
          socketManager.broadcast(
            newQuiz.quizId,
            JSON.stringify({
              type: "GAME_ADDED",
              quizId: newQuiz.quizId,
              gameState: this.getGames()
                .filter((g) => g.quizId === newQuiz.quizId)
                .map((x) => {
                  return {
                    quizId: x.quizId,
                    quizName: x.quizName,
                    status: x.getStatus(),
                    questions: x.getQuestions(),
                    players: x.getPlayers().map((y) => {
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

        case "JOIN_GAME":
          const quiz = this.games.find((x) => x.quizId === message.quizId);
          if (!quiz) {
            console.error("Quiz not found?");
            return socket.send(
              JSON.stringify({
                type: "QUIZ_NOT_FOUND",
                quizId: message.quizId,
                gameState: this.getGames().map((x) => {
                  return {
                    quizId: x.quizId,
                    quizName: x.quizName,
                    leaderboard: x.getLeaderboard(),
                    status: x.getStatus(),
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
                  status: x.getStatus(),
                  questions: x.getQuestions(),
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

        case "LIST_GAMES":
          socket.send(
            JSON.stringify({
              type: "LIST_GAMES",
              games: this.getGames().map((x) => {
                return {
                  quizId: x.quizId,
                  quizName: x.quizName,
                  admin: x.admin,
                  status: x.getStatus(),
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

        case "EXIT_GAME":
          const game_to_exit = this.games.find(
            (x) => x.quizId === message.quizId
          );

          if (game_to_exit) {
            game_to_exit.removePlayer(user.userId);
            socketManager.broadcast(
              message.quizId,
              JSON.stringify({
                type: "PLAYER_LEFT",
                playerId: user.userId,
                players: game_to_exit.getPlayers().map((x) => {
                  return {
                    userId: x.userId,
                    name: x.name,
                    avatar: x.avatar,
                  };
                }),
              })
            );
          }
          break;

        case "START_GAME":
          const game_to_start = this.games.find(
            (x) => x.quizId === message.quizId
          );
          const admin = game_to_start?.admin;
          if (game_to_start && admin?.userId === user.userId) {
            this.games.find((x) => x.quizId === message.quizId)?.startGame();

            socketManager.broadcast(
              message.quizId,
              JSON.stringify({
                type: "GAME_STARTED",
                userId: user.userId,
                name: user.name,
                quizId: message.quizId,
                leaderboard: this.games
                  .find((x) => x.quizId === message.quizId)
                  ?.getLeaderboard(),
                gameState: this.getGames().map((x) => {
                  return {
                    quizId: x.quizId,
                    quizName: x.quizName,
                    currentQuestion: x.getCurrentQuestion(),
                    currentQuestionIndex: this.games.find(
                      (x) => x.quizId === message.quizId
                    )?.currentQuestionIndex,
                    status: x.getStatus(),
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
          } else {
            console.error("Game doesn't exists.");
            socketManager.broadcast(
              message.quizId,
              JSON.stringify({
                type: "GAME_ERROR",
                error: "Game doesn't exists.",
                userId: user.userId,
              })
            );
          }
          break;

        case "ANSWER_QUESTION":
          // {"type": "ANSWER_QUESTION", "answer": 2, "timeTaken": 1000, "difficulty": "easy"}
          // {type: "ANSWER_QUESTION", answer: 1, timeTaken: 1500, difficulty: "easy"}
          const game = this.games.find((x) => x.quizId === message.quizId);
          if (game) {
            game.submitAnswer(
              user.userId,
              message.answer,
              message.timeTaken,
              message.difficulty ?? "medium" // default difficulty level
            );

            // Broadcast the answer result to all players
            socketManager.broadcast(
              message.quizId,
              JSON.stringify({
                type: "LEADERBOARD_UPDATE",
                leaderboard: game.getLeaderboard(),
                gameState: this.getGames().map((x) => {
                  return {
                    quizId: x.quizId,
                    quizName: x.quizName,
                    status: x.getStatus(),
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
          } else {
            console.error("Game not found for quiz ID:", message.quizId);
            socketManager.broadcast(
              message.quizId,
              JSON.stringify({
                type: "GAME_ERROR",
                error: "Game not found for quiz ID:",
                userId: user.userId,
              })
            );
          }
          break;

        case "NEXT_QUESTION":
          // update the current question and send the new question to the client
          const gameToUpdate = this.games.find(
            (x) => x.quizId === message.quizId
          );
          if (gameToUpdate) {
            gameToUpdate.nextQuestion();

            if (
              gameToUpdate.currentQuestionIndex <
              gameToUpdate.getQuestions().length - 1
            ) {
              socketManager.broadcast(
                message.quizId,
                JSON.stringify({
                  type: "LEADERBOARD_UPDATE",
                  leaderboard: gameToUpdate.getLeaderboard(),
                  gameState: this.getGames().map((x) => {
                    return {
                      quizId: x.quizId,
                      quizName: x.quizName,
                      currentQuestion: x.getCurrentQuestion(),
                      currentQuestionIndex: gameToUpdate.currentQuestionIndex,
                      status: x.getStatus(),
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
            } else {
              socketManager.broadcast(
                message.quizId,
                JSON.stringify({
                  type: "GAME_OVER",
                  gameState: this.getGames().map((x) => {
                    return {
                      quizId: x.quizId,
                      quizName: x.quizName,
                      status: x.getStatus(),
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

              const ress = this.games
                .find((x) => x.quizId === message.quizId)
                ?.getLeaderboard()
                .map((x) => ({
                  quizId: message.quizId,
                  name: x.name,
                  score: x.score,
                  userId: x.userId,
                  avatar: x.avatar,
                }));

              collection.insertMany(ress ?? []);
            }
          } else {
            console.error("Game not found for quiz ID:", message.quizId);
            socketManager.broadcast(
              message.quizId,
              JSON.stringify({
                type: "GAME_ERROR",
                error: "Game not found for quiz ID:",
                userId: user.userId,
              })
            );
          }

          break;

        default:
          console.error("Unknown message type:", message.type);
      }
    });
  }
}
