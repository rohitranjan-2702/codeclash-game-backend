import { v4 as uuidv4 } from "uuid";
import { Scoreboard } from "./Scoreboard";
import { randomUUID } from "node:crypto";
import { LeaderboardItem, Player, Question } from "./types/types";

type DifficultyLevel = "easy" | "medium" | "hard";

interface DifficultyMultiplier {
  easy: number;
  medium: number;
  hard: number;
}

// Game State class using Singleton pattern
export class Quiz {
  private static instance: Quiz;
  public quizId: string;
  public quizName: string;
  public admin: Player;
  private players: Map<string, Player>;
  private questions: Question[];
  public currentQuestionIndex: number;
  private status: "WAITING" | "IN_PROGRESS" | "GAME_OVER";
  private scoreboard: Scoreboard;

  constructor(
    quizName: string,
    admin: Player,
    questions?: Question[],
    quizId?: string
  ) {
    this.players = new Map();
    this.quizName = quizName ?? "Random Quiz";
    this.questions = questions ?? [];
    this.admin = admin;
    this.currentQuestionIndex = 0;
    this.status = "WAITING";
    this.scoreboard = new Scoreboard();
    this.quizId = quizId ?? randomUUID().slice(0, 8);
  }

  public static getInstance(): Quiz {
    if (!Quiz.instance) {
      Quiz.instance = new Quiz("Random Quiz", {
        userId: "user1",
        name: "user1",
        avatar: "okok",
      });
    }
    return Quiz.instance;
  }

  // Player management
  public addPlayer(user: Player): string {
    this.players.set(user.userId, user);
    this.scoreboard.addPlayer(user.userId, user);
    return user.userId;
  }

  public removePlayer(id: string): void {
    this.players.delete(id);
    this.scoreboard.removePlayer(id);
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
    } else {
      throw new Error("Not enough players or questions to start the game");
    }
  }

  public submitAnswer(
    playerId: string,
    answerIndex: number,
    timeTaken: number,
    difficulty: DifficultyLevel
  ): void {
    const currentQuestion = this.getCurrentQuestion();
    if (currentQuestion && this.status === "IN_PROGRESS") {
      if (answerIndex === currentQuestion.correctAnswer) {
        const score = this.calculateScore(timeTaken, difficulty);
        this.scoreboard.updateScore(playerId, score);
      } else {
        this.scoreboard.updateScore(playerId, -100);
      }
    }
  }

  public nextQuestion(): void {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
    } else {
      this.endGame();
    }
  }

  public endGame(): void {
    this.status = "GAME_OVER";
  }

  // Getters
  public getStatus(): "WAITING" | "IN_PROGRESS" | "GAME_OVER" {
    return this.status;
  }

  public getQuestions(): Question[] {
    return this.questions;
  }

  public getLeaderboard(): LeaderboardItem[] {
    return this.scoreboard.getLeaderboard();
  }

  private calculateScore(
    timeTaken: number,
    difficulty: DifficultyLevel
  ): number {
    const baseScore = 1000;
    const timeMultiplier = 0.9; // Reduce score by 10% for each second

    const difficultyMultipliers: DifficultyMultiplier = {
      easy: 1,
      medium: 1.5,
      hard: 2,
    };

    const score =
      baseScore *
      Math.pow(timeMultiplier, timeTaken) *
      difficultyMultipliers[difficulty];

    return Math.round(Math.max(0, score)); // Ensures score is never negative
  }
}

// Example usage:
// const Quiz = Quiz.getInstance();
// Quiz.addPlayer("Player 1");
// Quiz.addPlayer("Player 2");
// Quiz.addQuestion("What is 2+2?", ["3", "4", "5", "6"], 1);
// Quiz.startGame();
