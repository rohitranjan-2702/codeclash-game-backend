import { EventEmitter } from "events";

interface Player {
  id: string;
  name: string;
  score: number;
}

export class Scoreboard extends EventEmitter {
  private scores: Map<string, number>;
  private playerNames: Map<string, string>;

  constructor() {
    super();
    this.scores = new Map();
    this.playerNames = new Map();
  }

  public addPlayer(playerId: string, playerName: string): void {
    this.scores.set(playerId, 0);
    this.playerNames.set(playerId, playerName);
    this.emitUpdate();
  }

  public removePlayer(playerId: string): void {
    this.scores.delete(playerId);
    this.playerNames.delete(playerId);
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

  public getLeaderboard(): Player[] {
    const leaderboard = Array.from(this.scores.entries()).map(
      ([id, score]) => ({
        id,
        name: this.playerNames.get(id) || "Unknown",
        score,
      })
    );

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
