import type { Question } from '../types';

const LABELS = ['①', '②', '③', '④'] as const;

function formatAnswer(question: Question): string {
  switch (question.type) {
    case 'choice':
      return `${LABELS[question.answerIndex]} ${question.choices[question.answerIndex]}`;
    case 'ox':
      return question.answer ? 'O' : 'X';
    case 'fill':
      return `${question.answer}${question.unit ?? ''}`;
  }
}

interface Props {
  question: Question;
}

export function AnswerPanel({ question }: Props) {
  return (
    <div className="answer-panel">
      <p className="answer-panel__answer">
        <span className="answer-panel__heading">정답</span>
        <strong>{formatAnswer(question)}</strong>
      </p>
      <p className="answer-panel__explanation">
        <span className="answer-panel__heading">해설</span>
        {question.explanation}
      </p>
    </div>
  );
}
