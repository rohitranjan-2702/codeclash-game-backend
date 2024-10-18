"use client";
import React, { useState } from "react";
import useSocket from "@/hooks/useSocket2";

const QuizGame: React.FC = () => {
  const [id, setId] = useState(1);
  const [playerName, setPlayerName] = useState("");
  const { gameState, joinGame, startGame, submitAnswer, nextQuestion } =
    useSocket(`ws://localhost:8000`);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName) {
      joinGame(playerName);
    }
  };

  const renderJoinForm = () => (
    <form onSubmit={handleJoin}>
      <input
        type="text"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        placeholder="Enter your name"
        required
      />
      <button type="submit">Join Game</button>
    </form>
  );

  const renderWaitingRoom = () => (
    <div>
      <h2>Waiting for players...</h2>
      <p>Players joined: {gameState?.players.length}</p>
      {gameState?.players.map((player) => (
        <div key={player.id}>{player.name}</div>
      ))}
      <button onClick={startGame}>Start Game</button>
    </div>
  );

  const renderQuestion = () => {
    if (!gameState?.currentQuestion) return null;
    return (
      <div>
        <h2>{gameState.currentQuestion.text}</h2>
        {gameState.currentQuestion.options.map((option, index) => (
          <button key={index} onClick={() => submitAnswer(index)}>
            {option}
          </button>
        ))}
      </div>
    );
  };

  const renderLeaderboard = () => (
    <div>
      <h2>Leaderboard</h2>
      <ol>
        {gameState?.leaderboard.map((player) => (
          <li key={player.id}>
            {player.name}: {player.score}
          </li>
        ))}
      </ol>
    </div>
  );

  const renderGameContent = () => {
    switch (gameState?.status) {
      case "Waiting":
        return renderWaitingRoom();
      case "InProgress":
        return (
          <>
            {renderQuestion()}
            <button onClick={nextQuestion}>Next Question</button>
            {renderLeaderboard()}
          </>
        );
      case "Finished":
        return (
          <>
            <h2>Game Over!</h2>
            {renderLeaderboard()}
          </>
        );
      default:
        return renderJoinForm();
    }
  };

  return (
    <div>
      <button onClick={() => setId(id + 1)}>Next</button>
      <button onClick={startGame}>Start Game</button>
      <h1>Multiplayer Quiz Game {id}</h1>
      {renderGameContent()}
    </div>
  );
};

export default QuizGame;
