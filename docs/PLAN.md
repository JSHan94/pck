# 프로젝트 계획: EVM 그리드 갓챠 dApp

> **📋 작업 진행 가이드**
>
> **🔄 순차적 작업 원칙 (중요!)**
> - **반드시 체크박스를 위에서부터 하나씩 순차적으로 수행**할 것
> - 한 번에 여러 개의 체크박스를 완료하지 말고, **하나의 체크박스 완료 → 코드 리뷰 → 다음 체크박스** 순서로 진행
> - 마일스톤 단위가 아닌 **개별 체크박스 단위**로 작업을 나누어 진행
> - 각 체크박스는 독립적인 커밋으로 관리하여 리뷰 가능하도록 할 것
>
> **✅ 체크박스 완료 기준**
> - 각 작업을 완료하면 반드시 해당 항목을 `- [ ]`에서 `- [x]`로 체크 표시할 것
> - TDD 원칙을 따라 **Test First (Red) → Implementation (Green) → Refactor** 순서로 진행
> - 모든 테스트가 통과하고 타입 체크가 성공한 후에만 체크 표시
> - 커밋 전에 반드시 `pnpm test:all` 및 `pnpm typecheck:all` 실행 확인

## 1. 프로젝트 핵심 요약

**목표**: 7×7 그리드(49칸) 기반의 EVM 갓챠 dApp 구축.

**핵심 아키텍처**: 오프체인(Off-Chain) 로직 + 온체인(On-Chain) 검증 (Merkle Proof)

- **프론트엔드 (React)**: UI/UX 담당. Privy를 통한 지갑/소셜 로그인 제공. *(Vite, viem, react-query 사용)*
- **백엔드 (Supabase)**: 게임 로직(뽑기, 힌트)을 Supabase Edge Function으로 구현. 어드민이 보드를 사전 생성. **Receipt Push 방식**으로 트랜잭션 영수증을 검증하여 이벤트 처리.
- **컨트랙트 (Solidity)**: 결제 및 검증만 담당 (티켓 구매 시 merkleRoot 커밋, merkleProof 검증 후 상품 지급). ERC1155 기반. *(Foundry 사용)*
- **Shared**: 프론트엔드와 백엔드 간 타입 정의를 공유하는 TypeScript 패키지.

### 프로젝트 구조 (Monorepo)

본 프로젝트는 모노레포 구조로 구성되며, 각 컴포넌트가 독립적으로 개발 및 배포됩니다.

```
pck/
├── frontend/          # React 프론트엔드 애플리케이션
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── backend/           # Supabase Edge Functions
│   ├── supabase/
│   │   ├── functions/ # Edge Functions
│   │   └── migrations/ # DB 마이그레이션
│   └── package.json
├── contract/          # Foundry 스마트 컨트랙트
│   ├── src/
│   ├── test/
│   ├── script/
│   └── foundry.toml
├── shared/            # 공유 타입 정의 (TypeScript)
│   ├── src/
│   │   ├── types/     # API 요청/응답, DB 스키마 타입
│   │   ├── constants/ # 공유 상수 (티어 분포, 체인 ID 등)
│   │   └── utils/     # 공유 유틸리티 함수
│   ├── package.json
│   └── tsconfig.json
├── package.json       # 루트 패키지 (워크스페이스 설정)
└── pnpm-workspace.yaml
```

### Shared 패키지 역할

**목적**: 프론트엔드와 백엔드 간 타입 안정성 및 일관성 보장.

**포함 내용**:
- **API 타입**: 요청/응답 인터페이스 (`StartSessionRequest`, `PullResponse` 등)
- **DB 스키마 타입**: Supabase 테이블 타입 (`Board`, `GameSession`, `PrizeClaim` 등)
- **공유 상수**: 티어 분포, 체인 ID, 컨트랙트 주소 등
- **공유 유틸리티**: Merkle 해시 함수, 검증 로직 등

**사용 예시**:
```typescript
// frontend/src/api/game.ts
import type { StartSessionResponse } from '@pck/shared';

// backend/supabase/functions/start-session/index.ts
import type { StartSessionResponse } from '@pck/shared';
```

### 게임 메커니즘

#### 보드 사전 생성 (Admin Only, Off-Chain)
- 어드민이 `POST /api/admin/pre-generate-boards` 호출 (예: 100개).
- 백엔드가 보드 100개(`prizeLayout`, `merkleRoot` 포함)를 생성하여 DB **Board** 테이블에 저장.

#### 게임 시작 (Off-Chain + On-Chain)
1. **(Off)** 프론트엔드가 백엔드 `GET /api/game/start-session` 호출.
2. **(Off)** 백엔드가 **Board** 테이블에서 미사용 보드 1개를 랜덤 할당(`isAssigned=true`)하고, 해당 보드의 `merkleRoot` 및 새 `sessionId` 반환.
3. **(On)** 프론트엔드가 `merkleRoot`와 `sessionId`를 인자로 `buyTicket()` 트랜잭션 호출 (컨트랙트는 `sessionId`와 `merkleRoot`를 매핑하여 저장).

#### 게임 플레이 (Off-Chain)
- 프론트엔드에서 셀 클릭 → 백엔드 `POST /api/game/pull` 호출.
- 백엔드가 `tier` 반환 → 프론트엔드 UI 업데이트.

#### 힌트 (Off-Chain)
- 3회 뽑기마다 `GET /api/game/hint` 호출.

#### 상품 수령 (On-Chain)
1. 프론트엔드에서 백엔드 `GET /api/game/claim-proof` 호출 (수령할 `prizeId` 전달).
2. 백엔드가 `(merkleProof, prizeId, prizeTier, cellId, salt)` 등 증명 데이터 반환.
3. 프론트엔드가 이 증명으로 `claimPrize(proof, ...)` 함수 호출 → 상품(ERC1155) 수령.

#### 상품 풀 (보드 1개 기준, 총 49개)
- Tier 1: 1개  
- Tier 2: 2개  
- Tier 3: 6개  
- Tier 4: 10개  
- Tier 5: 18개  
- Tier 6: 12개  

---

## 2. 컴포넌트 0: Shared 패키지 (TypeScript)

**목표**: 프론트엔드와 백엔드 간 타입 안정성 및 코드 재사용성 확보.

### 마일스톤 S1: Shared 패키지 초기 설정
- [x] `shared/` 디렉토리 생성
- [x] `package.json` 설정 *(name: "@pck/shared")*
- [x] `tsconfig.json` 설정 *(strict mode, declaration 활성화)*
- [x] ~~루트 `pnpm-workspace.yaml` 설정~~ *(제거됨: 각 폴더에서 독립적으로 패키지 관리)*
- [x] 기본 폴더 구조 생성: `src/types/`, `src/constants/`, `src/utils/`
- [x] `.gitignore` 파일 생성 (루트, shared, frontend, backend, contract 각각)

### 마일스톤 S2: 공유 타입 정의
- [x] **API 타입** (`src/types/api.ts`):
  - [x] `StartSessionResponse`: `{ merkleRoot: string, sessionId: number }`
  - [x] `PullRequest`: `{ cellId: number, sessionId: number }`
  - [x] `PullResponse`: `{ tier: number }`
  - [x] `HintResponse`: `{ tier4PlusCell: number, tier5PlusCell: number }`
  - [x] `ClaimProofResponse`: `{ merkleProof: string[], prizeId: string, prizeTier: number, cellId: number, salt: string, sessionId: number }`
  - [x] `VerifyReceiptRequest`: `{ txHash: string, sessionId?: number, prizeId?: string }`
  - [x] `VerifyReceiptResponse`: `{ success: boolean, isActive?: boolean, isClaimed?: boolean }`
- [ ] **DB 스키마 타입** (`src/types/database.ts`):
  - [x] `Board`: `{ boardId: string, prizeLayout: Cell[], merkleRoot: string, isAssigned: boolean }`
  - [x] `Cell`: `{ cellId: number, tier: number, salt: string }`
  - [x] `GameSession`: `{ sessionId: number, userAddress: string, boardId: string, pullCount: number, isActive: boolean }`
  - [ ] `RevealedCell`: `{ id: number, sessionId: number, cellId: number, tier: number }`
  - [ ] `PrizeClaim`: `{ prizeId: string, userAddress: string, tier: number, isClaimed: boolean, sessionId: number, cellId: number }`

### 마일스톤 S3: 공유 상수 및 유틸리티
- [ ] **상수** (`src/constants/index.ts`):
  - [ ] `TIER_DISTRIBUTION`: `{ 1: 1, 2: 2, 3: 6, 4: 10, 5: 18, 6: 12 }`
  - [ ] `GRID_SIZE`: `7`
  - [ ] `TOTAL_CELLS`: `49`
  - [ ] `HINT_INTERVAL`: `3` (3회 뽑기마다 힌트)
- [ ] **Merkle 유틸리티** (`src/utils/merkle.ts`):
  - [ ] `hashLeaf(cellId: number, tier: number, salt: string): string` *(viem solidityPackedKeccak256)*
  - [ ] 컨트랙트 C3의 해시 로직과 1:1 매칭 보장
- [ ] **검증 유틸리티** (`src/utils/validation.ts`):
  - [ ] `isValidTier(tier: number): boolean`
  - [ ] `isValidCellId(cellId: number): boolean`

### 마일스톤 S4: 빌드 및 배포 설정
- [ ] TypeScript 컴파일 스크립트 추가: `"build": "tsc"`
- [ ] 타입 선언 파일(`.d.ts`) 생성 확인
- [ ] Frontend/Backend에서 `@pck/shared` 의존성 추가:
  ```json
  {
    "dependencies": {
      "@pck/shared": "workspace:*"
    }
  }
  ```
- [ ] 임포트 테스트: Frontend와 Backend에서 타입 임포트 확인

---

## 3. 컴포넌트 1: 프론트엔드 (React.js)

**목표**: 직관적인 사용자 인터페이스 구축. 지갑 연결, 오프체인 게임 플레이, 온체인 티켓 구매(Root 커밋) 및 상품 클레임(Proof 검증) 기능 제공.

### 마일스톤 F1: 기본 설정 및 지갑 연결 (Privy)
- [ ] `frontend/` 디렉토리에 Vite 기반 React 프로젝트 생성 *(TypeScript 권장)*
- [ ] `@pck/shared` 패키지 의존성 추가
- [ ] TailwindCSS 설정
- [ ] viem 라이브러리 설치
- [ ] keccak256, merkletreejs 설치 *(선택: 프루프 클라이언트 검증용)*
- [ ] Privy React SDK `@privy-io/react-auth` 설치
- [ ] `PrivyProvider` 설정 *(App ID, 타겟 체인 지정)*
- [ ] 타겟 체인 ID `.env` 환경 변수로 분리
- [ ] ‘로그인/로그아웃’ 버튼 UI 구현 *(Privy 훅 `login`, `logout`)*
- [ ] 사용자의 지갑 주소(`user.wallet.address`) 및 잔액 표시 UI 구현

### 마일스톤 F2: 게임 보드 UI 렌더링 (Mock Data)
- [ ] `GameBoard.tsx` 컴포넌트 생성 *(CSS Grid 7×7)*
- [ ] `Cell.tsx` 컴포넌트 생성 *(Props: `cellId`, `isRevealed`, `tier`, `isHinted`)*
- [ ] `Cell`: 미공개 상태 UI *(바둑알 모양 + 번호, 호버 효과)*
- [ ] `Cell`: 공개 상태 UI *(티어 표시, 티어별 색상)*
- [ ] `Cell`: 힌트 상태 UI *(빛나는 테두리)*
- [ ] 백엔드(B3)의 `createBoard` 로직을 JS/TS로 포팅하여 Mock 보드 생성
- [ ] `GameBoard`에서 포팅된 `createBoard`로 49개 셀 렌더링 테스트

### 마일스톤 F3: 백엔드 연동 (Mock API)
- [ ] `react-query` 설정
- [ ] MSW(Mock Service Worker) 설치
- [ ] Mock: `GET /api/game/start-session` → `{ merkleRoot: "0x...", sessionId: 1 }`
- [ ] Mock: `GET /api/game/board` → `{ boardId: 1, revealedCells: [{ cellId: 5, tier: 6 }] }`
- [ ] Mock: `GET /api/game/user-state/:address` → `{ pullCount: 3 }`
- [ ] Mock: `POST /api/game/pull` → `{ tier: 4 }`
- [ ] Mock: `GET /api/game/hint` → `{ tier4PlusCell: 10, tier5PlusCell: 20 }`
- [ ] Mock: `GET /api/game/prizes/:address` → `[{ prizeId: "uuid-1", tier: 4, isClaimed: false }]`
- [ ] 데이터 페칭: `react-query`로 `GET /api/game/board`, `GET /api/game/user-state` 연동
- [ ] `pullCount` UI 표시 *(예: “현재 3회 뽑음”)*
- [ ] ‘뽑기’ 핸들러: Cell 클릭 시 `POST /api/game/pull` 호출 *(useMutation)*
- [ ] 성공 시 UI 상태 업데이트 및 `user-state`, `board` 쿼리 무효화
- [ ] ‘힌트 받기’ 버튼: `pullCount` 기준 활성화
- [ ] 힌트 클릭 시: `GET /api/game/hint` 호출 및 `isHinted` 상태 업데이트

### 마일스톤 F4: 백엔드 연동 (Real API)
- [ ] MSW 핸들러 비활성화
- [ ] `react-query`의 API 기본 URL을 Supabase Function 주소로 변경
- [ ] 글로벌 에러 토스트 처리 *(errorBoundary 또는 onError)*
- [ ] 실제 연동: `GET /api/game/board`
- [ ] 실제 연동: `GET /api/game/user-state/:address`
- [ ] 실제 연동: `GET /api/game/prizes/:address`
- [ ] 실제 연동: `POST /api/game/pull` *(티켓 미구매 에러 처리 포함)*
- [ ] 실제 연동: `GET /api/game/hint`

### 마일스톤 F5: 스마트 컨트랙트 연동 (Receipt Push)
**목표**: 온체인 트랜잭션(티켓 구매/Root 커밋, 상품 수령/Proof 검증) UI 및 로직 구현. Receipt Push 방식으로 영수증 검증.
- [ ] 컨트랙트 ABI 및 배포 주소 환경 변수 설정
- [ ] '게임 시작(티켓 구매)' 버튼 UI
- [ ] (1단계) `GET /api/game/start-session` 호출로 Root 요청
- [ ] (2단계) 백엔드로부터 `merkleRoot`, `sessionId` 수신
- [ ] (3단계) `buyTicket(_merkleRoot, _sessionId)` 트랜잭션 전송 *(정확한 value 포함, Privy `useSendTransaction`)*
- [ ] (4단계) 트랜잭션 완료 후 `txHash` 획득
- [ ] (5단계) `POST /api/verify/ticket-purchase` ({txHash, sessionId}) 호출로 영수증 검증
- [ ] 트랜잭션 로딩/성공/실패 모달(또는 토스트)
- [ ] 영수증 검증 성공 시 `user-state` 쿼리 무효화
- [ ] 획득한 상품 목록 UI (`GET /api/game/prizes` 연동)
- [ ] '상품 수령(Claim)' 버튼 및 상세 모달
- [ ] `handleClaim` (1) `GET /api/game/claim-proof?prizeId=...`
- [ ] `handleClaim` (2) `(merkleProof, prizeId, prizeTier, cellId, salt)` 수신
- [ ] `handleClaim` (3) `claimPrize(_sessionId, _merkleProof, _prizeId, _prizeTier, _cellId, _salt)` 전송
- [ ] (4) 트랜잭션 완료 후 `txHash` 획득
- [ ] (5) `POST /api/verify/prize-claim` ({txHash, prizeId}) 호출로 영수증 검증
- [ ] 클레임 트랜잭션 로딩/성공/실패 모달 처리
- [ ] 영수증 검증 성공 시 `prizes` 쿼리 무효화

### 마일스톤 F6: 최종 마무리 및 배포
**목표**: 어드민 기능, 애니메이션 추가 및 최종 배포.
- [ ] ‘강제 리셋’ 버튼(어드민): 백엔드 API 호출 시 `user.wallet.address`로 권한 확인  
  *(참고: v6 아키텍처에서는 ‘강제 리셋’ 대신 ‘새 보드 할당’일 수 있음. B3와 협의)*
- [ ] 리셋 클릭 시: `POST /api/admin/reset-board` 호출 및 모든 쿼리 무효화 *(B3의 pre-generate-boards와 동작 정의 필요)*
- [ ] 애니메이션: 셀 클릭(뽑기) 로딩 → 응답 수신 → 셀 Flip 및 Tier 공개
- [ ] 반응형: 모바일 그리드/버튼 레이아웃 점검
- [ ] *(선택)* 클라이언트 사이드 merkleProof 검증 추가
- [ ] Vercel 배포
- [ ] 배포 환경 변수: Supabase URL/Key, 컨트랙트 주소, 체인 ID, Privy App ID

---

## 4. 컴포넌트 2: 백엔드 (Supabase)

**목표**: 모든 오프체인 게임 로직(뽑기, 힌트)을 Supabase Edge Function으로 처리하고, 온체인 검증을 위한 Merkle Root/Proof 생성.

### 마일스톤 B1: Supabase 설정 및 DB
- [ ] `backend/` 디렉토리에 Supabase 프로젝트 초기화
- [ ] `@pck/shared` 패키지 의존성 추가
- [ ] Supabase 프로젝트 생성
- [ ] *(권장)* Supabase CLI 설치 및 로컬 개발 환경 설정 (`supabase init`)
- [ ] *(권장)* `docker-compose.yml`로 로컬 DB 환경 (`supabase start`)
- [ ] B2 스키마를 GUI 또는 SQL 마이그레이션으로 실행

### 마일스톤 B2: 데이터베이스 스키마 설계 (PostgreSQL)
- [ ] **Board**: `boardId (PK)`, `prizeLayout (JSONB[{cellId,tier,salt}])`, `merkleRoot (text)`, `isAssigned (boolean, default: false)`
- [ ] **User**: `address (PK)`
- [ ] **GameSession**: `sessionId (PK)`, `userAddress (FK)`, `boardId (FK)`, `pullCount`, `isActive (boolean, default: false)`
- [ ] **RevealedCell**: `id`, `sessionId (FK)`, `cellId`, `tier`
- [ ] **PrizeClaim**: `prizeId (PK, uuid)`, `userAddress (FK)`, `tier`, `isClaimed`, `sessionId (FK)`, `cellId`
- [ ] 마이그레이션 파일 생성 및 실행 (`supabase/migrations`)
- [ ] *(선택)* Supabase TypeScript 타입 생성 및 `@pck/shared`와 동기화

### 마일스톤 B3: 핵심 게임 로직 (Edge Functions)
- [ ] Edge Functions (Deno/TS) 환경 설정
- [ ] `@pck/shared` 패키지 임포트 설정 (Deno import maps)
- [ ] `keccak256`, `merkletreejs` 설치
- [ ] 어드민 인증 미들웨어 *(Supabase RLS/Policies 등)*
- [ ] `@pck/shared`에서 `hashLeaf` 유틸 임포트 사용 *(컨트랙트 C3의 keccak 로직과 1:1 매칭)*
- [ ] **createBoard** 유틸
  - [ ] 티어 구성 49개 생성 및 셔플
  - [ ] 각 셀 `salt` 생성 (`crypto.randomUUID()` 등)
  - [ ] `prizeLayout` JSONB 작성
  - [ ] 49개 리프 생성 → Merkle Tree → `merkleRoot` 계산
  - [ ] `(prizeLayout, merkleRoot)` 반환
- [ ] **POST /api/admin/pre-generate-boards**
  - [ ] Body: `{ count: number }` (어드민 인증)
  - [ ] `count` 횟수만큼 `createBoard` 실행
  - [ ] Board 테이블에 일괄 삽입: `(prizeLayout, merkleRoot, isAssigned=false)`
- [ ] **GET /api/admin/check**: 어드민 여부 확인

### 마일스톤 B4: 게임 플레이 API (Edge Functions)
- [ ] 사용자 인증 미들웨어 *(Privy JWT 검증)*
- [ ] **GET /api/game/start-session**
  - [ ] *(DB 트랜잭션)* `isAssigned=false` 보드 1개 랜덤 조회
  - [ ] 해당 `boardId`로 `isAssigned=true` 업데이트
  - [ ] GameSession에 `(userAddress, boardId, isActive=false, pullCount=0)` 삽입 → `new_sessionId`
  - [ ] 트랜잭션 커밋 → `(selected_board.merkleRoot, new_sessionId)` 반환
- [ ] **GET /api/game/board**: GameSession의 `RevealedCell` 목록 반환
- [ ] **GET /api/game/user-state/:address**: 현재 세션 기준 `pullCount` 반환
- [ ] **GET /api/game/prizes/:address**: 미청구 `PrizeClaim` 목록 반환
- [ ] **POST /api/game/pull** *(Body: `{ cellId, sessionId }`)*
  - [ ] 인증 및 `sessionId` 소유권 확인
  - [ ] `isActive` 확인(B6 리스너가 true인지)
  - [ ] 중복 뽑기 방지
  - [ ] `boardId` 조회 → Board.prizeLayout에서 `tier` 조회
  - [ ] `RevealedCell` 기록, `pullCount` 증가, `PrizeClaim` 기록
  - [ ] 결과 `tier` 반환
- [ ] **GET /api/game/hint** *(Query: `sessionId`)*
  - [ ] 소유권 및 `pullCount % 3 == 0` 검증
  - [ ] Board.prizeLayout vs RevealedCell 비교 → T4+, T5+ 미공개 셀 ID 반환

### 마일스톤 B5: 클레임(프루프) API
- [ ] **GET /api/game/claim-proof** *(Query: `prizeId`)*
  - [ ] 인증
  - [ ] PrizeClaim에서 `prizeId` 소유권, `isClaimed=false` 확인 및 `sessionId`, `cellId`, `tier` 조회
  - [ ] GameSession에서 `boardId` → Board에서 `prizeLayout`(salt 포함) 조회
  - [ ] Merkle Tree 재생성 → `leafHash` 생성 → `merkleProof` 생성
  - [ ] `(merkleProof, prizeId, prizeTier, cellId, salt)` 반환

### 마일스톤 B6: 영수증 검증 API (Receipt Push)
**목표**: 프론트엔드가 트랜잭션 완료 후 txHash를 전송하면, 백엔드가 영수증을 직접 조회하여 이벤트 검증.
- [ ] viem 설정 및 RPC 클라이언트 구성
- [ ] **POST /api/verify/ticket-purchase**
  - [ ] Body: `{ txHash: string, sessionId: number }`
  - [ ] Privy JWT 인증 및 사용자 주소 추출
  - [ ] viem으로 `txHash`의 영수증(receipt) 조회
  - [ ] 영수증의 `logs`에서 `TicketPurchased` 이벤트 검색:
    - [ ] 컨트랙트 주소 일치 확인
    - [ ] 이벤트에서 `sessionId` 파라미터 추출 및 일치 확인
    - [ ] 이벤트에서 `user` 주소 추출 및 JWT 주소와 일치 확인
    - [ ] 이벤트에서 `merkleRoot` 추출
  - [ ] `sessionId` 기준 GameSession 조회
  - [ ] GameSession의 `boardId`로 Board 조회 → `board.merkleRoot == event.merkleRoot` 검증
  - [ ] 검증 성공 시 GameSession `isActive=true` 설정
  - [ ] 응답: `{ success: true, isActive: true }`
  - [ ] 에러 처리: `INVALID_RECEIPT`, `EVENT_NOT_FOUND`, `VERIFICATION_FAILED`
- [ ] **POST /api/verify/prize-claim**
  - [ ] Body: `{ txHash: string, prizeId: string }`
  - [ ] Privy JWT 인증 및 사용자 주소 추출
  - [ ] viem으로 `txHash`의 영수증(receipt) 조회
  - [ ] 영수증의 `logs`에서 `PrizeClaimed` 이벤트 검색:
    - [ ] 컨트랙트 주소 일치 확인
    - [ ] 이벤트에서 `prizeId` 파라미터 추출 및 일치 확인
    - [ ] 이벤트에서 `user` 주소 추출 및 JWT 주소와 일치 확인
  - [ ] 검증 성공 시 `prizeId` 기준 PrizeClaim `isClaimed=true` 업데이트
  - [ ] 응답: `{ success: true, isClaimed: true }`
  - [ ] 에러 처리: `INVALID_RECEIPT`, `EVENT_NOT_FOUND`, `VERIFICATION_FAILED`
- [ ] *(선택)* 재시도 로직: 프론트엔드에서 실패 시 재시도 또는 폴링

---

## 4. 컴포넌트 3: 스마트 컨트랙트 (Solidity)

**목표**: 최소한의 온체인 로직 담당. ERC1155 기반, Merkle Proof로 티켓 판매(Root 커밋) 및 상품 지급(Proof 검증).

### 마일스톤 C1: 기본 설정 및 역할 정의
- [ ] Foundry 프로젝트 초기화
- [ ] OpenZeppelin 설치 *(Ownable, ERC1155, `MerkleProof.sol`)*
- [ ] ERC1155 상속 및 `constructor`(URI 설정)
- [ ] 상태 변수: `owner`, `ticketPrice`
- [ ] 상태 변수: `mapping(uint256 => bytes32) public gameMerkleRoot` *(sessionId → root)*
- [ ] 상태 변수: `mapping(bytes32 => bool) public isPrizeClaimed` *(prizeId → claimed)*
- [ ] 이벤트: `TicketPurchased(address indexed user, uint256 indexed sessionId, bytes32 merkleRoot)`
- [ ] 이벤트: `PrizeClaimed(address indexed user, bytes32 indexed prizeId, uint256 prizeTier)`

### 마일스톤 C2: 티켓 구매 로직 (Merkle Root 커밋)
- [ ] `buyTicket(bytes32 _merkleRoot, uint256 _sessionId)` (public payable)
  - 참고: `_sessionId`는 백엔드(B4) **GameSession** PK(숫자) 사용
- [ ] `require(msg.value == ticketPrice, "Incorrect ticket price")`
- [ ] `require(gameMerkleRoot[_sessionId] == 0, "Session ID already used")`
- [ ] `gameMerkleRoot[_sessionId] = _merkleRoot`
- [ ] `emit TicketPurchased(msg.sender, _sessionId, _merkleRoot)`

### 마일스톤 C3: 클레임 검증 및 실행 (Merkle Proof)
- [ ] 리프 해시 로직 확정(백엔드 B3와 공유):  
  `bytes32 leaf = keccak256(abi.encodePacked(_cellId, _prizeTier, _salt));`
- [ ] `claimPrize(uint256 _sessionId, bytes32[] calldata _merkleProof, bytes32 _prizeId, uint256 _prizeTier, uint8 _cellId, bytes32 _salt)`
- [ ] `bytes32 userMerkleRoot = gameMerkleRoot[_sessionId]`
- [ ] `require(userMerkleRoot != 0, "Invalid session")`
- [ ] `require(!isPrizeClaimed[_prizeId], "Prize already claimed")`
- [ ] `bytes32 leaf = keccak256(abi.encodePacked(_cellId, _prizeTier, _salt))`
- [ ] `require(MerkleProof.verify(_merkleProof, userMerkleRoot, leaf), "Invalid proof")`
- [ ] `isPrizeClaimed[_prizeId] = true`
- [ ] 지급: `_mint(msg.sender, _prizeTier, 1, "")` *(tokenId = tier)*
- [ ] `emit PrizeClaimed(msg.sender, _prizeId, _prizeTier)`
- [ ] (선택) `uri(uint256 tokenId)` 오버라이드 *(IPFS 등 동적 URI)*

### 마일스톤 C4: 어드민 함수 및 배포
- [ ] `setTicketPrice(uint256 newPrice)` *(onlyOwner)*
- [ ] `withdrawFunds(address payable to)` *(onlyOwner)*
- [ ] `setURI(string memory newuri)` *(onlyOwner)*
- [ ] Foundry 테스트 *(B3/B5 연동 시나리오 포함)*
- [ ] 테스트넷(Sepolia 등) 배포
