import { EventEmitter } from "events";
import { LeaderboardItem, Player } from "./types/types";

export class Scoreboard extends EventEmitter {
  private scores: Map<string, number>;
  private players: Map<string, Player>;

  constructor() {
    super();
    this.scores = new Map();
    this.players = new Map();
  }

  public addPlayer(playerId: string, player: Player): void {
    this.scores.set(playerId, 0);
    this.players.set(playerId, player);
    this.emitUpdate();
  }

  public removePlayer(playerId: string): void {
    this.scores.delete(playerId);
    this.players.delete(playerId);
    this.emitUpdate();
  }

  public updateScore(playerId: string, points: number): void {
    const currentScore = this.scores.get(playerId) || 0;
    this.scores.set(playerId, currentScore + points);
    this.emitUpdate();
  }

  public getScore(playerId: string): number {
    return this.scores.get(playerId) || 0;
  }

  public getLeaderboard(): LeaderboardItem[] {
    const leaderboard: LeaderboardItem[] = Array.from(
      this.scores.entries()
    ).map(([id, score]) => ({
      id,
      name: this.players.get(id)?.name || "Unknown",
      score,
      userId: this.players.get(id)?.userId || "",
      avatar: this.players.get(id)?.avatar || "",
    }));

    return leaderboard.sort((a, b) => b.score - a.score);
  }

  public resetScores(): void {
    for (const playerId of this.scores.keys()) {
      this.scores.set(playerId, 0);
    }
    this.emitUpdate();
  }

  private emitUpdate(): void {
    this.emit("update", this.getLeaderboard());
  }
}

// Example usage:
// const scoreboard = new Scoreboard();
// scoreboard.on('update', (leaderboard) => {
//   console.log('Leaderboard updated:', leaderboard);
// });
// scoreboard.addPlayer('player1', 'Alice');
// scoreboard.addPlayer('player2', 'Bob');
// scoreboard.updateScore('player1', 5);
// scoreboard.updateScore('player2', 3);
