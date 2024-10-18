/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

const questions: Question[] = [
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
  // Add more questions as needed
];

export default function QuizComponent({
  questions,
}: {
  questions: Question[];
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setTimeLeft(10);
      setSelectedAnswer(null);
    }
  }, [timeLeft, currentQuestionIndex]);

  console.log("currentQuestionIndex", currentQuestionIndex);

  console.log(questions);

  const currentQuestion = questions[currentQuestionIndex];

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
        <h1 className="text-4xl font-bold text-white">Quiz Completed!</h1>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 p-4">
      <motion.div
        key={currentQuestion.id}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          {currentQuestion.text}
        </h2>
        <div className="space-y-2">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => setSelectedAnswer(index)}
              className={`w-full p-3 text-left rounded-md transition-colors ${
                selectedAnswer === index
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-800"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="mt-4 flex justify-between items-center">
          <div className="text-lg font-semibold text-gray-600">
            Time left: {timeLeft}s
          </div>
          <div className="text-lg font-semibold text-gray-600">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
        </div>
        <motion.div
          className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden"
          initial={{ width: "100%" }}
          animate={{ width: `${(timeLeft / 10) * 100}%` }}
          transition={{ duration: 1 }}
        >
          <div className="h-full bg-green-500"></div>
        </motion.div>
      </motion.div>
    </div>
  );
}
