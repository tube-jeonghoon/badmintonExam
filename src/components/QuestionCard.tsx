import type { ChoiceIndex, Question, UserAnswer } from '../types';
import { AnswerPanel } from './AnswerPanel';
import { ChoiceView } from './questions/ChoiceView';
import { FillBlankView } from './questions/FillBlankView';
import { OXView } from './questions/OXView';
import { EssayView } from './questions/EssayView';
import { tagLabel } from '../data/tags';

interface Props {
  question: Question;
  userAnswer?: UserAnswer;
  onAnswer: (answer: UserAnswer) => void;
  revealed: boolean;
  onToggleReveal: () => void;
}

export function QuestionCard({ question, userAnswer, onAnswer, revealed, onToggleReveal }: Props) {
  function renderBody() {
    switch (question.type) {
      case 'choice':
        return (
          <ChoiceView
            question={question}
            selectedIndex={userAnswer?.type === 'choice' ? userAnswer.index : undefined}
            onSelect={(index: ChoiceIndex) => onAnswer({ type: 'choice', index })}
            revealed={revealed}
          />
        );
      case 'ox':
        return (
          <OXView
            question={question}
            selected={userAnswer?.type === 'ox' ? userAnswer.value : undefined}
            onSelect={(value: boolean) => onAnswer({ type: 'ox', value })}
            revealed={revealed}
          />
        );
      case 'fill':
        return (
          <FillBlankView
            question={question}
            text={userAnswer?.type === 'fill' ? userAnswer.text : ''}
            onChange={(text: string) => onAnswer({ type: 'fill', text })}
            revealed={revealed}
          />
        );
      case 'essay':
        return (
          <EssayView
            text={userAnswer?.type === 'essay' ? userAnswer.text : ''}
            onChange={(text: string) => onAnswer({ type: 'essay', text })}
          />
        );
    }
  }

  return (
    <article className="question-card">
      <p className="question-card__tag">{tagLabel(question.tag)}</p>
      <h2 className="question-card__prompt">{question.prompt}</h2>
      {renderBody()}
      <button type="button" className="question-card__toggle" aria-expanded={revealed} onClick={onToggleReveal}>
        {revealed ? '답·해설 접기 ▴' : '답·해설 보기 ▾'}
      </button>
      {revealed && <AnswerPanel question={question} />}
    </article>
  );
}
