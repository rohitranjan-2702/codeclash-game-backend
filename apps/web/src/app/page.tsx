/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import QuizComponent from "@/components/quiz-component";
import { useSocket } from "@/hooks/useSocket";
import { useEffect, useState } from "react";

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

const toekn_1 =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gUk9FIiwidXNlcklkIjoiaWlpaWlpIiwiYXZhdGFyIjoiZ2hnaGdoZyIsImlhdCI6MTUxNjIzOTAyMn0.45gvQv2EtdAgPAIpdVlv7mG7IzYuz2UOL-QVeQqcxbw";

export default function Home() {
  const [token, setToken] = useState<string>(toekn_1);
  const [input, setInput] = useState<string>("");
  const [gameId, setGameId] = useState<string>("");
  const socket = useSocket(token);
  const [msg, setMsg] = useState<any[]>([]);
  const [gameState, setGameState] = useState(null);
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: "1",
      text: "What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Madrid"],
      correctAnswer: 2,
    },
    {
      id: "2",
      text: "Which planet is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Saturn"],
      correctAnswer: 1,
    },
  ]);

  useEffect(() => {
    if (!socket) {
      return;
    }
    socket.onmessage = function (event) {
      const message = JSON.parse(event.data);
      console.log(message);
      if (message.gameState) {
        setGameState(message.gameState);
        if (message.gameState[0]?.questions.length > 0) {
          setQuestions(message.gameState[0].questions);
        }
      }

      setMsg((prev) => [...prev, message]);
    };
    console.log(msg);
    console.log("socket", socket);

    return () => {
      socket.onmessage = null; // Clean up the previous handler
    };
  }, [socket]);

  const joinGame = (gameId: string) => {
    if (socket) {
      socket.send(
        JSON.stringify({
          type: "JOIN_GAME",
          quizId: gameId,
        })
      );
    } else {
      console.log("join failed");
    }
  };

  const startGame = (gameId: string) => {
    socket?.send(
      JSON.stringify({
        type: "START_GAME",
        quizId: gameId,
      })
    );
  };

  const createGame = () => {
    console.log("create", socket);
    const create_game_message: {
      type: string;
      quizName: string;
      questions: Question[];
    } = {
      type: "CREATE_GAME",
      quizName: "QUIZZZ",
      questions: [
        {
          id: "1",
          text: "What is 2+2?",
          options: ["3", "4", "5", "6"],
          correctAnswer: 1,
        },
        {
          id: "2",
          text: "What is 5+5?",
          options: ["10", "11", "12", "13"],
          correctAnswer: 0,
        },
        {
          id: "3",
          text: "What is 10+10?",
          options: ["24", "21", "20", "23"],
          correctAnswer: 2,
        },
      ],
    };
    if (socket) {
      socket.send(JSON.stringify(create_game_message));
    } else {
      console.log("msg not sent", create_game_message);
    }
  };

  const renderLoginForm = () => {
    <form onSubmit={() => setToken(input)}>
      <input
        type="text"
        value={input}
        className="text-black"
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter your username"
        required
      />
      <button type="submit">Join Game</button>
    </form>;
  };

  const renderJoinForm = () => {
    <form onSubmit={() => joinGame(gameId)}>
      <input
        type="text"
        value={gameId}
        className="text-black"
        onChange={(e) => setGameId(e.target.value)}
        placeholder="Enter your username"
        required
      />
      <button type="submit">Join Game</button>
    </form>;
  };

  const createNewGame = () => {
    <button
      onClick={() => createGame()}
      className="bg-white text-black p-2 rounded-full"
    >
      Init Game
    </button>;
  };

  const renderStartButton = () => {
    <button
      onClick={() => startGame(gameId)}
      className="bg-green-500 text-black p-2 rounded-full"
    >
      Start Game
    </button>;
  };

  // const renderGameContent = () => {
  //   switch (gameState[0]?.status) {
  //     case "Waiting":
  //       return renderWaitingRoom();
  //     case "InProgress":
  //       return (
  //         <>
  //           {renderQuestion()}
  //           <button onClick={nextQuestion}>Next Question</button>
  //           {renderLeaderboard()}
  //         </>
  //       );
  //     case "Finished":
  //       return (
  //         <>
  //           <h2>Game Over!</h2>
  //           {renderLeaderboard()}
  //         </>
  //       );
  //     default:
  //       return renderJoinForm();
  //   }
  // };

  return (
    <div className="flex justify-center items-center h-screen bg-black w-full">
      <div>
        <QuizComponent questions={questions} />
      </div>

      <div className="flex flex-col gap-4 items-center justify-center">
        <h1>Multiplayer Quiz Game</h1>
        <button className="bg-gray-900 text-orange-500 p-2 rounded-full">
          {gameState && gameState[0]?.status === 0 ? "Waiting" : "In Progress"}
        </button>
        {/* {renderGameContent()} */}
      </div>

      {/* <div className="flex flex-col gap-4 items-center justify-center">
        {msg.map((m, i) => (
          <div key={i} className="text-sm text-white p-2 rounded-full max-w-24">
            {JSON.stringify(m)}
          </div>
        ))}
      </div> */}
    </div>
  );
}
