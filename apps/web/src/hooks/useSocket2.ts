/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";

interface GameState {
  status: string;
  players: { id: string; name: string }[];
  currentQuestion: {
    id: string;
    text: string;
    options: string[];
  } | null;
  leaderboard: { id: string; name: string; score: number }[];
}

interface UseSocketReturn {
  gameState: GameState | null;
  sendMessage: (message: any) => void;
  joinGame: (name: string) => void;
  startGame: () => void;
  submitAnswer: (answerIndex: number) => void;
  nextQuestion: () => void;
}

const useSocket = (url: string): UseSocketReturn => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);

  console.log("socket", socket);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log("WebSocket connected");
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      console.log(event);
      const data = JSON.parse(event.data);
      console.log(data);
      if (data.type === "gameState") {
        setGameState(data.data);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      ws.close();
    };
  }, [url]);

  const sendMessage = useCallback(
    (message: any) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      }
    },
    [socket]
  );

  const joinGame = useCallback(
    (gameId: string) => {
      sendMessage({ type: "JOIN_GAME", quizId: gameId });
    },
    [sendMessage]
  );

  const startGame = useCallback(() => {
    console.log("start_game");
    sendMessage({ type: "INIT_GAME", quizName: "QUIZZZ" });
  }, [sendMessage]);

  const submitAnswer = useCallback(
    (answerIndex: number) => {
      sendMessage({ type: "answer", answerIndex });
    },
    [sendMessage]
  );

  const nextQuestion = useCallback(() => {
    sendMessage({ type: "next" });
  }, [sendMessage]);

  return {
    gameState,
    sendMessage,
    joinGame,
    startGame,
    submitAnswer,
    nextQuestion,
  };
};

export default useSocket;
