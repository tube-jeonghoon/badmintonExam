import type { OXQuestion } from '../../types';

interface Props {
  question: OXQuestion;
  selected?: boolean;
  onSelect: (value: boolean) => void;
  revealed: boolean;
}

const OPTIONS: readonly { value: boolean; symbol: string }[] = [
  { value: true, symbol: 'O' },
  { value: false, symbol: 'X' },
];

export function OXView({ question, selected, onSelect, revealed }: Props) {
  return (
    <div className="ox-view">
      {OPTIONS.map(({ value, symbol }) => {
        const isSelected = selected === value;
        const isAnswer = revealed && question.answer === value;
        const className = [
          'ox-view__option',
          isSelected && 'ox-view__option--selected',
          isAnswer && 'ox-view__option--answer',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <button
            key={symbol}
            type="button"
            className={className}
            aria-pressed={isSelected}
            onClick={() => onSelect(value)}
          >
            {symbol}
          </button>
        );
      })}
    </div>
  );
}
