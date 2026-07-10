import type { ChoiceIndex, ChoiceQuestion } from '../../types';

const LABELS = ['①', '②', '③', '④'] as const;

interface Props {
  question: ChoiceQuestion;
  selectedIndex?: ChoiceIndex;
  onSelect: (index: ChoiceIndex) => void;
  revealed: boolean;
}

export function ChoiceView({ question, selectedIndex, onSelect, revealed }: Props) {
  return (
    <ul className="choice-view">
      {question.choices.map((choice, i) => {
        const index = i as ChoiceIndex;
        const isSelected = selectedIndex === index;
        const isAnswer = revealed && question.answerIndex === index;
        const className = [
          'choice-view__option',
          isSelected && 'choice-view__option--selected',
          isAnswer && 'choice-view__option--answer',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <li key={index}>
            <button type="button" className={className} aria-pressed={isSelected} onClick={() => onSelect(index)}>
              <span className="choice-view__label">{LABELS[index]}</span>
              <span className="choice-view__text">{choice}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
