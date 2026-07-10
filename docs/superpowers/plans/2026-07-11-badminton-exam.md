# 배드민턴 심판 3급 문제 출제 사이트 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 배드민턴 심판 3급 준비생이 영역을 골라 무작위 문제를 풀고 정답과 해설을 토글로 확인하는 정적 사이트를 만들어 GitHub Pages에 배포한다.

**Architecture:** 서버도 라우터도 없는 단일 페이지 React 앱. `App`이 `phase`(setup | quiz) 하나로 화면을 전환하고, 문제 배열은 시작 시 한 번만 무작위로 확정된다. 문제는 `type` 필드로 갈리는 판별 유니온이라 유형별 렌더러가 서로를 모른 채 독립적으로 산다. 무작위성과 출제 로직은 React를 모르는 순수함수로 분리해 단독 테스트한다.

**Tech Stack:** Vite 7, React 19, TypeScript 5.9, Vitest 3, plain CSS, GitHub Actions → GitHub Pages

**참조 스펙:** `docs/superpowers/specs/2026-07-11-badminton-exam-design.md`

---

## 스펙과의 의도적 차이

구현 중 스펙과 어긋나는 두 곳이 있다. 둘 다 스펙이 틀린 것이 아니라 코드로 내려오면서 드러난 제약이다.

1. **컴포넌트 이름.** 스펙은 `components/questions/ChoiceQuestion.tsx`라고 썼으나, 그 이름은 `types.ts`의 `ChoiceQuestion` 타입과 충돌한다. 컴포넌트는 `ChoiceView`, `OXView`, `FillBlankView`로 짓고 파일명도 맞춘다.

2. **`fisherYates`의 시그니처.** 난수 생성기를 두 번째 인자로 주입받는다 (`rng: () => number = Math.random`). 그래야 테스트에서 고정 난수를 넣어 결과를 정확히 단언할 수 있다. 호출부는 인자를 생략하므로 실제 동작은 스펙 그대로다.

---

## 파일 구조

| 파일 | 책임 |
|---|---|
| `src/types.ts` | `Question` / `UserAnswer` 판별 유니온. 런타임 코드 없음 |
| `src/data/tags.ts` | 다섯 영역의 id와 한글 라벨 |
| `src/data/questions.ts` | 70문항 안팎의 목업 데이터 |
| `src/data/questions.test.ts` | 데이터 무결성 검증 |
| `src/lib/shuffle.ts` | Fisher-Yates. 순수함수 |
| `src/lib/buildQuiz.ts` | 태그 필터 + 셔플 + 개수 제한. 순수함수 |
| `src/components/questions/ChoiceView.tsx` | 4지선다 렌더링 |
| `src/components/questions/OXView.tsx` | OX 렌더링 |
| `src/components/questions/FillBlankView.tsx` | 빈칸 렌더링 |
| `src/components/AnswerPanel.tsx` | 정답 + 해설 (펼쳤을 때만) |
| `src/components/QuestionCard.tsx` | 유형 디스패치 + 토글 버튼 |
| `src/components/QuizView.tsx` | 진행률, 이전/다음, 세션 상태 |
| `src/components/TagSelector.tsx` | 영역 체크박스 + 시작 |
| `src/App.tsx` | phase 전환 |
| `src/index.css` | 전체 스타일 |
| `.github/workflows/deploy.yml` | 타입체크 → 테스트 → 빌드 → 배포 |

---

## Task 1: 프로젝트 스캐폴딩

Vite CLI는 비어있지 않은 디렉터리(`.git`, `docs/`가 이미 있다)에서 대화형 프롬프트를 띄운다. 프롬프트에 막히지 않도록 설정 파일을 직접 만든다.

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `.gitignore`
- Create: `src/main.tsx`, `src/App.tsx`, `src/index.css`

- [ ] **Step 1: `.gitignore` 작성**

```
node_modules
dist
*.local
.DS_Store
```

- [ ] **Step 2: `package.json` 작성**

```json
{
  "name": "badminton-exam",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "^5.9.0",
    "vite": "^7.0.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 3: `tsconfig.json` 작성**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: `tsconfig.node.json` 작성**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noEmit": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: `vite.config.ts` 작성**

`base`는 GitHub Pages가 저장소 이름을 하위 경로로 붙이기 때문에 반드시 필요하다. 빠뜨리면 JS/CSS가 404가 나서 흰 화면만 뜬다.

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/badmintonExam/',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 6: `index.html` 작성**

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>배드민턴 심판 3급 문제 풀이</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: `src/index.css` 최소 버전 작성**

Task 11에서 본격적으로 채운다. 지금은 빌드가 돌아가기만 하면 된다.

```css
:root {
  font-family: system-ui, -apple-system, 'Apple SD Gothic Neo', sans-serif;
  line-height: 1.6;
}

body {
  margin: 0;
}
```

- [ ] **Step 8: `src/main.tsx` 작성**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('#root element not found');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 9: `src/App.tsx` 임시 버전 작성**

Task 10에서 실제 내용으로 교체한다.

```tsx
export function App() {
  return <h1>배드민턴 심판 3급</h1>;
}
```

- [ ] **Step 10: 의존성 설치**

Run: `npm install`
Expected: `node_modules`와 `package-lock.json` 생성. 에러 없음.

- [ ] **Step 11: 타입 체크와 빌드가 도는지 확인**

Run: `npm run typecheck && npm run build`
Expected: 둘 다 성공. `dist/` 디렉터리 생성. `dist/index.html` 안의 스크립트 경로가 `/badmintonExam/assets/...`로 시작하는지 눈으로 확인한다.

- [ ] **Step 12: Vitest가 도는지 확인**

Run: `npm test`
Expected: `No test files found` 메시지와 함께 종료. 이 시점엔 테스트가 없는 게 정상이다. 크래시가 아니라 이 메시지가 나오는지 본다.

- [ ] **Step 13: 커밋**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TS project

Config written by hand rather than via create-vite, which prompts
interactively when the directory already contains .git and docs/.

Vite base is set to /badmintonExam/ for GitHub Pages subpath hosting."
```

---

## Task 2: 타입과 태그 정의

**Files:**
- Create: `src/types.ts`
- Create: `src/data/tags.ts`

- [ ] **Step 1: `src/types.ts` 작성**

`Question`은 `type` 필드로 갈리는 판별 유니온이다. 이 덕분에 OX 문제에 `choices`를 실수로 넣으면 컴파일이 막힌다. 70문항을 손으로 쓰는 이 프로젝트에서 이게 가장 큰 안전장치다.

```ts
export type TagId = 'rules' | 'refereeing' | 'faults' | 'equipment' | 'tournament';

export type ChoiceIndex = 0 | 1 | 2 | 3;

interface BaseQuestion {
  id: string;
  tag: TagId;
  prompt: string;
  explanation: string;
}

export interface ChoiceQuestion extends BaseQuestion {
  type: 'choice';
  choices: [string, string, string, string];
  answerIndex: ChoiceIndex;
}

export interface OXQuestion extends BaseQuestion {
  type: 'ox';
  answer: boolean;
}

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

- [ ] **Step 2: `src/data/tags.ts` 작성**

```ts
import type { TagId } from '../types';

export interface Tag {
  id: TagId;
  label: string;
  description: string;
}

export const TAGS: readonly Tag[] = [
  { id: 'rules', label: '경기 규칙', description: '서비스 코트, 득점, 코트 체인지, 인터벌' },
  { id: 'refereeing', label: '심판 운영', description: '심판 구성, 콜과 수신호, 진행 문구' },
  { id: 'faults', label: '반칙과 벌칙', description: '서비스 폴트, 렛, 미스컨덕트 카드' },
  { id: 'equipment', label: '용어와 장비', description: '셔틀콕, 라켓, 네트와 코트 규격' },
  { id: 'tournament', label: '대회 운영', description: '토스, 기권과 실격, 기록지' },
] as const;

export const TAG_IDS: readonly TagId[] = TAGS.map((tag) => tag.id);

export function tagLabel(id: TagId): string {
  const tag = TAGS.find((candidate) => candidate.id === id);
  if (!tag) throw new Error(`Unknown tag id: ${id}`);
  return tag.label;
}
```

- [ ] **Step 3: 타입 체크**

Run: `npm run typecheck`
Expected: 성공. 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add src/types.ts src/data/tags.ts
git commit -m "feat: define Question discriminated union and tag metadata"
```

---

## Task 3: `shuffle.ts` — Fisher-Yates

난수를 주입받게 만드는 이유는 테스트 때문이다. `rng`가 항상 `0`을 반환하면 셔플 결과가 하나로 정해지므로 정확히 단언할 수 있다.

**Files:**
- Create: `src/lib/shuffle.ts`
- Test: `src/lib/shuffle.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`rng: () => 0`일 때 `['a','b','c']`가 어떻게 되는지 손으로 따라가 보자. 루프는 `i = 2`부터 내려온다. `i=2`: `j = floor(0 * 3) = 0` → `a`와 `c`를 교환 → `['c','b','a']`. `i=1`: `j = floor(0 * 2) = 0` → `c`와 `b`를 교환 → `['b','c','a']`. 그래서 결과는 `['b','c','a']`이다.

`src/lib/shuffle.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { fisherYates } from './shuffle';

const alwaysZero = () => 0;

describe('fisherYates', () => {
  it('produces a deterministic result for a fixed rng', () => {
    expect(fisherYates(['a', 'b', 'c'], alwaysZero)).toEqual(['b', 'c', 'a']);
  });

  it('preserves every element exactly once', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const shuffled = fisherYates(input, () => 0.42);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(input);
  });

  it('does not mutate the input array', () => {
    const input = ['a', 'b', 'c'];
    fisherYates(input, alwaysZero);
    expect(input).toEqual(['a', 'b', 'c']);
  });

  it('returns an empty array unchanged', () => {
    expect(fisherYates([], alwaysZero)).toEqual([]);
  });

  it('returns a single-element array unchanged', () => {
    expect(fisherYates(['only'], alwaysZero)).toEqual(['only']);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npx vitest run src/lib/shuffle.test.ts`
Expected: FAIL — `Failed to resolve import "./shuffle"` 또는 그에 준하는 모듈 없음 에러.

- [ ] **Step 3: 최소 구현 작성**

`src/lib/shuffle.ts`:

```ts
export function fisherYates<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인**

Run: `npx vitest run src/lib/shuffle.test.ts`
Expected: PASS — 5개 테스트 전부 통과.

- [ ] **Step 5: 커밋**

```bash
git add src/lib/shuffle.ts src/lib/shuffle.test.ts
git commit -m "feat: add fisherYates shuffle with injectable rng

The rng parameter exists so tests can assert exact output. Callers
in app code omit it and get Math.random."
```

---

## Task 4: `buildQuiz.ts` — 출제 로직

**Files:**
- Create: `src/lib/buildQuiz.ts`
- Test: `src/lib/buildQuiz.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

테스트는 `data/questions.ts`의 실제 데이터에 의존하면 안 된다. 문제를 하나 추가할 때마다 테스트가 깨지기 때문이다. 테스트 전용 픽스처를 만든다.

`src/lib/buildQuiz.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildQuiz } from './buildQuiz';
import type { Question, TagId } from '../types';

const alwaysZero = () => 0;

function makeQuestion(id: string, tag: TagId): Question {
  return { id, tag, type: 'ox', prompt: `prompt ${id}`, explanation: `why ${id}`, answer: true };
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
    const result = buildQuiz(POOL, ['faults'], 20, alwaysZero);
    expect(result.map((q) => q.id).sort()).toEqual(['f1', 'f2']);
  });

  it('draws from every selected tag', () => {
    const result = buildQuiz(POOL, ['faults', 'equipment'], 20, alwaysZero);
    expect(result.map((q) => q.id).sort()).toEqual(['e1', 'f1', 'f2']);
  });

  it('caps the result at count', () => {
    const result = buildQuiz(POOL, ['rules'], 2, alwaysZero);
    expect(result).toHaveLength(2);
  });

  it('returns every available question when the pool is smaller than count', () => {
    const result = buildQuiz(POOL, ['rules'], 20, alwaysZero);
    expect(result).toHaveLength(3);
  });

  it('returns an empty array when no tags are selected', () => {
    expect(buildQuiz(POOL, [], 20, alwaysZero)).toEqual([]);
  });

  it('returns an empty array when the selected tag has no questions', () => {
    expect(buildQuiz(POOL, ['tournament'], 20, alwaysZero)).toEqual([]);
  });

  it('does not mutate the input pool', () => {
    const before = POOL.map((q) => q.id);
    buildQuiz(POOL, ['rules', 'faults'], 20, alwaysZero);
    expect(POOL.map((q) => q.id)).toEqual(before);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npx vitest run src/lib/buildQuiz.test.ts`
Expected: FAIL — `./buildQuiz` 모듈을 찾을 수 없음.

- [ ] **Step 3: 최소 구현 작성**

`src/lib/buildQuiz.ts`:

```ts
import type { Question, TagId } from '../types';
import { fisherYates } from './shuffle';

export const DEFAULT_QUIZ_SIZE = 20;

export function buildQuiz(
  all: readonly Question[],
  selectedTags: readonly TagId[],
  count: number = DEFAULT_QUIZ_SIZE,
  rng: () => number = Math.random,
): Question[] {
  if (selectedTags.length === 0) return [];
  const selected = new Set(selectedTags);
  const pool = all.filter((question) => selected.has(question.tag));
  return fisherYates(pool, rng).slice(0, count);
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인**

Run: `npx vitest run src/lib/buildQuiz.test.ts`
Expected: PASS — 7개 테스트 전부 통과.

- [ ] **Step 5: 커밋**

```bash
git add src/lib/buildQuiz.ts src/lib/buildQuiz.test.ts
git commit -m "feat: add buildQuiz — tag filter, shuffle, cap at count"
```

---

## Task 5: 데이터 무결성 테스트와 첫 영역 문항

먼저 무결성 테스트를 쓰고, 그 다음 문항을 채운다. 70문항을 손으로 쓰면 반드시 오타가 나므로 그물을 먼저 친다.

**Files:**
- Create: `src/data/questions.ts`
- Test: `src/data/questions.test.ts`

- [ ] **Step 1: 무결성 테스트 작성**

`src/data/questions.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { QUESTIONS } from './questions';
import { TAG_IDS } from './tags';

describe('QUESTIONS data integrity', () => {
  it('has no duplicate ids', () => {
    const ids = QUESTIONS.map((q) => q.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    expect(duplicates).toEqual([]);
  });

  it('only uses tags declared in tags.ts', () => {
    const unknown = QUESTIONS.filter((q) => !TAG_IDS.includes(q.tag));
    expect(unknown.map((q) => q.id)).toEqual([]);
  });

  it('gives every question a non-empty prompt', () => {
    const blank = QUESTIONS.filter((q) => q.prompt.trim() === '');
    expect(blank.map((q) => q.id)).toEqual([]);
  });

  it('gives every question a non-empty explanation', () => {
    const blank = QUESTIONS.filter((q) => q.explanation.trim() === '');
    expect(blank.map((q) => q.id)).toEqual([]);
  });

  it('keeps every answerIndex within the choices array', () => {
    const broken = QUESTIONS.filter(
      (q) => q.type === 'choice' && (q.answerIndex < 0 || q.answerIndex >= q.choices.length),
    );
    expect(broken.map((q) => q.id)).toEqual([]);
  });

  it('gives every choice question four non-empty, distinct options', () => {
    const broken = QUESTIONS.filter((q) => {
      if (q.type !== 'choice') return false;
      const trimmed = q.choices.map((c) => c.trim());
      return trimmed.length !== 4 || trimmed.some((c) => c === '') || new Set(trimmed).size !== 4;
    });
    expect(broken.map((q) => q.id)).toEqual([]);
  });

  it('gives every fill question a non-empty answer', () => {
    const broken = QUESTIONS.filter((q) => q.type === 'fill' && q.answer.trim() === '');
    expect(broken.map((q) => q.id)).toEqual([]);
  });

  it('has at least one question per tag', () => {
    const empty = TAG_IDS.filter((tag) => !QUESTIONS.some((q) => q.tag === tag));
    expect(empty).toEqual([]);
  });

  it('prefixes every id with its own tag', () => {
    const mismatched = QUESTIONS.filter((q) => !q.id.startsWith(`${q.tag}-`));
    expect(mismatched.map((q) => q.id)).toEqual([]);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npx vitest run src/data/questions.test.ts`
Expected: FAIL — `./questions` 모듈을 찾을 수 없음.

- [ ] **Step 3: `경기 규칙` 영역 문항 작성**

`src/data/questions.ts`를 만든다. 이 태스크에서는 `rules` 태그 14문항만 쓴다. 나머지 영역은 Task 6에서 이어 붙인다.

id는 `rules-01` 부터 `rules-14` 까지. 유형은 4지선다 7개, OX 4개, 빈칸 3개로 섞는다. 수치와 규격은 빈칸으로, 규칙의 참·거짓은 OX로, 판정과 절차는 4지선다로 낸다.

`explanation`에는 반드시 근거를 적는다. 예: `"BWF 경기규칙 9.1.1 — ..."`. 근거 조항 번호가 확실하지 않으면 `"BWF 경기규칙 — 서비스"`처럼 조항 번호 없이 항목만 적는다. **추측한 조항 번호를 지어내지 않는다.**

파일 첫 줄에 이 데이터의 성격을 명시하는 주석을 단다:

```ts
// 학습용 초안. BWF Laws of Badminton을 근거로 작성했으나 대한배드민턴협회
// 심판 3급 교재의 표현·범위와 다를 수 있다. 교재와 대조해 수정할 것.
import type { Question } from '../types';

export const QUESTIONS: readonly Question[] = [
  {
    id: 'rules-01',
    tag: 'rules',
    type: 'choice',
    prompt: '단식 경기에서 서버의 점수가 짝수일 때, 서비스를 넣는 코트는?',
    choices: ['오른쪽 서비스 코트', '왼쪽 서비스 코트', '어느 쪽이든 무관', '주심이 지정한 코트'],
    answerIndex: 0,
    explanation:
      'BWF 경기규칙 5.1 — 단식에서 서버의 점수가 0 또는 짝수이면 양 선수는 오른쪽 서비스 코트에서 서브하고 받는다. 홀수이면 왼쪽 서비스 코트를 쓴다.',
  },
  {
    id: 'rules-02',
    tag: 'rules',
    type: 'ox',
    prompt: '한 게임은 21점을 먼저 얻은 편이 이기며, 20-20이 되면 2점을 연속으로 앞선 편이 이긴다.',
    answer: true,
    explanation:
      'BWF 경기규칙 7.1~7.2 — 21점 선취로 게임을 얻되, 20-20에서는 2점 차가 나야 한다. 다만 29-29에서는 30점째를 얻은 편이 이긴다.',
  },
  {
    id: 'rules-03',
    tag: 'rules',
    type: 'fill',
    prompt: '한 게임에서 어느 한 편이 __점에 도달하면 60초의 인터벌이 주어진다.',
    answer: '11',
    unit: '점',
    explanation:
      'BWF 경기규칙 16.2 — 한 편이 11점에 도달하면 60초를 넘지 않는 인터벌이 주어진다. 게임 사이의 인터벌은 120초다.',
  },
  // ... rules-04 부터 rules-14 까지 같은 형식으로 이어 쓴다.
];
```

나머지 11문항은 아래 주제를 하나씩 다룬다. 괄호 안은 사용할 유형이다.

4. 29-29에서의 승리 조건 (choice)
5. 게임 사이 인터벌 시간 (fill, 120초)
6. 3게임제에서 세 번째 게임 시작 시 코트 체인지 조건 (choice, 한 편이 11점 도달)
7. 매 게임 종료 후 코트를 바꾼다 (ox, 참)
8. 랠리에서 이긴 편이 다음 서브를 넣고 1점을 얻는다 (ox, 참)
9. 복식에서 서브를 넣는 순서가 바뀌는 조건 (choice)
10. 복식에서 서브권을 얻었을 때 서버가 되는 사람 (choice)
11. 복식 리시버는 서버의 대각선 코트에 선 사람이다 (ox, 참)
12. 경기는 3게임 중 2게임을 먼저 이긴 편이 승리한다 (ox, 참)
13. 서비스 시 셔틀을 치는 순간 셔틀 전체가 있어야 하는 높이 기준 (fill, 1.15, 단위 m)
14. 첫 서브를 넣는 편을 정하는 방법 (choice, 토스)

- [ ] **Step 4: 무결성 테스트가 통과하는지 확인**

Run: `npx vitest run src/data/questions.test.ts`
Expected: PASS — 9개 테스트 전부 통과.

- [ ] **Step 5: 타입 체크**

Run: `npm run typecheck`
Expected: 성공. 판별 유니온이 잘못된 조합(예: OX 문제에 `choices`)을 잡아냈다면 여기서 에러가 난다.

- [ ] **Step 6: 커밋**

```bash
git add src/data/questions.ts src/data/questions.test.ts
git commit -m "feat: add data integrity tests and 경기 규칙 questions

The integrity suite runs before deploy, so a typo in the hand-written
question data blocks the release rather than shipping."
```

---

## Task 6: 나머지 네 영역 문항

**Files:**
- Modify: `src/data/questions.ts`

각 영역마다 Step을 나눠 하나씩 채우고, 영역 하나가 끝날 때마다 테스트를 돌리고 커밋한다. 70문항을 한 번에 쓰고 한 번에 커밋하면, 무결성 테스트가 깨졌을 때 어디서 깨졌는지 찾기 어렵다.

모든 영역에서 유형 비율은 대략 4지선다 절반, OX 3분의 1, 빈칸 나머지로 맞춘다. `explanation`의 근거 표기 규칙은 Task 5와 같다 — **조항 번호를 추측해서 지어내지 않는다.**

- [ ] **Step 1: `refereeing` (심판 운영) 14문항 추가**

id는 `refereeing-01` ~ `refereeing-14`. 주제:

1. 경기에 배치되는 심판의 종류 (choice: 주심, 서비스 저지, 라인 저지)
2. 주심의 권한 범위 (choice)
3. 셔틀이 인/아웃인지 판정하는 심판 (choice: 라인 저지)
4. 서비스 폴트를 판정하는 심판 (choice: 서비스 저지)
5. 라인 저지의 아웃 수신호 (choice: 양팔을 수평으로 벌린다)
6. 라인 저지의 인 수신호 (choice: 오른손으로 라인을 가리킨다)
7. 라인 저지가 셔틀을 보지 못했을 때의 수신호 (choice: 양손으로 눈을 가린다)
8. 주심은 서비스 저지의 판정을 번복할 수 있다 (ox)
9. 경기 시작을 알리는 주심의 콜 (fill: '러브 올, 플레이')
10. 점수를 부를 때 서버의 점수를 먼저 부른다 (ox, 참)
11. 게임 종료를 알리는 콜 (choice)
12. 매치 종료 시의 콜 (fill: '매치')
13. 인터벌 종료를 알리는 콜 (choice: '플레이')
14. 라인 저지가 없을 때 인/아웃 판정 주체 (choice: 주심)

Run: `npx vitest run src/data/questions.test.ts` → PASS 확인 후
```bash
git add src/data/questions.ts
git commit -m "feat: add 심판 운영 questions"
```

- [ ] **Step 2: `faults` (반칙과 벌칙) 14문항 추가**

id는 `faults-01` ~ `faults-14`. 주제:

1. 서비스 폴트가 되는 경우 (choice: 라켓 헤드가 그립보다 위)
2. 서비스 시 셔틀의 베이스가 아닌 깃털을 먼저 치면 폴트다 (ox, 참)
3. 서브를 넣기 전 발이 라인을 밟으면 폴트다 (ox, 참)
4. 랠리 중 셔틀이 네트에 걸렸을 때의 처리 (choice)
5. '렛'이 선언되는 경우 (choice)
6. 렛이 선언되면 그 랠리의 서브를 다시 넣는다 (ox, 참)
7. 셔틀이 몸이나 옷에 닿으면 폴트다 (ox, 참)
8. 라켓이나 몸이 네트에 닿으면 폴트다 (ox, 참)
9. 상대 코트 쪽으로 라켓을 넘겨 치는 행위의 판정 (choice: 오버 더 넷)
10. 같은 편이 셔틀을 연달아 두 번 치면 폴트다 (ox, 참)
11. 경고를 나타내는 카드의 색 (fill: 노란색)
12. 폴트(벌칙)를 나타내는 카드의 색 (fill: 빨간색)
13. 실격을 나타내는 카드의 색 (fill: 검은색)
14. 미스컨덕트로 실격을 선언할 수 있는 사람 (choice: 레프리)

Run: `npx vitest run src/data/questions.test.ts` → PASS 확인 후
```bash
git add src/data/questions.ts
git commit -m "feat: add 반칙과 벌칙 questions"
```

- [ ] **Step 3: `equipment` (용어와 장비) 14문항 추가**

id는 `equipment-01` ~ `equipment-14`. 주제:

1. 네트 중앙의 높이 (fill: 1.524, 단위 m)
2. 네트 양 기둥 쪽의 높이 (fill: 1.55, 단위 m)
3. 복식 코트의 폭 (fill: 6.1, 단위 m)
4. 단식 코트의 폭 (fill: 5.18, 단위 m)
5. 코트의 전체 길이 (fill: 13.4, 단위 m)
6. 셔틀콕의 깃털 개수 (fill: 16, 단위 개)
7. 셔틀콕의 무게 범위 (choice: 4.74~5.50g)
8. 라켓 전체 길이의 상한 (choice: 680mm)
9. 라켓 전체 폭의 상한 (choice: 230mm)
10. 단식에서 롱 서비스 라인은 코트 맨 뒤 라인이다 (ox, 참)
11. 복식에서 롱 서비스 라인은 뒤에서 두 번째 라인이다 (ox, 참)
12. 코트 라인의 폭 (fill: 40, 단위 mm)
13. 라인은 그 라인이 속한 코트의 일부로 간주한다 (ox, 참)
14. 숏 서비스 라인과 네트 사이의 거리 (choice: 1.98m)

Run: `npx vitest run src/data/questions.test.ts` → PASS 확인 후
```bash
git add src/data/questions.ts
git commit -m "feat: add 용어와 장비 questions"
```

- [ ] **Step 4: `tournament` (대회 운영) 14문항 추가**

id는 `tournament-01` ~ `tournament-14`. 주제:

1. 토스에서 이긴 편이 선택할 수 있는 것 (choice: 서브/리시브 또는 코트)
2. 토스에서 진 편은 남은 선택권을 갖는다 (ox, 참)
3. 경기 중 선수가 코트를 떠나려면 필요한 것 (choice: 주심의 허가)
4. 경기 지연 행위에 대한 판정 (choice)
5. 선수가 경기를 계속할 수 없을 때의 처리 (choice: 기권)
6. 기권한 선수의 상대는 승리한다 (ox, 참)
7. 실격과 기권의 차이 (choice)
8. 기록지에 반드시 기재하는 항목 (choice)
9. 코치는 인터벌 중에만 선수에게 조언할 수 있다 (ox, 참)
10. 경기 중 셔틀 교체를 요청할 수 있는 시점 (choice)
11. 레프리의 역할 (choice: 대회 전반의 책임)
12. 주심의 판정에 이의가 있을 때 선수가 호소할 수 있는 대상 (fill: 레프리)
13. 경기 시작 전 선수가 코트에서 연습할 수 있는 시간 (choice)
14. 부상으로 인한 경기 중단 시간의 결정권자 (choice: 레프리)

Run: `npx vitest run src/data/questions.test.ts` → PASS 확인 후
```bash
git add src/data/questions.ts
git commit -m "feat: add 대회 운영 questions"
```

- [ ] **Step 5: 전체 문항 수 확인**

Run: `npm test`
Expected: 모든 테스트 PASS. 무결성 테스트의 `has at least one question per tag`가 다섯 태그 모두를 통과한다.

Run: `node --input-type=module -e "import('./src/data/questions.ts').catch(() => {})" 2>/dev/null || grep -c "id: '" src/data/questions.ts`
Expected: 70 (문항 수). 정확히 70이 아니어도 되지만 60~80 범위 안이어야 한다.

---

## Task 7: 유형별 렌더러 세 개

세 컴포넌트는 서로를 모른다. 각자 자기 유형의 문제 하나만 그린다. 정답 여부는 `revealed`가 `true`일 때만 드러낸다 — 채점하지 않기 때문에, 사용자가 고른 것과 정답을 나란히 보여줄 뿐 옳고 그름을 말하지 않는다.

**Files:**
- Create: `src/components/questions/ChoiceView.tsx`
- Create: `src/components/questions/OXView.tsx`
- Create: `src/components/questions/FillBlankView.tsx`

- [ ] **Step 1: `ChoiceView.tsx` 작성**

```tsx
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
```

- [ ] **Step 2: `OXView.tsx` 작성**

```tsx
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
```

- [ ] **Step 3: `FillBlankView.tsx` 작성**

빈칸은 채점하지 않는다. 입력은 받되 문자열을 비교하지 않고, 펼치면 정답을 옆에 보여줄 뿐이다. `155`와 `155cm`와 `백오십오`를 놓고 기계가 오답 판정을 내리면 공부에 방해가 된다.

```tsx
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
```

- [ ] **Step 4: 타입 체크**

Run: `npm run typecheck`
Expected: 성공.

- [ ] **Step 5: 커밋**

```bash
git add src/components/questions
git commit -m "feat: add per-type question renderers

Each renderer knows only its own question type. Adding a new type
means adding a file, not editing these."
```

---

## Task 8: `AnswerPanel`과 `QuestionCard`

**Files:**
- Create: `src/components/AnswerPanel.tsx`
- Create: `src/components/QuestionCard.tsx`

- [ ] **Step 1: `AnswerPanel.tsx` 작성**

`formatAnswer`의 `switch`가 유니온의 모든 멤버를 덮으므로, 나중에 새 문제 유형을 추가하면 TypeScript가 여기서 에러를 낸다. 그게 의도다.

```tsx
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
```

- [ ] **Step 2: `QuestionCard.tsx` 작성**

`renderBody`의 `switch`는 판별 유니온을 좁혀주므로 각 렌더러에 정확한 타입이 넘어간다. `userAnswer?.type === question.type` 검사는 타입 좁히기를 위한 것이지 방어 코드가 아니다 — `answers`가 questionId로 키잉되므로 유형이 어긋날 수 없다.

```tsx
import type { ChoiceIndex, Question, UserAnswer } from '../types';
import { AnswerPanel } from './AnswerPanel';
import { ChoiceView } from './questions/ChoiceView';
import { FillBlankView } from './questions/FillBlankView';
import { OXView } from './questions/OXView';
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
```

- [ ] **Step 3: 타입 체크**

Run: `npm run typecheck`
Expected: 성공.

- [ ] **Step 4: 커밋**

```bash
git add src/components/AnswerPanel.tsx src/components/QuestionCard.tsx
git commit -m "feat: add QuestionCard type dispatch and AnswerPanel"
```

---

## Task 9: `QuizView`

세 가지 세션 상태를 여기서 들고 있다. 새로고침하면 전부 사라지며, 그게 설계 의도다.

**Files:**
- Create: `src/components/QuizView.tsx`

- [ ] **Step 1: `QuizView.tsx` 작성**

정답 토글은 문제마다 독립이다. `revealed`가 questionId의 `Set`이므로 3번을 펼치고 4번으로 넘어가면 4번은 닫혀 있고, 3번으로 돌아오면 다시 펼쳐져 있다.

```tsx
import { useState } from 'react';
import type { Question, UserAnswer } from '../types';
import { QuestionCard } from './QuestionCard';

interface Props {
  questions: readonly Question[];
  onRestart: () => void;
}

export function QuizView({ questions, onRestart }: Props) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, UserAnswer>>({});
  const [revealed, setRevealed] = useState<ReadonlySet<string>>(new Set());

  const question = questions[index];
  const isFirst = index === 0;
  const isLast = index === questions.length - 1;

  function handleAnswer(answer: UserAnswer) {
    setAnswers((previous) => ({ ...previous, [question.id]: answer }));
  }

  function handleToggleReveal() {
    setRevealed((previous) => {
      const next = new Set(previous);
      if (next.has(question.id)) next.delete(question.id);
      else next.add(question.id);
      return next;
    });
  }

  return (
    <main className="quiz-view">
      <header className="quiz-view__header">
        <p className="quiz-view__progress">
          {index + 1} / {questions.length}
        </p>
        <button type="button" className="quiz-view__restart" onClick={onRestart}>
          새 문제 뽑기
        </button>
      </header>

      <QuestionCard
        key={question.id}
        question={question}
        userAnswer={answers[question.id]}
        onAnswer={handleAnswer}
        revealed={revealed.has(question.id)}
        onToggleReveal={handleToggleReveal}
      />

      <nav className="quiz-view__nav">
        <button type="button" disabled={isFirst} onClick={() => setIndex((i) => i - 1)}>
          ← 이전
        </button>
        <button type="button" disabled={isLast} onClick={() => setIndex((i) => i + 1)}>
          다음 →
        </button>
      </nav>
    </main>
  );
}
```

- [ ] **Step 2: 타입 체크**

Run: `npm run typecheck`
Expected: 성공.

- [ ] **Step 3: 커밋**

```bash
git add src/components/QuizView.tsx
git commit -m "feat: add QuizView with per-question reveal state"
```

---

## Task 10: `TagSelector`와 `App` 연결

**Files:**
- Create: `src/components/TagSelector.tsx`
- Modify: `src/App.tsx` (전체 교체)

- [ ] **Step 1: `TagSelector.tsx` 작성**

영역을 하나도 고르지 않으면 시작 버튼이 비활성화된다. 각 영역에 몇 문항이 있는지 보여줘서, 20문항이 안 나오는 영역을 골랐을 때 사용자가 미리 안다.

```tsx
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
```

- [ ] **Step 2: `src/App.tsx` 전체 교체**

무작위 추출은 시작 버튼을 누르는 순간 한 번만 일어난다. `quizQuestions`를 state에 담아두므로 리렌더가 일어나도 문제 순서가 바뀌지 않는다.

```tsx
import { useState } from 'react';
import type { Question, TagId } from './types';
import { QUESTIONS } from './data/questions';
import { buildQuiz } from './lib/buildQuiz';
import { QuizView } from './components/QuizView';
import { TagSelector } from './components/TagSelector';

export function App() {
  const [quizQuestions, setQuizQuestions] = useState<Question[] | null>(null);

  function handleStart(tags: TagId[]) {
    const questions = buildQuiz(QUESTIONS, tags);
    if (questions.length === 0) return;
    setQuizQuestions(questions);
  }

  if (quizQuestions === null) {
    return <TagSelector onStart={handleStart} />;
  }

  return <QuizView questions={quizQuestions} onRestart={() => setQuizQuestions(null)} />;
}
```

- [ ] **Step 3: 타입 체크와 빌드**

Run: `npm run typecheck && npm run build`
Expected: 둘 다 성공.

- [ ] **Step 4: 개발 서버로 직접 확인**

Run: `npm run dev`

브라우저에서 확인할 것:
1. 영역을 하나도 안 고르면 시작 버튼이 비활성이고 "영역을 선택하세요"라고 뜬다.
2. `경기 규칙`만 고르면 버튼에 "14문제 시작하기"가 뜬다 (해당 영역 문항 수).
3. 모든 영역을 고르면 "20문제 시작하기"가 뜬다 (20에서 잘린다).
4. 시작하면 문제 카드가 뜨고 진행률이 `1 / 20`이다.
5. 선택지를 누르면 선택 표시가 되지만 정답 여부는 알려주지 않는다.
6. "답·해설 보기"를 누르면 정답과 해설이 펼쳐지고, 정답 선택지가 강조된다.
7. 다음으로 넘어가면 새 문제는 접혀 있다. 이전으로 돌아오면 아까 펼친 상태가 그대로다.
8. 마지막 문제에서 "다음" 버튼이 비활성이다.
9. "새 문제 뽑기"를 누르면 영역 선택 화면으로 돌아간다.

확인이 끝나면 Ctrl+C로 서버를 멈춘다.

- [ ] **Step 5: 커밋**

```bash
git add src/App.tsx src/components/TagSelector.tsx
git commit -m "feat: wire TagSelector and QuizView through App phase state

The quiz array is drawn once on start and stored in state, so
re-renders never reshuffle the questions."
```

---

## Task 11: 스타일

**Files:**
- Modify: `src/index.css` (전체 교체)

클래스 이름은 컴포넌트 이름을 접두사로 붙여 충돌을 피한다. CSS Modules도 Tailwind도 쓰지 않는다 — 컴포넌트가 여덟 개뿐이다.

- [ ] **Step 1: `src/index.css` 작성**

```css
:root {
  --bg: #f7f7f5;
  --surface: #ffffff;
  --border: #dcdcd6;
  --text: #23231f;
  --muted: #6b6b63;
  --accent: #1f6f4a;
  --accent-soft: #e3f1e9;
  --selected: #dfe7f5;
  --selected-border: #4a6ea8;

  font-family: system-ui, -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  line-height: 1.6;
  color: var(--text);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

button {
  font: inherit;
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* --- TagSelector --- */

.tag-selector,
.quiz-view {
  max-width: 40rem;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
}

.tag-selector__title {
  margin: 0 0 0.25rem;
  font-size: 1.75rem;
}

.tag-selector__subtitle {
  margin: 0 0 2rem;
  color: var(--muted);
}

.tag-selector__list {
  list-style: none;
  margin: 0 0 2rem;
  padding: 0;
  display: grid;
  gap: 0.75rem;
}

.tag-selector__item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.5rem 0.75rem;
  padding: 1rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  cursor: pointer;
}

.tag-selector__item:has(input:checked) {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.tag-selector__label {
  font-weight: 600;
}

.tag-selector__count {
  color: var(--muted);
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
}

.tag-selector__description {
  grid-column: 2 / -1;
  color: var(--muted);
  font-size: 0.875rem;
}

.tag-selector__start {
  width: 100%;
  padding: 1rem;
  font-size: 1.05rem;
  font-weight: 600;
  color: #fff;
  background: var(--accent);
  border: none;
  border-radius: 0.75rem;
}

/* --- QuizView --- */

.quiz-view__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.quiz-view__progress {
  margin: 0;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.quiz-view__restart {
  padding: 0.4rem 0.9rem;
  color: var(--muted);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 999px;
  font-size: 0.875rem;
}

.quiz-view__nav {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1.5rem;
}

.quiz-view__nav button {
  flex: 1;
  padding: 0.85rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
}

/* --- QuestionCard --- */

.question-card {
  padding: 1.5rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 1rem;
}

.question-card__tag {
  margin: 0 0 0.5rem;
  color: var(--accent);
  font-size: 0.8rem;
  font-weight: 600;
}

.question-card__prompt {
  margin: 0 0 1.5rem;
  font-size: 1.15rem;
  line-height: 1.5;
}

.question-card__toggle {
  width: 100%;
  margin-top: 1.5rem;
  padding: 0.75rem;
  color: var(--accent);
  background: var(--accent-soft);
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
}

/* --- ChoiceView --- */

.choice-view {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.5rem;
}

.choice-view__option {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  width: 100%;
  padding: 0.85rem 1rem;
  text-align: left;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.6rem;
}

.choice-view__option--selected {
  background: var(--selected);
  border-color: var(--selected-border);
}

.choice-view__option--answer {
  background: var(--accent-soft);
  border-color: var(--accent);
  font-weight: 600;
}

.choice-view__label {
  color: var(--muted);
}

.choice-view__option--answer .choice-view__label {
  color: var(--accent);
}

/* --- OXView --- */

.ox-view {
  display: flex;
  gap: 1rem;
}

.ox-view__option {
  flex: 1;
  padding: 1.5rem;
  font-size: 2rem;
  font-weight: 700;
  color: var(--muted);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
}

.ox-view__option--selected {
  color: var(--selected-border);
  background: var(--selected);
  border-color: var(--selected-border);
}

.ox-view__option--answer {
  color: var(--accent);
  background: var(--accent-soft);
  border-color: var(--accent);
}

/* --- FillBlankView --- */

.fill-view__field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.fill-view__input {
  flex: 1;
  padding: 0.85rem 1rem;
  font: inherit;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.6rem;
}

.fill-view__input:focus {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.fill-view__unit {
  color: var(--muted);
}

.fill-view__answer {
  margin: 0.75rem 0 0;
  color: var(--accent);
}

/* --- AnswerPanel --- */

.answer-panel {
  margin-top: 1rem;
  padding: 1.25rem;
  background: var(--bg);
  border-radius: 0.75rem;
}

.answer-panel__answer,
.answer-panel__explanation {
  margin: 0;
}

.answer-panel__explanation {
  margin-top: 0.75rem;
  color: var(--muted);
}

.answer-panel__heading {
  display: block;
  margin-bottom: 0.2rem;
  color: var(--muted);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}

@media (max-width: 30rem) {
  .question-card {
    padding: 1.25rem 1rem;
  }
}
```

- [ ] **Step 2: 개발 서버로 확인**

Run: `npm run dev`

브라우저에서 세 유형의 문제가 모두 제대로 보이는지 확인한다. 특히 OX 문제의 큰 O/X 버튼, 빈칸 문제의 입력창과 단위 표시, 4지선다의 선택 상태와 정답 강조가 서로 구분되는지 본다. 창을 좁혀 모바일 폭에서도 레이아웃이 깨지지 않는지 확인한다.

Ctrl+C로 서버를 멈춘다.

- [ ] **Step 3: 커밋**

```bash
git add src/index.css
git commit -m "style: add full stylesheet"
```

---

## Task 12: GitHub Pages 배포

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `README.md`

- [ ] **Step 1: 워크플로 작성**

타입 체크와 테스트가 빌드보다 먼저 온다. 데이터 오타가 사이트에 올라가는 걸 막는 장치다.

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - run: npm ci

      - name: Type check
        run: npm run typecheck

      - name: Test
        run: npm test

      - name: Build
        run: npm run build

      - uses: actions/configure-pages@v5

      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: `README.md` 작성**

```markdown
# 배드민턴 심판 3급 문제 풀이

배드민턴 심판 3급 필기시험 준비용 문제 사이트.
영역을 골라 무작위 문제를 풀고, 정답과 해설을 토글로 확인한다.

**https://tube-jeonghoon.github.io/badmintonExam/**

## 문제 데이터에 대하여

`src/data/questions.ts`의 문제와 해설은 BWF Laws of Badminton을 근거로 작성한
**학습용 초안**이다. 대한배드민턴협회 심판 3급 교재의 표현이나 출제 범위와
다를 수 있으므로, 교재와 대조해 수정해 가며 쓰는 것을 전제로 한다.

## 개발

```bash
npm install
npm run dev        # 개발 서버
npm test           # 데이터 무결성 + 순수함수 테스트
npm run typecheck  # 타입 체크
npm run build      # 프로덕션 빌드
```

문제를 추가하려면 `src/data/questions.ts`에 항목을 넣는다. 유형에 맞지 않는
필드를 쓰면 `npm run typecheck`가 막고, id 중복이나 빈 해설은 `npm test`가 막는다.
```

- [ ] **Step 3: 전체 검증**

Run: `npm run typecheck && npm test && npm run build`
Expected: 세 단계 모두 성공. 워크플로가 CI에서 돌릴 것과 같은 명령이다.

- [ ] **Step 4: 커밋**

```bash
git add .github README.md
git commit -m "ci: deploy to GitHub Pages on push to main

Typecheck and tests gate the build, so a data typo blocks the
release instead of shipping."
```

- [ ] **Step 5: GitHub 저장소 생성과 푸시**

저장소 이름은 `badmintonExam`이어야 한다. `vite.config.ts`의 `base: '/badmintonExam/'`가 이 이름에 묶여 있다. 다른 이름으로 만들면 사이트가 흰 화면으로 뜬다.

Pages는 유료 플랜이 아니면 공개 저장소에서만 무료다.

```bash
gh repo create badmintonExam --public --source=. --remote=origin --push
```

Expected: 저장소가 생성되고 `main`이 푸시된다.

- [ ] **Step 6: Pages 소스를 Actions로 설정**

```bash
gh api -X POST repos/tube-jeonghoon/badmintonExam/pages -f build_type=workflow
```

Expected: `201 Created`. 이미 설정되어 있으면 `409 Conflict`가 나는데, 그건 정상이다.

- [ ] **Step 7: 배포 확인**

Run: `gh run watch`
Expected: `build`와 `deploy` 잡이 모두 성공.

Run: `gh browse` 또는 브라우저에서 `https://tube-jeonghoon.github.io/badmintonExam/` 열기

확인할 것: 흰 화면이 아니라 영역 선택 화면이 뜬다. 흰 화면이면 브라우저 콘솔을 열어 JS/CSS가 404인지 본다 — 그렇다면 `vite.config.ts`의 `base`와 저장소 이름이 어긋난 것이다.

첫 배포는 반영까지 1~2분 걸릴 수 있다.

---

## 완료 기준

- [ ] `npm run typecheck`, `npm test`, `npm run build`가 모두 통과한다.
- [ ] 다섯 영역에 걸쳐 60~80문항이 있고, 세 유형이 모두 쓰인다.
- [ ] 영역을 골라 시작하면 무작위 문제가 카드로 하나씩 나온다.
- [ ] 정답·해설 토글이 문제마다 독립으로 동작한다.
- [ ] 이전/다음으로 오갈 때 문제 순서와 입력한 답이 유지된다.
- [ ] `https://tube-jeonghoon.github.io/badmintonExam/`가 정상 동작한다.
