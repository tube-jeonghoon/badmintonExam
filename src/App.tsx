import { useState } from 'react';
import type { Question, TagId } from './types';
import { QUESTIONS } from './data/questions';
import { buildQuiz } from './lib/buildQuiz';
import { QuizView } from './components/QuizView';
import { TagSelector } from './components/TagSelector';

export function App() {
  const [quizQuestions, setQuizQuestions] = useState<Question[] | null>(null);

  function handleStart(tags: TagId[]) {
    const questions = buildQuiz(QUESTIONS, tags);
    if (questions.length === 0) return;
    setQuizQuestions(questions);
  }

  if (quizQuestions === null) {
    return <TagSelector onStart={handleStart} />;
  }

  return <QuizView questions={quizQuestions} onRestart={() => setQuizQuestions(null)} />;
}
