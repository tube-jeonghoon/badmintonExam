import type { Question } from '../types';

const LABELS = ['①', '②', '③', '④'] as const;

function inlineAnswer(question: Exclude<Question, { type: 'essay' }>): string {
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
      {question.type === 'essay' ? (
        <div className="answer-panel__answer">
          <span className="answer-panel__heading">모범답안</span>
          <p className="answer-panel__model">{question.answer}</p>
          {question.keyPoints && question.keyPoints.length > 0 && (
            <ul className="answer-panel__keypoints">
              {question.keyPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p className="answer-panel__answer">
          <span className="answer-panel__heading">정답</span>
          <strong>{inlineAnswer(question)}</strong>
        </p>
      )}
      <p className="answer-panel__explanation">
        <span className="answer-panel__heading">해설</span>
        {question.explanation}
      </p>
    </div>
  );
}
