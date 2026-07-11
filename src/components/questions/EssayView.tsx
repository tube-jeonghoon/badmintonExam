interface Props {
  text: string;
  onChange: (text: string) => void;
}

export function EssayView({ text, onChange }: Props) {
  return (
    <div className="essay-view">
      <label className="essay-view__field">
        <span className="sr-only">서술형 답안 입력</span>
        <textarea
          className="essay-view__input"
          value={text}
          onChange={(event) => onChange(event.target.value)}
          rows={5}
          placeholder="답을 서술해 보세요"
        />
      </label>
    </div>
  );
}
