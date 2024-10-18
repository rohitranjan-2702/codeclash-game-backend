import { v4 as uuidv4 } from "uuid";
import { Scoreboard } from "./Scoreboard";
import { randomUUID } from "node:crypto";
import { Player, Question } from "./types/types";

// Enums

// Observer pattern for game events
interface GameObserver {
  update(Quiz: Quiz): void;
}

// Game State class using Singleton pattern
export class Quiz {
  private static instance: Quiz;
  public quizId: string;
  public quizName: string;
  private players: Map<string, Player>;
  private questions: Question[];
  private currentQuestionIndex: number;
  private status: "WAITING" | "IN_PROGRESS" | "GAME_OVER";
  private observers: GameObserver[];
  private scoreboard: Scoreboard;

  constructor(quizName: string, quizId?: string) {
    this.players = new Map();
    this.quizName = quizName ?? "Random Quiz";
    this.questions = [];
    this.currentQuestionIndex = 0;
    this.status = "WAITING";
    this.observers = [];
    this.scoreboard = new Scoreboard();
    this.quizId = quizId ?? randomUUID().slice(0, 8);
    // Listen for scoreboard updates
    this.scoreboard.on("update", () => this.notifyObservers());
  }

  public static getInstance(): Quiz {
    if (!Quiz.instance) {
      Quiz.instance = new Quiz("Random Quiz");
    }
    return Quiz.instance;
  }

  // Player management
  public addPlayer(user: Player): string {
    this.players.set(user.userId, user);
    this.scoreboard.addPlayer(user.userId, user);
    this.notifyObservers();
    return user.userId;
  }

  public removePlayer(id: string): void {
    this.players.delete(id);
    this.scoreboard.removePlayer(id);
    this.notifyObservers();
  }

  public getPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  // Question management
  public addQuestions(questions: Question[]): void {
    this.questions.push(...questions);
  }

  public getCurrentQuestion(): Question | null {
    return this.questions[this.currentQuestionIndex] || null;
  }

  // Game flow
  public startGame(): void {
    if (this.players.size > 1 && this.questions.length > 0) {
      this.status = "IN_PROGRESS";
      this.currentQuestionIndex = 0;
      this.scoreboard.resetScores();
      this.notifyObservers();
    } else {
      throw new Error("Not enough players or questions to start the game");
    }
  }

  public submitAnswer(playerId: string, answerIndex: number): void {
    const currentQuestion = this.getCurrentQuestion();
    if (currentQuestion && this.status === "IN_PROGRESS") {
      if (answerIndex === currentQuestion.correctAnswer) {
        this.scoreboard.updateScore(playerId, 1);
      }
      this.notifyObservers();
    }
  }

  public nextQuestion(): void {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.notifyObservers();
    } else {
      this.endGame();
    }
  }

  public endGame(): void {
    this.status = "GAME_OVER";
    this.notifyObservers();
  }

  // Observer pattern methods
  public addObserver(observer: GameObserver): void {
    this.observers.push(observer);
  }

  public removeObserver(observer: GameObserver): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  private notifyObservers(): void {
    for (const observer of this.observers) {
      observer.update(this);
    }
  }

  // Getters
  public getStatus(): "WAITING" | "IN_PROGRESS" | "GAME_OVER" {
    return this.status;
  }

  public getQuestions(): Question[] {
    return this.questions;
  }

  public getLeaderboard(): Player[] {
    return this.scoreboard.getLeaderboard();
  }
}

// Example usage:
// const Quiz = Quiz.getInstance();
// Quiz.addPlayer("Player 1");
// Quiz.addPlayer("Player 2");
// Quiz.addQuestion("What is 2+2?", ["3", "4", "5", "6"], 1);
// Quiz.startGame();
