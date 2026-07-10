import type { FillBlankQuestion } from '../../types';

interface Props {
  question: FillBlankQuestion;
  text: string;
  onChange: (text: string) => void;
  revealed: boolean;
}

export function FillBlankView({ question, text, onChange, revealed }: Props) {
  return (
    <div className="fill-view">
      <label className="fill-view__field">
        <span className="sr-only">정답 입력</span>
        <input
          type="text"
          className="fill-view__input"
          value={text}
          onChange={(event) => onChange(event.target.value)}
          placeholder="답을 입력하세요"
          autoComplete="off"
        />
        {question.unit && <span className="fill-view__unit">{question.unit}</span>}
      </label>
      {revealed && (
        <p className="fill-view__answer">
          정답: <strong>{question.answer}</strong>
          {question.unit}
        </p>
      )}
    </div>
  );
}
