# 배드민턴 심판 3급 문제 출제 사이트 — 설계

작성일: 2026-07-11
상태: 승인됨

## 1. 목적

배드민턴 심판 3급 필기시험을 준비하는 사람이 무작위로 뽑힌 문제를 풀고, 원할 때 정답과 해설을 펼쳐볼 수 있는 정적 웹사이트를 만든다. 문제는 로컬 목업 데이터로 관리하고 GitHub Pages로 호스팅한다.

배포 주소: `https://tube-jeonghoon.github.io/badmintonExam/`

### 성공 기준

- 사용자가 공부할 영역을 고르고 시작하면 해당 영역에서 무작위로 뽑힌 문제를 한 번에 하나씩 카드로 본다.
- 각 문제에서 정답과 해설을 토글로 펼치고 접을 수 있다.
- 이전/다음으로 문제 사이를 오갈 때 문제 순서와 사용자가 입력한 답이 유지된다.
- `main` 브랜치에 푸시하면 타입 체크와 테스트를 통과한 경우에만 GitHub Pages에 자동 배포된다.

### 사용자

시험을 준비하는 본인, 그리고 링크를 받아 문제를 풀어보는 다른 준비생.

## 2. 범위

### 만드는 것

- 영역(태그) 선택 화면
- 한 문제씩 보여주는 카드형 풀이 화면 (진행률, 이전/다음)
- 세 가지 문제 유형: 4지선다 객관식, OX 단답, 빈칸 채우기
- 문제별 독립적인 정답·해설 토글
- 다섯 영역에 걸친 70문항 안팎의 목업 데이터
- 순수함수와 데이터 무결성에 대한 테스트
- GitHub Actions를 통한 GitHub Pages 자동 배포

### 만들지 않는 것 (YAGNI)

오답 노트, 채점과 점수 표시, 진행 상황 영구 저장, 다크 모드, 문제 추가/편집 UI, 제한 시간 타이머, 선택지 순서 셔플. 모두 나중에 붙일 수 있으며, 지금 넣으면 상태 관리가 필요 이상으로 복잡해진다.

## 3. 기술 스택

Vite + React + TypeScript. 정적 산출물만 나오므로 GitHub Pages에 그대로 올라간다. 라우터, 서버, 상태 관리 라이브러리는 쓰지 않는다. 화면이 두 개뿐이라 `App`의 state 하나로 전환한다.

테스트는 Vitest. 스타일은 `src/index.css` 한 장에 plain CSS로 쓴다. 컴포넌트가 열 개 미만이고 화면이 두 개뿐이라 CSS Modules나 Tailwind를 도입할 이유가 없다. 클래스 이름은 `quiz-card__prompt`처럼 컴포넌트 이름을 접두사로 붙여 충돌을 피한다.

## 4. 아키텍처

```
src/
  main.tsx
  App.tsx                      # phase: 'setup' | 'quiz' 전환
  types.ts                     # Question 판별 유니온
  data/
    questions.ts               # QUESTIONS: Question[]
    tags.ts                    # 영역 메타데이터
  lib/
    shuffle.ts                 # fisherYates<T>(items): T[]
    buildQuiz.ts               # (all, tags, count) => Question[]
  components/
    TagSelector.tsx
    QuizView.tsx
    QuestionCard.tsx
    AnswerPanel.tsx
    questions/
      ChoiceQuestion.tsx
      OXQuestion.tsx
      FillBlankQuestion.tsx
```

`lib/`의 두 모듈은 React를 모르는 순수함수이므로 단독으로 테스트한다. `questions/`의 세 렌더러는 서로를 모르며, `QuestionCard`는 `type`을 보고 알맞은 렌더러를 고르는 것 외에는 각 유형의 내부를 모른다. 새 문제 유형을 추가할 때 기존 렌더러를 수정할 필요가 없다.

## 5. 데이터 모델

```ts
export type TagId = 'rules' | 'refereeing' | 'faults' | 'equipment' | 'tournament';

interface BaseQuestion {
  id: string;          // 'rules-001'
  tag: TagId;
  prompt: string;
  explanation: string; // 근거 규칙 조항을 포함한 설명
}

export interface ChoiceQuestion extends BaseQuestion {
  type: 'choice';
  choices: [string, string, string, string];
  answerIndex: 0 | 1 | 2 | 3;
}

export interface OXQuestion extends BaseQuestion {
  type: 'ox';
  answer: boolean;
}

export interface FillBlankQuestion extends BaseQuestion {
  type: 'fill';
  answer: string;      // '155', '레트'
  unit?: string;       // 'cm' — 입력창 옆에 표시
}

export type Question = ChoiceQuestion | OXQuestion | FillBlankQuestion;
```

사용자가 입력한 답도 유형별로 형태가 다르므로 유니온으로 둔다. 채점하지 않으므로 정답과 비교하는 코드는 없고, 오직 화면에 "내가 고른 것"을 표시하는 데만 쓴다.

```ts
export type UserAnswer =
  | { type: 'choice'; index: 0 | 1 | 2 | 3 }
  | { type: 'ox'; value: boolean }
  | { type: 'fill'; text: string };
```

판별 유니온을 쓰는 이유는 데이터를 손으로 70개 작성하기 때문이다. OX 문제에 `choices`를 실수로 넣거나 객관식에서 `answerIndex`를 빠뜨리면 컴파일이 막힌다.

`FillBlankQuestion.unit`은 수치를 묻는 문제에서만 쓴다 (예: 네트 높이를 묻고 입력창 옆에 `cm`을 표시). 용어를 묻는 빈칸 문제에는 없다.

## 6. 컴포넌트와 데이터 흐름

`App`은 `phase: 'setup' | 'quiz'`와 확정된 `quizQuestions: Question[]`을 들고 있다.

무작위 추출은 시작 버튼을 누르는 순간 **한 번만** 일어난다. `buildQuiz()`가 반환한 배열은 그 뒤로 바뀌지 않으므로, 렌더링이 반복되어도 이전/다음을 오갈 때 문제가 뒤바뀌지 않는다.

`QuizView`는 세 가지 세션 상태를 들고 있다.

- `index: number` — 현재 문제 위치
- `answers: Record<string, UserAnswer>` — 사용자가 고르거나 입력한 답 (questionId로 키잉)
- `revealed: Set<string>` — 정답·해설을 펼친 문제들

새로고침하면 모두 초기화된다. 영구 저장은 하지 않기로 결정했다.

정답 토글은 문제마다 독립이다. 3번에서 답을 펼치고 4번으로 넘어가면 4번은 닫힌 상태이며, 3번으로 돌아오면 다시 펼쳐져 있다.

### 채점하지 않는다

이 서비스는 시험이 아니라 문제지다. 4지선다에서 선택지를 클릭하면 선택 표시만 되고 옳고 그름을 알려주지 않는다. 답 토글을 열면 그때 정답 선택지가 강조되며, 사용자가 고른 것과 다르면 눈으로 바로 구분된다.

빈칸 문제도 입력은 받되 문자열 비교로 채점하지 않는다. `155`, `155cm`, `백오십오`를 놓고 기계가 오답 판정을 내리는 것은 학습에 도움이 되지 않으며, 정답을 나란히 보여주면 사용자가 스스로 판단한다.

## 7. 출제 로직

`buildQuiz(all, selectedTags, count)`:

1. `selectedTags`에 포함된 태그의 문제만 거른다.
2. Fisher-Yates로 섞는다. 원본 배열은 변형하지 않는다.
3. 앞에서 `count`개를 잘라낸다. 기본값 20.

### 경계 조건

- 선택된 영역의 문항 수가 `count`보다 적으면 있는 만큼만 출제하고, 진행률에 실제 문항 수를 표시한다 (예: "3 / 12").
- 아무 영역도 선택하지 않으면 시작 버튼을 비활성화한다.

선택지 순서 셔플은 넣지 않는다. 정답 위치를 외우는 것을 막아주긴 하지만, `answerIndex` 재계산이라는 버그 표면이 늘어난다. 필요해지면 그때 추가한다.

## 8. 문제 영역과 콘텐츠

다섯 영역, 영역당 12~16문항, 총 70문항 안팎.

| 태그 | 라벨 | 다루는 내용 |
|---|---|---|
| `rules` | 경기 규칙 | 서비스 코트, 득점, 코트 체인지, 인터벌 |
| `refereeing` | 심판 운영 | 심판 구성, 콜과 수신호, 진행 문구 |
| `faults` | 반칙과 벌칙 | 서비스 폴트, 렛, 미스컨덕트 카드 |
| `equipment` | 용어와 장비 | 셔틀콕, 라켓, 네트·코트 규격 |
| `tournament` | 대회 운영 | 토스, 기권과 실격, 기록지 |

각 영역 안에서 세 가지 문제 유형을 섞는다. 수치와 규격은 빈칸 문제로, 규칙의 참·거짓 판단은 OX로, 판정과 절차는 4지선다로 내는 것이 자연스럽다.

### 콘텐츠 정확성에 대한 경고

문제와 해설은 BWF Laws of Badminton을 근거로 작성하지만, 대한배드민턴협회의 심판 3급 실제 출제 범위나 교재 표현과 세부에서 어긋날 수 있다. 네트 높이 같은 물리적 규격은 안정적이나, 미스컨덕트 처리 절차처럼 협회 지침이 개정되는 항목은 부정확할 가능성이 있다.

따라서 각 문제의 `explanation`에 근거 조항을 명시하고, 사용자가 교재와 대조해 수정하는 것을 전제로 한다. 데이터가 `data/questions.ts` 한 파일에 모여 있어 수정이 쉽다. 이 파일은 검증된 참고 자료가 아니라 **학습용 초안**으로 취급한다.

## 9. 오류 처리

이 앱에는 네트워크 요청도, 사용자 입력 검증도, 비동기 실패 지점도 없다. 데이터는 빌드 시점에 번들에 포함되므로 런타임에 문제 데이터를 못 불러오는 상황이 존재하지 않는다.

다뤄야 할 실패는 두 가지 경계 조건뿐이며, 7절에 기술한 대로 처리한다. 잘못된 데이터(중복 id, 범위 밖 `answerIndex`)는 런타임이 아니라 테스트와 타입 체크에서 잡아 배포를 막는다.

## 10. 테스트 전략

Vitest로 순수함수와 데이터 무결성만 검증한다. 컴포넌트 렌더링 테스트는 이 규모에 과하다.

**`shuffle.ts`** — 원소 보존(같은 원소가 같은 개수로 나온다), 원본 배열 불변, 빈 배열과 단일 원소 배열 처리.

**`buildQuiz.ts`** — 선택된 태그의 문제만 나온다, 결과 개수가 `count`를 넘지 않는다, 가용 문항이 `count`보다 적으면 전부 나온다, 빈 태그 배열이면 빈 결과가 나온다.

**데이터 무결성** — 가장 값어치가 큰 테스트다. 70문항을 손으로 쓰면 반드시 오타가 난다.

- 모든 `id`가 유일하다.
- 모든 `tag`가 `tags.ts`에 정의되어 있다.
- 모든 `choice` 문제의 `answerIndex`가 `choices` 범위 안에 있다.
- 모든 문제의 `prompt`와 `explanation`이 빈 문자열이 아니다.
- 모든 영역에 최소 1문항 이상 있다.

## 11. 배포

`vite.config.ts`에 `base: '/badmintonExam/'`를 설정한다. GitHub Pages가 저장소 이름을 하위 경로로 붙이기 때문이며, 이걸 빠뜨리면 JS와 CSS가 404가 나서 흰 화면만 뜬다.

GitHub Actions 워크플로가 `main` 브랜치 푸시에 반응해 순서대로 실행한다.

1. `tsc --noEmit` — 타입 체크
2. `vitest run` — 테스트
3. `vite build` — 빌드
4. Pages에 게시

앞 단계가 실패하면 배포되지 않는다. 데이터 오타가 사이트에 올라가는 것을 막는 장치다.

라우터가 없으므로 GitHub Pages의 SPA 새로고침 404 문제는 발생하지 않는다. 저장소는 공개로 만든다 (비공개 저장소의 Pages는 유료 플랜이 필요하다).

## 12. 향후 확장 지점

지금 만들지 않지만, 설계가 막지 않는 것들:

- **오답 노트** — `QuizView`의 `answers` 상태를 localStorage에 직렬화하면 된다.
- **새 문제 유형** (순서 맞추기, 다중 선택) — `Question` 유니온에 멤버를 추가하고 렌더러를 하나 더 쓴다. `QuestionCard`의 디스패치에 한 줄이 는다.
- **선택지 셔플** — `buildQuiz` 안에서 처리하며, `answerIndex` 대신 정답 값을 들고 다니도록 바꾼다.
