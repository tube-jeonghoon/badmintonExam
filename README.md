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
