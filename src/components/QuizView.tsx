import { useState } from 'react';
import type { Question, UserAnswer } from '../types';
import { QuestionCard } from './QuestionCard';

interface Props {
  questions: readonly Question[];
  onRestart: () => void;
}

export function QuizView({ questions, onRestart }: Props) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, UserAnswer>>({});
  const [revealed, setRevealed] = useState<ReadonlySet<string>>(new Set());

  const question = questions[index];
  const isFirst = index === 0;
  const isLast = index === questions.length - 1;

  function handleAnswer(answer: UserAnswer) {
    setAnswers((previous) => ({ ...previous, [question.id]: answer }));
  }

  function handleToggleReveal() {
    setRevealed((previous) => {
      const next = new Set(previous);
      if (next.has(question.id)) next.delete(question.id);
      else next.add(question.id);
      return next;
    });
  }

  return (
    <main className="quiz-view">
      <header className="quiz-view__header">
        <p className="quiz-view__progress">
          {index + 1} / {questions.length}
        </p>
        <button type="button" className="quiz-view__restart" onClick={onRestart}>
          새 문제 뽑기
        </button>
      </header>

      <QuestionCard
        key={question.id}
        question={question}
        userAnswer={answers[question.id]}
        onAnswer={handleAnswer}
        revealed={revealed.has(question.id)}
        onToggleReveal={handleToggleReveal}
      />

      <nav className="quiz-view__nav">
        <button type="button" disabled={isFirst} onClick={() => setIndex((i) => i - 1)}>
          ← 이전
        </button>
        <button type="button" disabled={isLast} onClick={() => setIndex((i) => i + 1)}>
          다음 →
        </button>
      </nav>
    </main>
  );
}
