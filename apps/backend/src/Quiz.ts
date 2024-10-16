import { v4 as uuidv4 } from "uuid";
import { Scoreboard } from "./Scoreboard";
import { randomUUID } from "node:crypto";

// Interfaces
interface Player {
  id: string;
  name: string;
}

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

// Enums
enum GameStatus {
  Waiting,
  InProgress,
  Finished,
}

// Observer pattern for game events
interface GameObserver {
  update(Quiz: Quiz): void;
}

// Game State class using Singleton pattern
export class Quiz {
  private static instance: Quiz;
  public quizId: string;
  private players: Map<string, Player>;
  private questions: Question[];
  private currentQuestionIndex: number;
  private status: GameStatus;
  private observers: GameObserver[];
  private scoreboard: Scoreboard;

  private constructor(quizId?: string) {
    this.players = new Map();
    this.questions = [];
    this.currentQuestionIndex = 0;
    this.status = GameStatus.Waiting;
    this.observers = [];
    this.scoreboard = new Scoreboard();
    this.quizId = quizId ?? randomUUID();
    // Listen for scoreboard updates
    this.scoreboard.on("update", () => this.notifyObservers());
  }

  public static getInstance(): Quiz {
    if (!Quiz.instance) {
      Quiz.instance = new Quiz();
    }
    return Quiz.instance;
  }

  // Player management
  public addPlayer(name: string): string {
    const id = uuidv4();
    this.players.set(id, { id, name });
    this.scoreboard.addPlayer(id, name);
    this.notifyObservers();
    return id;
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
  public addQuestion(
    text: string,
    options: string[],
    correctAnswer: number
  ): void {
    this.questions.push({
      id: uuidv4(),
      text,
      options,
      correctAnswer,
    });
  }

  public getCurrentQuestion(): Question | null {
    return this.questions[this.currentQuestionIndex] || null;
  }

  // Game flow
  public startGame(): void {
    if (this.players.size > 1 && this.questions.length > 0) {
      this.status = GameStatus.InProgress;
      this.currentQuestionIndex = 0;
      this.scoreboard.resetScores();
      this.notifyObservers();
    } else {
      throw new Error("Not enough players or questions to start the game");
    }
  }

  public submitAnswer(playerId: string, answerIndex: number): void {
    const currentQuestion = this.getCurrentQuestion();
    if (currentQuestion && this.status === GameStatus.InProgress) {
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
    this.status = GameStatus.Finished;
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
  public getStatus(): GameStatus {
    return this.status;
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
