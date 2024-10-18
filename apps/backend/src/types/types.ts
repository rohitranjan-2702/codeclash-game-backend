export interface Player {
  name: string;
  userId: string;
  avatar: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

export enum GameStatus {
  Waiting,
  InProgress,
  Finished,
}

export interface LeaderboardItem {
  id: string;
  name: string;
  score: number;
  userId: string;
  avatar: string;
}

// export enum Messages {
//   INIT_GAME,
//   JOIN_GAME,
//   START_GAME,
//   ANSWER_QUESTION,
//   GAME_ADDED,
//   GAME_ALERT,
//   NEXT_QUESTION,
// }
