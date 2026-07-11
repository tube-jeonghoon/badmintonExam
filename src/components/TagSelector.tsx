import { useState } from 'react';
import type { TagId } from '../types';
import { TAGS } from '../data/tags';
import { QUESTIONS } from '../data/questions';
import { DEFAULT_QUIZ_SIZE } from '../lib/buildQuiz';

function countByTag(tag: TagId, includeHard: boolean): number {
  return QUESTIONS.filter(
    (question) => question.tag === tag && (includeHard || question.difficulty !== 'hard'),
  ).length;
}

interface Props {
  onStart: (tags: TagId[], includeHard: boolean) => void;
}

export function TagSelector({ onStart }: Props) {
  const [selected, setSelected] = useState<ReadonlySet<TagId>>(new Set());
  const [includeHard, setIncludeHard] = useState(false);

  function toggle(tag: TagId) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  const allSelected = selected.size === TAGS.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(TAGS.map((tag) => tag.id)));
  }

  const total = [...selected].reduce((sum, tag) => sum + countByTag(tag, includeHard), 0);
  const drawCount = Math.min(total, DEFAULT_QUIZ_SIZE);

  return (
    <main className="tag-selector">
      <h1 className="tag-selector__title">배드민턴 심판 3급</h1>
      <p className="tag-selector__subtitle">
        여러 영역을 함께 고를 수 있어요. 최대 {DEFAULT_QUIZ_SIZE}문제를 무작위로 냅니다.
      </p>

      <div className="tag-selector__listhead">
        <span className="tag-selector__listhead-label">영역 · 복수 선택</span>
        <button type="button" className="tag-selector__selectall" onClick={toggleAll}>
          {allSelected ? '전체 해제' : '전체 선택'}
        </button>
      </div>

      <ul className="tag-selector__list">
        {TAGS.map((tag) => (
          <li key={tag.id}>
            <label className="tag-selector__item">
              <input type="checkbox" checked={selected.has(tag.id)} onChange={() => toggle(tag.id)} />
              <span className="tag-selector__label">{tag.label}</span>
              <span className="tag-selector__count">{countByTag(tag.id, includeHard)}문항</span>
              <span className="tag-selector__description">{tag.description}</span>
            </label>
          </li>
        ))}
      </ul>

      <label className="tag-selector__hard">
        <input
          type="checkbox"
          checked={includeHard}
          onChange={() => setIncludeHard((previous) => !previous)}
        />
        <span className="tag-selector__hard-label">어려운 문제 포함</span>
        <span className="tag-selector__hard-hint">규칙의 예외·경계 사례와 서술형이 섞여 나옵니다</span>
      </label>

      <p
        className={
          selected.size === 0
            ? 'tag-selector__summary tag-selector__summary--empty'
            : 'tag-selector__summary'
        }
        aria-live="polite"
      >
        {selected.size === 0
          ? '고른 영역이 여기에 합쳐져요'
          : `${selected.size}개 영역 선택 · ${drawCount}문제 출제`}
      </p>

      <button
        type="button"
        className="tag-selector__start"
        disabled={selected.size === 0}
        onClick={() => onStart([...selected], includeHard)}
      >
        {selected.size === 0 ? '영역을 선택하세요' : `${drawCount}문제 시작하기`}
      </button>
    </main>
  );
}
