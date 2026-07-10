import { useState } from 'react';
import type { TagId } from '../types';
import { TAGS } from '../data/tags';
import { QUESTIONS } from '../data/questions';
import { DEFAULT_QUIZ_SIZE } from '../lib/buildQuiz';

function countByTag(tag: TagId): number {
  return QUESTIONS.filter((question) => question.tag === tag).length;
}

interface Props {
  onStart: (tags: TagId[]) => void;
}

export function TagSelector({ onStart }: Props) {
  const [selected, setSelected] = useState<ReadonlySet<TagId>>(new Set());

  function toggle(tag: TagId) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  const total = [...selected].reduce((sum, tag) => sum + countByTag(tag), 0);

  return (
    <main className="tag-selector">
      <h1 className="tag-selector__title">배드민턴 심판 3급</h1>
      <p className="tag-selector__subtitle">
        공부할 영역을 고르세요. 최대 {DEFAULT_QUIZ_SIZE}문제를 무작위로 냅니다.
      </p>

      <ul className="tag-selector__list">
        {TAGS.map((tag) => (
          <li key={tag.id}>
            <label className="tag-selector__item">
              <input type="checkbox" checked={selected.has(tag.id)} onChange={() => toggle(tag.id)} />
              <span className="tag-selector__label">{tag.label}</span>
              <span className="tag-selector__count">{countByTag(tag.id)}문항</span>
              <span className="tag-selector__description">{tag.description}</span>
            </label>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="tag-selector__start"
        disabled={selected.size === 0}
        onClick={() => onStart([...selected])}
      >
        {selected.size === 0 ? '영역을 선택하세요' : `${Math.min(total, DEFAULT_QUIZ_SIZE)}문제 시작하기`}
      </button>
    </main>
  );
}
