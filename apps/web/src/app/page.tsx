/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useSocket } from "@/hooks/useSocket";
import { useEffect, useState } from "react";

const toekn_1 =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gUk9FIiwidXNlcklkIjoiaWlpaWlpIiwiYXZhdGFyIjoiZ2hnaGdoZyIsImlhdCI6MTUxNjIzOTAyMn0.45gvQv2EtdAgPAIpdVlv7mG7IzYuz2UOL-QVeQqcxbw";

export default function Home() {
  const [token, setToken] = useState<string>(toekn_1);
  const [input, setInput] = useState<string>("");
  const [input2, setInput2] = useState<string>("");
  const socket = useSocket(token);
  const [msg, setMsg] = useState<any[]>([]);

  useEffect(() => {
    if (!socket) {
      return;
    }
    socket.onmessage = function (event) {
      const message = JSON.parse(event.data);
      console.log(message);

      setMsg((prev) => [...prev, message]);
    };
    console.log(msg);

    return () => {
      socket.onmessage = null; // Clean up the previous handler
    };
  }, [socket]);

  const joinGame = (gameId: string) => {
    socket?.send(
      JSON.stringify({
        type: "JOIN_GAME",
        quizId: gameId,
      })
    );
  };

  const initGame = () => {
    socket?.send(JSON.stringify({ type: "INIT_GAME", quizName: "QUIZZZ" }));
  };
  return (
    <div className="flex justify-center items-center h-screen bg-black w-full">
      <input
        type="text"
        className="text-black"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button
        onClick={() => setToken(input)}
        className="bg-white text-black p-2 rounded-full"
      >
        Change Token
      </button>
      <button
        onClick={() => initGame()}
        className="bg-white text-black p-2 rounded-full"
      >
        Init Game
      </button>
      <input
        type="text"
        className="text-black"
        value={input2}
        onChange={(e) => setInput2(e.target.value)}
      />
      <button
        onClick={() => joinGame(input2)}
        className="bg-white text-black p-2 rounded-full"
      >
        Join Game
      </button>
      <div className="flex flex-col gap-4 items-center justify-center">
        {msg.map((m, i) => (
          <div key={i} className=" text-white p-2 rounded-full">
            {JSON.stringify(m)}
          </div>
        ))}
      </div>
    </div>
  );
}
