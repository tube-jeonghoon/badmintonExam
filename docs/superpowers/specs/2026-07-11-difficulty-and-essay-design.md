# 난이도 필터와 서술형 문제 — 설계

작성일: 2026-07-11
상태: 승인됨

## 목적

기존 배드민턴 심판 3급 퀴즈 사이트에 세 가지를 더한다.

1. 더 어려운 문제 (규칙의 예외·경계 사례를 파고드는 문항).
2. "어려운 문제 포함" 체크 필터 — 켜면 어려운 문제가 출제 풀에 섞여 나온다.
3. 서술형 문제 유형 — 자유 서술 후 모범답안을 펼쳐 보는 방식.

### 성공 기준

- 기본 상태에서는 기존과 동일하게 기본 난이도 문제만 나온다.
- "어려운 문제 포함"을 체크하면 기본 + 어려움이 섞여 출제되고, 서술형도 이때 등장한다.
- 서술형은 자유 서술란에 입력할 수 있고, 답을 펼치면 모범답안과 핵심 포인트가 보인다. 채점은 하지 않는다.
- 난이도 필터 상태에 따라 각 영역의 문항 수 표시와 출제 수 요약이 갱신된다.
- 데이터 무결성 테스트와 타입 체크가 새 유형·필드를 검증해, 오타가 배포를 막는다.

## 현재 상태

- 문항 100개, 5영역 × 20개. 세 유형(choice/ox/fill). 난이도 개념 없음.
- `buildQuiz(all, selectedTags, count?, rng?)`는 태그로 거른 뒤 셔플·상한.
- `TagSelector`는 영역 체크박스 + 전체 선택 + 카운트 요약. `App`이 `phase`로 전환.
- 다른 기여자도 `src/data/questions.ts`를 편집 중이다(문항 추가). 병합 충돌을 줄이는 것이 데이터 모델 결정의 한 축이다.

## 데이터 모델 결정: 난이도는 옵셔널 필드

`difficulty`를 옵셔널로 두고 **어려운 문제에만** `difficulty: 'hard'`를 명시한다. 없으면 기본(basic)으로 간주한다.

이유: 기존 100문항을 한 줄도 건드리지 않아도 되므로, 같은 파일을 편집하는 다른 기여자와의 병합 충돌 위험이 작다. 필수 필드로 두면 100개를 전부 수정해야 해서 충돌 표면이 커진다.

## 데이터 모델 (`src/types.ts`)

```ts
export type Difficulty = 'basic' | 'hard';

interface BaseQuestion {
  id: string;
  tag: TagId;
  prompt: string;
  explanation: string;
  difficulty?: Difficulty; // 없으면 basic
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

`ChoiceQuestion`/`OXQuestion`/`FillBlankQuestion`은 그대로. 판별 유니온이 `EssayQuestion`을 새 멤버로 받으므로, 유형 디스패치의 exhaustive switch가 컴파일 단계에서 서술형 처리 누락을 잡는다.

난이도는 유형과 직교한다. 어려운 문항은 choice/ox/fill 중 무엇이든 될 수 있고 `difficulty: 'hard'`를 단다. **서술형은 전부 `difficulty: 'hard'`** — 어려운 문제 포함을 켜야만 등장한다.

## 출제 로직 (`src/lib/buildQuiz.ts`)

`includeHard` 인자를 추가한다.

```ts
export function buildQuiz(
  all: readonly Question[],
  selectedTags: readonly TagId[],
  includeHard: boolean,
  count: number = DEFAULT_QUIZ_SIZE,
  rng: () => number = Math.random,
): Question[]
```

필터: 태그가 선택되었고 그리고 (`includeHard` 이거나 `difficulty !== 'hard'`). 즉 기본 문제는 항상 포함, 어려운 문제는 `includeHard`일 때만. 나머지(셔플·상한)는 그대로. 순수함수이므로 난이도 필터를 단위 테스트로 검증한다.

`includeHard`는 위치 인자로 `selectedTags` 다음, `count` 앞에 둔다. 호출부(App)는 세 인자를 명시적으로 넘긴다.

## 컴포넌트와 데이터 흐름

**`App`** — `quizQuestions`와 함께 시작 시점의 `includeHard`를 `buildQuiz`에 넘긴다. `handleStart(tags, includeHard)` 형태로 시그니처를 넓힌다.

**`TagSelector`** — 영역 리스트 아래, 요약/시작 버튼 위에 "어려운 문제 포함" 체크박스 하나를 둔다. 로컬 상태 `includeHard`로 관리하고 시작 시 `onStart(tags, includeHard)`로 올린다.

- 각 영역의 "N문항" 수는 `includeHard`에 따라 갱신된다: 꺼짐이면 기본 수(20), 켜짐이면 기본+어려움 수(26). `countByTag(tag, includeHard)`.
- 요약의 출제 수도 동일하게 반영.
- 체크박스 옆에 한 줄 설명: "규칙의 예외·경계 사례와 서술형이 섞여 나옵니다."

**`EssayView`** (신규, `src/components/questions/EssayView.tsx`) — 여러 줄 `<textarea>`. 값은 `UserAnswer`에서 오고 `onChange`로 올린다. 채점하지 않으므로 문자열 비교는 없다. reveal 여부와 무관하게 입력란은 유지되고, 모범답안은 `AnswerPanel`이 담당한다.

**`QuestionCard`** — `renderBody`의 switch에 `case 'essay'` 추가 → `EssayView`. 나머지 유형은 그대로.

**`AnswerPanel`** — 서술형일 때 표시를 확장한다. 기존 유형은 "정답" 한 줄 + 해설. 서술형은 "모범답안"을 블록으로 보여주고, `keyPoints`가 있으면 "핵심 포인트" 목록(ul)을 그린 뒤, 해설을 잇는다. `formatAnswer`의 switch에 `case 'essay'`를 더하되, 서술형은 인라인 strong이 아니라 블록 렌더링이 필요하므로 `AnswerPanel` 본문에서 유형 분기를 둔다.

## 콘텐츠

영역당 어려움 4 + 서술형 2 = 영역당 6, 총 30문항 신규.

- id 규칙: 어려움 비서술형은 `<tag>-h1`~`<tag>-h4`, 서술형은 `<tag>-e1`~`<tag>-e2`. (기존 `<tag>-01`~`-20`과 겹치지 않는다.)
- 어려움 문항은 규칙의 예외·경계·혼동 지점을 다룬다(예: 서비스 오버핸드 판정의 세부, 렛과 폴트의 경계, 듀스·연장 상황의 코트/서버, 실격 절차의 주체).
- 서술형은 "~을 설명하시오 / ~의 절차를 서술하시오" 형태. `answer`에 모범답안, `keyPoints`에 채점 핵심 3~5개.
- 파일 끝에 이어 붙이며, 앞부분(기존 100문항, 주석, import)은 건드리지 않는다.

### 정확성

이전 문항과 같은 원칙. BWF Laws of Badminton 근거, 확실하지 않은 조항 번호는 쓰지 않고 주제만 표기. 추가 후 **배드민턴 규칙 전문가 리뷰로 30문항 전량 사실 검증**한다. 학습용 초안이라는 성격은 그대로다.

## 무결성 테스트 (`src/data/questions.test.ts`)

기존 검사에 더한다.

- 모든 `difficulty`는 `undefined`이거나 `'basic'` 또는 `'hard'`.
- 서술형은 `answer`가 빈 문자열이 아니다.
- 서술형에 `keyPoints`가 있으면 각 항목이 빈 문자열이 아니다.
- 서술형은 모두 `difficulty === 'hard'` (설계 규칙).
- (선택) 각 영역에 어려움·서술형이 최소 1개씩 존재.

`buildQuiz.test.ts`에 난이도 필터 테스트: `includeHard=false`면 hard 제외, `true`면 포함, 기존 경계 조건은 유지.

## 오류 처리

새 실패 지점 없음. 서술형 입력은 검증하지 않는다(채점 없음). 잘못된 데이터는 타입 체크와 무결성 테스트가 배포 전에 막는다. 서술형이 하나도 없는 영역을 골라 어려움을 켜도, 그냥 어려운 비서술형만 섞일 뿐 오류가 아니다.

## 만들지 않는 것 (YAGNI)

난이도별 점수/통계, 서술형 자동 채점·키워드 매칭, 난이도 3단계 세분화, 서술형만 따로 거르는 별도 필터. 지금은 기본/어려움 2단계와 단일 "어려운 문제 포함" 토글로 충분하다.
