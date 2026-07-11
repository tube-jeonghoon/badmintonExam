# 난이도 필터와 서술형 문제 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 퀴즈 사이트에 옵셔널 난이도 필드, 서술형 문제 유형, "어려운 문제 포함" 출제 필터, 신규 30문항을 더한다.

**Architecture:** `difficulty`는 옵셔널 필드라 기존 100문항을 건드리지 않는다. 서술형은 판별 유니온의 새 멤버 `EssayQuestion`으로, 유형별 exhaustive switch가 처리 누락을 컴파일 단계에서 잡는다. `buildQuiz`는 `includeHard` 인자(기본 false)로 어려운 문제를 거른다 — 기본값 덕분에 각 태스크 커밋이 항상 컴파일된다. 서술형은 전부 `difficulty:'hard'`라 어려운 문제 필터를 켜야만 등장한다.

**Tech Stack:** Vite + React 19 + TypeScript + Vitest

**참조 스펙:** `docs/superpowers/specs/2026-07-11-difficulty-and-essay-design.md`

---

## 태스크 순서의 근거

`EssayQuestion`을 `Question` 유니온에 넣으면 `AnswerPanel`과 `QuestionCard`의 default 없는 switch가 비-exhaustive가 되어 타입 체크가 깨진다. 그래서 Task 2는 유니온 추가 + EssayView + QuestionCard + AnswerPanel + CSS를 한 커밋으로 묶어 컴파일을 유지한다. `buildQuiz`의 `includeHard`에 기본값 `false`를 줘서, App이 아직 인자를 안 넘겨도 Task 3 이후 컴파일이 유지된다.

## 파일 구조

| 파일 | 변경 | 책임 |
|---|---|---|
| `src/types.ts` | 수정 | `Difficulty`, `difficulty?`, `EssayQuestion`, `UserAnswer` essay 변형 |
| `src/components/questions/EssayView.tsx` | 생성 | 서술형 textarea |
| `src/components/QuestionCard.tsx` | 수정 | essay 디스패치 |
| `src/components/AnswerPanel.tsx` | 수정 | essay 모범답안·핵심 포인트 렌더 |
| `src/lib/buildQuiz.ts` | 수정 | `includeHard` 필터 |
| `src/lib/buildQuiz.test.ts` | 수정 | 시그니처 갱신 + 난이도 필터 테스트 |
| `src/components/TagSelector.tsx` | 수정 | "어려운 문제 포함" 체크박스, 난이도 반영 카운트 |
| `src/App.tsx` | 수정 | `includeHard` 전달 |
| `src/data/questions.test.ts` | 수정 | essay·difficulty 무결성 검사 |
| `src/data/questions.ts` | 수정 | 신규 30문항 |
| `src/index.css` | 수정 | essay·체크박스 스타일 |

---

## Task 1: 난이도 필드 추가

옵셔널 필드라 비파괴적. 기존 100문항 무수정.

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: `Difficulty` 타입과 `difficulty?` 필드 추가**

`src/types.ts`의 `BaseQuestion`을 수정하고 상단에 `Difficulty`를 추가한다.

기존:
```ts
export type ChoiceIndex = 0 | 1 | 2 | 3;

interface BaseQuestion {
  id: string;
  tag: TagId;
  prompt: string;
  explanation: string;
}
```

변경 후:
```ts
export type ChoiceIndex = 0 | 1 | 2 | 3;

export type Difficulty = 'basic' | 'hard';

interface BaseQuestion {
  id: string;
  tag: TagId;
  prompt: string;
  explanation: string;
  difficulty?: Difficulty; // 없으면 basic
}
```

- [ ] **Step 2: 타입 체크**

Run: `npm run typecheck`
Expected: 성공. 옵셔널 필드라 기존 코드에 영향 없음.

- [ ] **Step 3: 테스트가 여전히 통과하는지 확인**

Run: `npm test`
Expected: 기존 테스트 전부 통과(변화 없음).

- [ ] **Step 4: 커밋**

```bash
git add src/types.ts
git commit -m "feat: add optional difficulty field to questions"
```

---

## Task 2: 서술형 유형 end-to-end (데이터 없음)

유니온에 `EssayQuestion`을 넣는 순간 switch들이 깨지므로, 유형·뷰·디스패치·패널·CSS를 한 커밋으로 묶는다. 아직 서술형 데이터가 없으므로 화면엔 안 나오지만 코드 경로는 완성된다.

**Files:**
- Modify: `src/types.ts`
- Create: `src/components/questions/EssayView.tsx`
- Modify: `src/components/QuestionCard.tsx`
- Modify: `src/components/AnswerPanel.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: `EssayQuestion`과 `UserAnswer` essay 변형 추가**

`src/types.ts`에서 `FillBlankQuestion` 뒤, `Question` 정의 앞에 추가하고 유니온을 넓힌다.

기존:
```ts
export interface FillBlankQuestion extends BaseQuestion {
  type: 'fill';
  answer: string;
  unit?: string;
}

export type Question = ChoiceQuestion | OXQuestion | FillBlankQuestion;

export type UserAnswer =
  | { type: 'choice'; index: ChoiceIndex }
  | { type: 'ox'; value: boolean }
  | { type: 'fill'; text: string };
```

변경 후:
```ts
export interface FillBlankQuestion extends BaseQuestion {
  type: 'fill';
  answer: string;
  unit?: string;
}

export interface EssayQuestion extends BaseQuestion {
  type: 'essay';
  answer: string; // 모범답안
  keyPoints?: string[]; // 채점 핵심 포인트
}

export type Question = ChoiceQuestion | OXQuestion | FillBlankQuestion | EssayQuestion;

export type UserAnswer =
  | { type: 'choice'; index: ChoiceIndex }
  | { type: 'ox'; value: boolean }
  | { type: 'fill'; text: string }
  | { type: 'essay'; text: string };
```

- [ ] **Step 2: 이 시점에 타입 체크가 깨지는지 확인**

Run: `npm run typecheck`
Expected: FAIL — `AnswerPanel.tsx`의 `formatAnswer`가 `'essay'`를 처리하지 않아 `Function lacks ending return statement` (TS2366), `QuestionCard.tsx`의 `renderBody` switch도 essay 미처리. 이 실패는 다음 스텝에서 해소된다. (컴파일 실패가 이 유형이 유니온에 실제로 들어갔음을 증명한다.)

- [ ] **Step 3: `EssayView.tsx` 생성**

`src/components/questions/EssayView.tsx`:

```tsx
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
```

서술형은 채점하지 않으므로 문자열 비교가 없고, 모범답안은 `AnswerPanel`이 담당하므로 EssayView는 입력만 받는다. 문제 지문은 `QuestionCard`가 그리므로 `question`을 받지 않는다.

- [ ] **Step 4: `QuestionCard.tsx`에 essay 디스패치 추가**

import에 EssayView를 더하고 switch에 case를 추가한다.

기존 import 줄:
```tsx
import { OXView } from './questions/OXView';
```
뒤에 추가:
```tsx
import { EssayView } from './questions/EssayView';
```

`renderBody`의 `case 'fill':` 블록 뒤(닫는 `}` 앞)에 추가:
```tsx
      case 'essay':
        return (
          <EssayView
            text={userAnswer?.type === 'essay' ? userAnswer.text : ''}
            onChange={(text: string) => onAnswer({ type: 'essay', text })}
          />
        );
```

- [ ] **Step 5: `AnswerPanel.tsx`를 essay 대응으로 교체**

`src/components/AnswerPanel.tsx` 전체를 아래로 교체한다. `inlineAnswer`는 essay를 제외한 유니온만 받아 exhaustive를 유지한다. essay는 블록으로 모범답안 + 핵심 포인트를 그린다.

```tsx
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
```

- [ ] **Step 6: 타입 체크가 다시 통과하는지 확인**

Run: `npm run typecheck`
Expected: 성공. essay가 모든 switch에서 처리됨.

- [ ] **Step 7: `index.css`에 essay 스타일 추가**

`src/index.css`의 `/* --- FillBlankView --- */` 블록 바로 앞에 추가한다.

```css
/* --- EssayView --- */

.essay-view__field {
  display: block;
}

.essay-view__input {
  width: 100%;
  padding: 0.85rem 1rem;
  font: inherit;
  line-height: 1.6;
  resize: vertical;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.6rem;
}

.essay-view__input:focus {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}
```

`/* --- AnswerPanel --- */` 블록 안, `.answer-panel__explanation` 규칙 뒤에 추가한다.

```css
.answer-panel__model {
  margin: 0.2rem 0 0;
  white-space: pre-line;
}

.answer-panel__keypoints {
  margin: 0.6rem 0 0;
  padding-left: 1.2rem;
}

.answer-panel__keypoints li {
  margin-bottom: 0.25rem;
}
```

- [ ] **Step 8: 빌드와 테스트**

Run: `npm run typecheck && npm run build && npm test`
Expected: 전부 성공. 테스트 수는 그대로(서술형 데이터·테스트는 아직 없음).

- [ ] **Step 9: 커밋**

```bash
git add src/types.ts src/components/questions/EssayView.tsx src/components/QuestionCard.tsx src/components/AnswerPanel.tsx src/index.css
git commit -m "feat: add essay question type end-to-end

Adds EssayQuestion to the union, an EssayView textarea, QuestionCard
dispatch, and AnswerPanel model-answer/keypoints rendering. The
exhaustive switches now cover essay; no essay data exists yet."
```

---

## Task 3: buildQuiz 난이도 필터

**Files:**
- Modify: `src/lib/buildQuiz.ts`
- Modify: `src/lib/buildQuiz.test.ts`

- [ ] **Step 1: 테스트 파일을 새 시그니처로 교체**

`src/lib/buildQuiz.test.ts` 전체를 아래로 교체한다. 기존 호출이 `buildQuiz(POOL, tags, 20, alwaysZero)`였는데 이제 3번째 인자가 `includeHard`이므로 전부 갱신하고, 난이도 필터 테스트를 더한다.

```ts
import { describe, expect, it } from 'vitest';
import { buildQuiz } from './buildQuiz';
import type { Question, TagId } from '../types';

const alwaysZero = () => 0;

function makeQuestion(id: string, tag: TagId): Question {
  return { id, tag, type: 'ox', prompt: `prompt ${id}`, explanation: `why ${id}`, answer: true };
}

function makeHard(id: string, tag: TagId): Question {
  return {
    id,
    tag,
    type: 'ox',
    prompt: `prompt ${id}`,
    explanation: `why ${id}`,
    answer: true,
    difficulty: 'hard',
  };
}

const POOL: Question[] = [
  makeQuestion('r1', 'rules'),
  makeQuestion('r2', 'rules'),
  makeQuestion('r3', 'rules'),
  makeQuestion('f1', 'faults'),
  makeQuestion('f2', 'faults'),
  makeQuestion('e1', 'equipment'),
];

describe('buildQuiz', () => {
  it('returns only questions from the selected tags', () => {
    const result = buildQuiz(POOL, ['faults'], false, 20, alwaysZero);
    expect(result.map((q) => q.id).sort()).toEqual(['f1', 'f2']);
  });

  it('draws from every selected tag', () => {
    const result = buildQuiz(POOL, ['faults', 'equipment'], false, 20, alwaysZero);
    expect(result.map((q) => q.id).sort()).toEqual(['e1', 'f1', 'f2']);
  });

  it('caps the result at count', () => {
    const result = buildQuiz(POOL, ['rules'], false, 2, alwaysZero);
    expect(result).toHaveLength(2);
  });

  it('returns every available question when the pool is smaller than count', () => {
    const result = buildQuiz(POOL, ['rules'], false, 20, alwaysZero);
    expect(result).toHaveLength(3);
  });

  it('returns an empty array when no tags are selected', () => {
    expect(buildQuiz(POOL, [], false, 20, alwaysZero)).toEqual([]);
  });

  it('returns an empty array when the selected tag has no questions', () => {
    expect(buildQuiz(POOL, ['tournament'], false, 20, alwaysZero)).toEqual([]);
  });

  it('does not mutate the input pool', () => {
    const before = POOL.map((q) => q.id);
    buildQuiz(POOL, ['rules', 'faults'], false, 20, alwaysZero);
    expect(POOL.map((q) => q.id)).toEqual(before);
  });

  it('excludes hard questions when includeHard is false', () => {
    const pool = [makeQuestion('b1', 'rules'), makeHard('h1', 'rules')];
    const result = buildQuiz(pool, ['rules'], false, 20, alwaysZero);
    expect(result.map((q) => q.id)).toEqual(['b1']);
  });

  it('includes hard questions when includeHard is true', () => {
    const pool = [makeQuestion('b1', 'rules'), makeHard('h1', 'rules')];
    const result = buildQuiz(pool, ['rules'], true, 20, alwaysZero);
    expect(result.map((q) => q.id).sort()).toEqual(['b1', 'h1']);
  });

  it('treats a missing difficulty as basic', () => {
    const pool = [makeQuestion('b1', 'rules')];
    expect(buildQuiz(pool, ['rules'], false, 20, alwaysZero).map((q) => q.id)).toEqual(['b1']);
  });

  it('defaults includeHard to false when omitted', () => {
    const pool = [makeQuestion('b1', 'rules'), makeHard('h1', 'rules')];
    const result = buildQuiz(pool, ['rules']);
    expect(result.map((q) => q.id)).toEqual(['b1']);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npx vitest run src/lib/buildQuiz.test.ts`
Expected: FAIL — `includeHard`를 아직 안 받으므로 인자 위치가 어긋나 여러 케이스가 깨진다.

- [ ] **Step 3: buildQuiz 구현 수정**

`src/lib/buildQuiz.ts` 전체를 아래로 교체한다.

```ts
import type { Question, TagId } from '../types';
import { fisherYates } from './shuffle';

export const DEFAULT_QUIZ_SIZE = 20;

export function buildQuiz(
  all: readonly Question[],
  selectedTags: readonly TagId[],
  includeHard: boolean = false,
  count: number = DEFAULT_QUIZ_SIZE,
  rng: () => number = Math.random,
): Question[] {
  if (selectedTags.length === 0) return [];
  const selected = new Set(selectedTags);
  const pool = all.filter(
    (question) => selected.has(question.tag) && (includeHard || question.difficulty !== 'hard'),
  );
  return fisherYates(pool, rng).slice(0, count);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/lib/buildQuiz.test.ts`
Expected: PASS — 11개 테스트 전부.

- [ ] **Step 5: 전체 타입 체크 (App은 기본값 덕분에 아직 컴파일됨)**

Run: `npm run typecheck`
Expected: 성공. `App.tsx`의 `buildQuiz(QUESTIONS, tags)`는 `includeHard=false` 기본값으로 컴파일된다.

- [ ] **Step 6: 커밋**

```bash
git add src/lib/buildQuiz.ts src/lib/buildQuiz.test.ts
git commit -m "feat: add includeHard filter to buildQuiz

Hard questions are excluded unless includeHard is true. Default false
keeps existing callers compiling until App passes it explicitly."
```

---

## Task 4: TagSelector 체크박스와 App 연결

**Files:**
- Modify: `src/components/TagSelector.tsx`
- Modify: `src/App.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: `TagSelector.tsx` 전체 교체**

난이도 상태, 난이도 반영 카운트, "어려운 문제 포함" 체크박스, `onStart` 시그니처 확장.

```tsx
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
```

- [ ] **Step 2: `App.tsx`의 handleStart 갱신**

기존:
```tsx
  function handleStart(tags: TagId[]) {
    const questions = buildQuiz(QUESTIONS, tags);
    if (questions.length === 0) return;
    setQuizQuestions(questions);
  }
```

변경 후:
```tsx
  function handleStart(tags: TagId[], includeHard: boolean) {
    const questions = buildQuiz(QUESTIONS, tags, includeHard);
    if (questions.length === 0) return;
    setQuizQuestions(questions);
  }
```

- [ ] **Step 3: `index.css`에 체크박스 스타일 추가**

`/* --- TagSelector --- */` 영역 안, `.tag-selector__summary` 규칙 앞에 추가한다.

```css
.tag-selector__hard {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 0.4rem 0.6rem;
  margin-bottom: 1rem;
  padding: 0.85rem 1rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  cursor: pointer;
}

.tag-selector__hard input[type='checkbox'] {
  width: 1.2rem;
  height: 1.2rem;
  accent-color: var(--accent);
  cursor: pointer;
}

.tag-selector__hard:has(input:checked) {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.tag-selector__hard-label {
  font-weight: var(--fw-semibold);
}

.tag-selector__hard-hint {
  grid-column: 2 / -1;
  color: var(--muted);
  font-size: var(--fs-caption);
}
```

- [ ] **Step 4: 타입 체크·빌드·테스트**

Run: `npm run typecheck && npm run build && npm test`
Expected: 전부 성공. 21개 테스트 유지(데이터·무결성 추가는 Task 5~6).

- [ ] **Step 5: 브라우저로 확인**

Run: `npm run dev` (백그라운드), 출력된 로컬 URL 열기(base 경로 포함).

확인할 것:
1. 시작 화면에 "어려운 문제 포함" 체크박스가 영역 리스트 아래에 있다.
2. 체크가 꺼진 상태에서 각 영역은 "20문항"이다(어려운 문제 아직 없음 → Task 6 전이면 20 유지).
3. 체크를 켜도 아직 어려운 데이터가 없으면 카운트는 20 그대로다(정상 — Task 6에서 늘어난다).
4. 영역을 고르고 시작하면 기존처럼 문제가 나온다.

Ctrl+C로 서버를 멈춘다.

- [ ] **Step 6: 커밋**

```bash
git add src/components/TagSelector.tsx src/App.tsx src/index.css
git commit -m "feat: add 어려운 문제 포함 toggle to TagSelector

Threads includeHard through onStart to buildQuiz, and the per-tag
counts reflect the toggle."
```

---

## Task 5: 무결성 테스트 확장

서술형·난이도 검사를 더한다. 데이터가 없어도 vacuously 통과하므로 데이터 앞에 둔다.

**Files:**
- Modify: `src/data/questions.test.ts`

- [ ] **Step 1: 검사 추가**

`src/data/questions.test.ts`의 마지막 `it(...)` 뒤, `describe` 닫는 `});` 앞에 추가한다.

```ts
  it('only uses known difficulty values', () => {
    const bad = QUESTIONS.filter(
      (q) => q.difficulty !== undefined && q.difficulty !== 'basic' && q.difficulty !== 'hard',
    );
    expect(bad.map((q) => q.id)).toEqual([]);
  });

  it('gives every essay question a non-empty answer', () => {
    const broken = QUESTIONS.filter((q) => q.type === 'essay' && q.answer.trim() === '');
    expect(broken.map((q) => q.id)).toEqual([]);
  });

  it('gives every essay keyPoint non-empty text', () => {
    const broken = QUESTIONS.filter(
      (q) => q.type === 'essay' && (q.keyPoints ?? []).some((p) => p.trim() === ''),
    );
    expect(broken.map((q) => q.id)).toEqual([]);
  });

  it('marks every essay question as hard difficulty', () => {
    const broken = QUESTIONS.filter((q) => q.type === 'essay' && q.difficulty !== 'hard');
    expect(broken.map((q) => q.id)).toEqual([]);
  });
```

- [ ] **Step 2: 테스트 통과 확인**

Run: `npx vitest run src/data/questions.test.ts`
Expected: PASS — 새 4개 포함 전부 통과(서술형이 없어 vacuously true).

- [ ] **Step 3: 커밋**

```bash
git add src/data/questions.test.ts
git commit -m "test: add essay and difficulty integrity checks"
```

---

## Task 6: 신규 30문항

영역당 어려움 4 + 서술형 2. 영역마다 커밋하고, 커밋 전 무결성 테스트를 돌린다.

**Files:**
- Modify: `src/data/questions.ts`

**공통 규칙**
- 파일 끝 배열 닫는 `];` 앞에 이어 붙인다. 기존 100문항·주석·import 무수정.
- 어려움 비서술형 id: `<tag>-h1`~`<tag>-h4`, 전부 `difficulty: 'hard'`. 유형은 choice/ox/fill 섞어서(예: h1·h2 choice, h3 ox, h4 fill).
- 서술형 id: `<tag>-e1`, `<tag>-e2`, `type: 'essay'`, `difficulty: 'hard'`, `answer`(모범답안)와 `keyPoints`(핵심 3~5개).
- 어려움 문항은 규칙의 예외·경계·혼동 지점을 판다. 서술형은 "~을 설명하시오 / 절차를 서술하시오" 형태.
- 정확성: BWF Laws of Badminton 근거. **확실하지 않은 조항 번호는 쓰지 않고 주제만 표기.** 불확실하면 더 확실한 사실로 교체하고 보고.
- `answerIndex`는 0으로 몰지 말고 분산.

- [ ] **Step 1: `rules`(경기 규칙) 6문항 추가**

어려움 4(`rules-h1`~`h4`): 듀스·연장(29-29→30)에서의 서버/코트, 3게임제 코트 체인지의 세부 조건, 서비스 코트 판정의 예외, 리시버 준비 여부와 서비스 타이밍의 경계.
서술형 2(`rules-e1`, `e2`): "랠리 포인트 방식에서 득점과 서비스권의 관계를 설명하시오", "인터벌 규정(11점·게임 사이)의 시간과 적용을 서술하시오".

Run: `npx vitest run src/data/questions.test.ts` → PASS 확인 후
```bash
git add src/data/questions.ts && git commit -m "feat: add hard and essay questions for 경기 규칙"
```

- [ ] **Step 2: `refereeing`(심판 운영) 6문항 추가**

어려움 4(`refereeing-h1`~`h4`): 주심이 라인/서비스 저지 판정을 번복할 수 있는 조건, 수신호의 세부(인/아웃/미시야), 콜 문구의 정확한 상황, 라인 저지 부재 시 판정 위임.
서술형 2(`refereeing-e1`, `e2`): "경기 심판진의 구성과 각 심판의 역할을 설명하시오", "라인 저지의 세 가지 수신호(인·아웃·시야 미확보)와 그 의미를 서술하시오".

Run: `npx vitest run src/data/questions.test.ts` → PASS 확인 후
```bash
git add src/data/questions.ts && git commit -m "feat: add hard and essay questions for 심판 운영"
```

- [ ] **Step 3: `faults`(반칙과 벌칙) 6문항 추가**

어려움 4(`faults-h1`~`h4`): 렛과 폴트의 경계 사례, 오버 더 넷과 팔로스루 허용의 구분, 서비스 폴트의 세부(1.15m·발·타구 순서), 미스컨덕트 카드 절차의 주체.
서술형 2(`faults-e1`, `e2`): "렛(let)이 선언되는 상황과 그 처리를 설명하시오", "미스컨덕트에 대한 카드(경고·폴트·실격) 체계와 절차를 서술하시오".

Run: `npx vitest run src/data/questions.test.ts` → PASS 확인 후
```bash
git add src/data/questions.ts && git commit -m "feat: add hard and essay questions for 반칙과 벌칙"
```

- [ ] **Step 4: `equipment`(용어와 장비) 6문항 추가**

어려움 4(`equipment-h1`~`h4`): 단식/복식 롱 서비스 라인의 구분, 라인의 소속(인/아웃) 판정, 셔틀 규격의 세부(무게·깃털·속도 테스트), 코트 규격 간 혼동 지점.
서술형 2(`equipment-e1`, `e2`): "네트와 코트의 주요 규격(높이·길이·폭·라인)을 설명하시오", "셔틀콕의 규격과 속도 판정 방법을 서술하시오".

Run: `npx vitest run src/data/questions.test.ts` → PASS 확인 후
```bash
git add src/data/questions.ts && git commit -m "feat: add hard and essay questions for 용어와 장비"
```

- [ ] **Step 5: `tournament`(대회 운영) 6문항 추가**

어려움 4(`tournament-h1`~`h4`): 기권·실격·부전승의 구분, 토스 선택권의 세부, 경기 지연·중단의 판단 주체, 셔틀 교체 시점.
서술형 2(`tournament-e1`, `e2`): "토스의 절차와 승자·패자의 선택권을 설명하시오", "기권(리타이어)과 실격의 차이와 각각의 처리를 서술하시오".

Run: `npx vitest run src/data/questions.test.ts` → PASS 확인 후
```bash
git add src/data/questions.ts && git commit -m "feat: add hard and essay questions for 대회 운영"
```

- [ ] **Step 6: 전체 수량·테스트 확인**

Run: `npm test`
Expected: 전부 통과.

Run: `grep -c "id: '" src/data/questions.ts`
Expected: 130 (기존 100 + 신규 30).

Run: `grep -c "type: 'essay'" src/data/questions.ts`
Expected: 10 (5영역 × 2).

Run: `grep -c "difficulty: 'hard'" src/data/questions.ts`
Expected: 30 (영역당 6).

---

## Task 7: 전체 검증과 브라우저 확인

**Files:** 없음(확인만)

- [ ] **Step 1: 전체 게이트**

Run: `npm run typecheck && npm test && npm run build`
Expected: 세 단계 전부 성공.

- [ ] **Step 2: 브라우저에서 end-to-end 확인**

Run: `npm run dev` (백그라운드), 로컬 URL 열기.

확인할 것:
1. "어려운 문제 포함" 체크 시 각 영역 카운트가 20 → 26으로 는다.
2. 체크를 켜고 한 영역을 골라 시작하면, 여러 문제 중 서술형(textarea)이 섞여 나온다.
3. 서술형에서 자유롭게 입력하고 "답·해설 보기"를 누르면 모범답안 + 핵심 포인트 + 해설이 뜬다.
4. 체크를 끄고 시작하면 서술형이 나오지 않는다(기본 문제만).
5. 기존 세 유형(4지선다·OX·빈칸)도 여전히 정상.

Ctrl+C로 서버를 멈춘다.

---

## 완료 기준

- [ ] `npm run typecheck`, `npm test`, `npm run build` 모두 통과.
- [ ] 총 130문항, 서술형 10개, 어려움(difficulty:'hard') 30개.
- [ ] "어려운 문제 포함" 꺼짐이면 기본 문제만, 켜짐이면 어려움·서술형이 섞여 출제.
- [ ] 서술형은 입력 후 모범답안·핵심 포인트를 펼쳐 볼 수 있고 채점하지 않는다.
- [ ] 영역별 카운트가 난이도 토글을 반영.
