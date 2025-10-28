# 기술 사양: EVM 그리드 갓챠 dApp (v6)

**문서 버전**: 1.1 (보안 및 명세 강화)
**기준 계획**: PLAN.md (v6 - Pre-generated Boards)
**작성자**: Tech PM (AI Agent)

---

## 1. 개요 (Overview)

본 문서는 7×7 그리드 기반 EVM 갓챠 dApp의 기술 사양을 정의합니다. 이 dApp은 **오프체인(Off-Chain) 게임 플레이**와 **온체인(On-Chain) 소유권 검증**을 결합한 하이브리드 아키텍처를 사용합니다.

### 핵심 메커니즘

**Merkle Proof 기반 검증**:
- 사용자는 오프체인(API)을 통해 가스비 없이 게임(뽑기, 힌트)을 플레이
- 온체인 트랜잭션은 다음 2가지 경우에만 발생:
  1. **티켓 구매**: Merkle Root 커밋
  2. **상품 수령**: Merkle Proof 검증

---

## 2. 대상 독자 (Audience)

- **AI 개발 에이전트**: 이 사양을 기반으로 실제 코드를 구현할 주체
- **프로젝트 관리자 (PM)**: 기술적 결정과 아키텍처를 이해하고 검토
- **QA / 테스터**: 시스템의 정상 동작을 검증하기 위한 플로우 및 API 참조

---

## 3. 아키텍처 (Architecture)

본 시스템은 3개의 독립적인 컴포넌트로 구성됩니다.

```
+---------------------+      +-------------------------+      +------------------+
|   Frontend (React)  |      |   Backend (Supabase)    |      |  Smart Contract  |
| (Vite, Privy, viem) |      | (Edge Functions, DB)    |      |  (EVM, Foundry)  |
+---------------------+      +-------------------------+      +------------------+
          |                            |                            |
          | 1. 로그인 (Privy)            |                            |
          |--------------------------->| 2. 유저 인증 (Privy JWT)   |
          | 3. 게임 시작 요청            |                            |
          |<---------------------------| 4. Merkle Root, SessionID |
          | 5. buyTicket(root, id)     |                            |
          |-------------------------------------------------------->| 6. Root 저장
          |                            |                            | 7. Event: TicketPurchased
          | 8. txHash 전송             |                            |
          |--------------------------->| 9. 영수증 검증 (viem)      |
          |<---------------------------| 10. Session 활성화 (DB)    |
          | 11. 뽑기 요청 (pull)        |                            |
          |<-------------------------->| 12. 티어 반환 (DB 조회)    |
          | 13. 클레임 프루프 요청      |                            |
          |<---------------------------| 14. Merkle Proof 생성     |
          | 15. claimPrize(proof,...)  |                            |
          |-------------------------------------------------------->| 16. Proof 검증
          |                            |                            | 17. ERC1155 민팅
          |                            |                            | 18. Event: PrizeClaimed
          | 19. txHash 전송            |                            |
          |--------------------------->| 20. 영수증 검증 (viem)     |
          |<---------------------------| 21. 클레임 상태 (DB)       |
```

### 3.1. 컴포넌트 1: 프론트엔드 (Frontend)

**설명**: 사용자 인터페이스(UI) 및 사용자 경험(UX)을 담당합니다.

**역할**:
- Privy를 통한 소셜/지갑 로그인 및 인증
- 게임 보드 렌더링 및 오프체인 게임 플레이 (API 호출)
- 온체인 트랜잭션 서명 및 전송 (viem, Privy useSendTransaction)

### 3.2. 컴포넌트 2: 백엔드 (Backend)

**설명**: Supabase를 사용하여 서버리스 백엔드를 구축합니다.

**역할**:
- **Database (PostgreSQL)**: 모든 게임 상태(보드, 세션, 클레임) 저장
- **Edge Functions (Deno/TypeScript)**: 모든 오프체인 비즈니스 로직 처리
  - (어드민) 보드 사전 생성 및 Merkle Root 계산
  - (사용자) start-session 시 보드 할당
  - (사용자) pull, hint 로직 수행
  - (사용자) claim-proof 요청 시 Merkle Proof 생성
- **Auth**: Supabase RLS (어드민 인증), Privy JWT (사용자 인증)
- **Event Listener**: Alchemy Notify 웹훅을 수신하여 GameSession 활성화 및 PrizeClaim 상태 업데이트

### 3.3. 컴포넌트 3: 스마트 컨트랙트 (Smart Contract)

**설명**: Foundry로 개발된 EVM 호환 Solidity 컨트랙트.

**역할**:
- **결제 및 검증(Trustless)**: buyTicket 시 Merkle Root 커밋, claimPrize 시 Merkle Proof 검증
- **자산 발행 (ERC1155)**: 검증 성공 시 ERC1155 토큰(Tier = Token ID) 민팅
- **소유권 및 자금 관리**: Ownable 기반

---

## 4. 기술 스택 (Tech Stack)

### 4.1. 프론트엔드 (Frontend)

#### Core Framework
- React 19
- Vite
- TypeScript

#### State Management
- **Jotai**: 전역 상태 관리
- **TanStack Query**: 서버 상태 관리
- **React Hook Form**: 폼 관리

#### UI & Styling
- **CSS Modules**: `.module.css`
- **React Spring**: 애니메이션
- **Radix UI**: Headless UI 컴포넌트

#### Blockchain & Auth
- **Privy** (`@privy-io/react-auth`): 지갑/소셜 로그인
- **viem**: 블록체인 상호작용

#### Utilities
- **ky**: HTTP 요청
- **date-fns**: 날짜 유틸
- **ramda**: 함수형 유틸
- **BigNumber.js**: 필요 시 숫자 처리
- **merkletreejs**: 클라이언트 프루프 검증용

### 4.2. 백엔드 (Backend)

- **Platform**: Supabase
- **Runtime**: Deno (Supabase Edge Functions)
- **Language**: TypeScript
- **Database**: PostgreSQL

#### Blockchain Utilities
- **merkletreejs**: Merkle Root/Proof 생성
- **keccak256**: 해시

#### 해시/솔트 명세
- **해시 명세**: `solidityPackedKeccak256(['uint8','uint8','bytes32'], [cellId, tier, salt])` (viem/ethers 호환)
- **Salt 명세**: `crypto.getRandomValues(new Uint8Array(32))`로 생성한 32바이트 0x-hex 문자열

### 4.3. 스마트 컨트랙트 (Smart Contract)

- **Language**: Solidity
- **Framework**: Foundry
- **Libraries**: OpenZeppelin Contracts (ERC1155, Ownable, MerkleProof)

### 4.4. DevOps 및 기타

- **Frontend Hosting**: Vercel
- **RPC Provider**: Alchemy 또는 Infura (트랜잭션 영수증 조회용)

---

## 5. 프로젝트 구조 (Monorepo)

본 프로젝트는 모노레포 구조로 구성되며, 각 컴포넌트가 독립적으로 개발 및 배포됩니다.

### 5.1. 전체 폴더 구조

```
pck/
├── frontend/          # React 프론트엔드 애플리케이션
│   ├── public/        # 정적 에셋
│   ├── src/
│   │   ├── lib/       # 유틸리티 (ky, date-fns, viem 클라이언트 등)
│   │   ├── data/      # Jotai atoms, 컨트랙트 ABI
│   │   ├── hooks/     # TanStack Query 훅, 커스텀 훅
│   │   ├── components/ # 재사용 UI 컴포넌트 (Radix 기반)
│   │   ├── pages/     # 메인 게임 페이지 (라우팅 단위)
│   │   ├── styles/    # 전역 CSS, 변수
│   │   └── main.tsx   # 앱 진입점
│   ├── package.json
│   └── vite.config.ts
├── backend/           # Supabase Edge Functions
│   ├── supabase/
│   │   ├── functions/ # Edge Functions (Deno/TypeScript)
│   │   │   ├── admin/ # 어드민 API
│   │   │   ├── game/  # 게임 플레이 API
│   │   │   └── verify/ # 영수증 검증 API
│   │   └── migrations/ # DB 마이그레이션
│   ├── package.json
│   └── deno.json
├── contract/          # Foundry 스마트 컨트랙트
│   ├── src/
│   │   └── GachaGame.sol
│   ├── test/
│   ├── script/
│   └── foundry.toml
├── shared/            # 공유 타입 정의 (TypeScript)
│   ├── src/
│   │   ├── types/     # API 요청/응답, DB 스키마 타입
│   │   │   ├── api.ts      # API 인터페이스
│   │   │   ├── database.ts # DB 스키마 타입
│   │   │   └── index.ts    # 타입 재export
│   │   ├── constants/ # 공유 상수
│   │   │   └── index.ts    # 티어 분포, 그리드 크기 등
│   │   ├── utils/     # 공유 유틸리티 함수
│   │   │   ├── merkle.ts   # Merkle 해시 함수
│   │   │   ├── validation.ts # 검증 함수
│   │   │   └── index.ts    # 유틸 재export
│   │   └── index.ts   # 전체 재export
│   ├── package.json
│   └── tsconfig.json
├── package.json       # 루트 패키지 (워크스페이스 설정)
├── pnpm-workspace.yaml
└── README.md
```

### 5.2. Shared 패키지

**목적**: 프론트엔드와 백엔드 간 타입 안정성 및 일관성 보장.

**주요 내용**:

#### 타입 정의 (`shared/src/types/`)
```typescript
// api.ts - API 요청/응답 타입
export interface StartSessionResponse {
  merkleRoot: string;
  sessionId: number;
}

export interface PullRequest {
  cellId: number;
  sessionId: number;
}

export interface PullResponse {
  tier: number;
}

// database.ts - DB 스키마 타입
export interface Board {
  boardId: string;
  prizeLayout: Cell[];
  merkleRoot: string;
  isAssigned: boolean;
}

export interface Cell {
  cellId: number;
  tier: number;
  salt: string;
}
```

#### 상수 (`shared/src/constants/`)
```typescript
export const TIER_DISTRIBUTION = {
  1: 1,
  2: 2,
  3: 6,
  4: 10,
  5: 18,
  6: 12,
} as const;

export const GRID_SIZE = 7;
export const TOTAL_CELLS = 49;
export const HINT_INTERVAL = 3;
```

#### 유틸리티 (`shared/src/utils/`)
```typescript
// merkle.ts
import { solidityPackedKeccak256 } from 'viem';

export function hashLeaf(
  cellId: number,
  tier: number,
  salt: string
): string {
  return solidityPackedKeccak256(
    ['uint8', 'uint8', 'bytes32'],
    [cellId, tier, salt]
  );
}
```

**사용 방법**:
```typescript
// frontend/src/api/game.ts
import type { StartSessionResponse, PullRequest } from '@pck/shared';
import { TIER_DISTRIBUTION } from '@pck/shared';

// backend/supabase/functions/start-session/index.ts
import type { StartSessionResponse } from '@pck/shared';
import { hashLeaf } from '@pck/shared';
```

### 5.3. 워크스페이스 설정

#### 루트 `package.json`
```json
{
  "name": "pck-monorepo",
  "private": true,
  "workspaces": [
    "frontend",
    "backend",
    "shared"
  ],
  "scripts": {
    "dev:frontend": "pnpm --filter frontend dev",
    "dev:backend": "pnpm --filter backend dev",
    "build:all": "pnpm --filter shared build && pnpm --filter frontend build && pnpm --filter backend build",
    "build:shared": "pnpm --filter shared build",
    "test:all": "pnpm --filter frontend test && pnpm --filter backend test",
    "typecheck:all": "pnpm --filter frontend typecheck && pnpm --filter backend typecheck && pnpm --filter shared typecheck"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

#### `pnpm-workspace.yaml`
```yaml
packages:
  - 'frontend'
  - 'backend'
  - 'shared'
```

#### Frontend `package.json` (일부)
```json
{
  "name": "frontend",
  "dependencies": {
    "@pck/shared": "workspace:*",
    "react": "^19.0.0",
    "viem": "^2.0.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --ext ts,tsx",
    "test": "vitest run"
  }
}
```

#### Backend `package.json` (일부)
```json
{
  "name": "backend",
  "dependencies": {
    "@pck/shared": "workspace:*"
  },
  "scripts": {
    "dev": "supabase start",
    "deploy": "supabase functions deploy",
    "typecheck": "deno check supabase/functions/**/*.ts"
  }
}
```

#### Shared `package.json`
```json
{
  "name": "@pck/shared",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "watch": "tsc --watch"
  },
  "dependencies": {
    "viem": "^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

> **참고**: pnpm은 npm 또는 yarn으로 대체 가능

---

## 6. 데이터 모델 (Database Schema)

> PLAN.md B2 기준 Supabase PostgreSQL 스키마

### Board

| 필드 | 타입 | 설명 |
|------|------|------|
| `boardId` | PK, uuid/bigint | 보드 고유 ID |
| `prizeLayout` | JSONB | `{cellId, tier, salt}` 49개 배열 (salt는 32바이트 0x-hex) |
| `merkleRoot` | text, UNIQUE | 이 보드의 머클 루트 |
| `isAssigned` | boolean, default: false | 사용자에게 할당되었는지 여부 |

### User

| 필드 | 타입 | 설명 |
|------|------|------|
| `address` | PK, text | 사용자 지갑 주소 |

### GameSession

| 필드 | 타입 | 설명 |
|------|------|------|
| `sessionId` | PK, bigint | 세션 ID (C2의 `_sessionId`와 일치) |
| `userAddress` | FK, text | User.address |
| `boardId` | FK, bigint, UNIQUE | Board.boardId (보드 1:1 세션 매핑) |
| `pullCount` | int, default: 0 | 뽑기 횟수 |
| `isActive` | boolean, default: false | 티켓 구매 온체인 확인 여부 |

### RevealedCell

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | PK, bigint | 자동 증가 ID |
| `sessionId` | FK, bigint | GameSession.sessionId |
| `cellId` | int | 칸 번호 (0–48) |
| `tier` | int | 티어 (1–6) |

> **권장 인덱스**: `CREATE UNIQUE INDEX ... ON "RevealedCell"(sessionId, cellId)`

### PrizeClaim

| 필드 | 타입 | 설명 |
|------|------|------|
| `prizeId` | PK, uuid | 클레임 고유 ID (이벤트 식별자용) |
| `userAddress` | FK, text | User.address |
| `tier` | int | 상품 티어 |
| `isClaimed` | boolean, default: false | 온체인 클레임 완료 여부 |
| `sessionId` | FK, bigint | GameSession.sessionId |
| `cellId` | int | 이 상품이 나온 칸 번호 |

---

## 7. API 엔드포인트 (Backend API)

> Supabase Edge Functions

### 7.1. 어드민 API (Admin)

#### `POST /api/admin/pre-generate-boards`

- **인증**: Supabase RLS (어드민 전용)
- **Body**: `{ count: number }`
- **기능**: count 개수만큼 보드(prizeLayout, merkleRoot)를 미리 생성하여 Board 테이블에 저장
- **응답**: `{ success: true, generated: count }`

#### `GET /api/admin/check`

- **인증**: Supabase RLS (어드민 전용)
- **기능**: 요청자 어드민 여부 확인
- **응답**: `{ isAdmin: true }`

### 7.2. 게임 플레이 API (Game)

#### `GET /api/game/start-session`

- **인증**: Privy JWT
- **기능**: DB 트랜잭션 내에서 `SELECT ... FOR UPDATE SKIP LOCKED` 또는 원자적 `UPDATE ... RETURNING`을 사용해 경합 없이 미사용 보드 1개를 안전 할당 후 `isAssigned=true`로 업데이트, GameSession 생성
- **응답**: `{ merkleRoot: string, sessionId: number }`
- **에러**: `NO_AVAILABLE_BOARDS` (모든 보드 소진)

#### `GET /api/game/board`

- **인증**: Privy JWT
- **기능**: 현재 사용자의 활성 GameSession에 연결된 RevealedCell 목록 조회 (JWT에서 주소 추출)
- **응답**: `{ boardId: number, revealedCells: [{ cellId: number, tier: number }] }`

#### `GET /api/game/user-state`

- **인증**: Privy JWT (JWT에서 사용자 주소 추출)
- **기능**: 현재 GameSession의 pullCount 조회
- **응답**: `{ pullCount: number }`

#### `GET /api/game/prizes`

- **인증**: Privy JWT (JWT에서 사용자 주소 추출)
- **기능**: 미청구(`isClaimed=false`) 상품 목록 조회
- **응답**: `[{ prizeId: string, tier: number, isClaimed: false }]`

#### `POST /api/game/pull`

- **인증**: Privy JWT
- **Body**: `{ cellId: number, sessionId: number }`
- **기능**: GameSession 활성 상태 검증, 중복 뽑기 검증 후 뽑기 실행. RevealedCell, GameSession(pullCount), PrizeClaim 레코드 삽입
- **응답**: `{ tier: number }`
- **에러**: `SESSION_NOT_ACTIVE`, `ALREADY_REVEALED`, `BOARD_COMPLETED` (pullCount >= 49)

#### `GET /api/game/hint`

- **인증**: Privy JWT
- **Query**: `sessionId: number`
- **기능**: `pullCount % 3 == 0` 검증 후, 미공개/미클레임 T4+, T5+ 셀 ID 반환 (주의: salt는 반환 금지)
- **응답**: `{ tier4PlusCell: number, tier5PlusCell: number }`
- **에러**: `HINT_NOT_AVAILABLE`

#### `GET /api/game/claim-proof`

- **인증**: Privy JWT
- **Query**: `prizeId: string`
- **기능**: prizeId 소유권 검증 후, Board.prizeLayout 기반 Merkle Tree 재생성 → merkleProof 반환
- **응답**: `{ merkleProof: string[], prizeId: string, prizeTier: number, cellId: number, salt: string, sessionId: number }`
- **에러**: `CLAIM_NOT_FOUND`, `ALREADY_CLAIMED`

### 7.3. 영수증 검증 API (Receipt Verification)

#### `POST /api/verify/ticket-purchase`

- **인증**: Privy JWT
- **Body**: `{ txHash: string, sessionId: number }`
- **기능**:
  - viem을 사용하여 트랜잭션 영수증(receipt) 조회
  - 영수증의 로그에서 `TicketPurchased` 이벤트 검증:
    - 이벤트가 우리 컨트랙트에서 발생했는지 확인
    - `sessionId`가 일치하는지 확인
    - `user` 주소가 JWT의 주소와 일치하는지 확인
  - 검증 성공 시 `GameSession.isActive=true` 업데이트
- **응답**: `{ success: true, isActive: true }`
- **에러**: `INVALID_RECEIPT`, `EVENT_NOT_FOUND`, `VERIFICATION_FAILED`

#### `POST /api/verify/prize-claim`

- **인증**: Privy JWT
- **Body**: `{ txHash: string, prizeId: string }`
- **기능**:
  - viem을 사용하여 트랜잭션 영수증(receipt) 조회
  - 영수증의 로그에서 `PrizeClaimed` 이벤트 검증:
    - 이벤트가 우리 컨트랙트에서 발생했는지 확인
    - `prizeId`가 일치하는지 확인
    - `user` 주소가 JWT의 주소와 일치하는지 확인
  - 검증 성공 시 `PrizeClaim.isClaimed=true` 업데이트
- **응답**: `{ success: true, isClaimed: true }`
- **에러**: `INVALID_RECEIPT`, `EVENT_NOT_FOUND`, `VERIFICATION_FAILED`

### 7.4. API 공통 사항 (Common)

**Rate Limiting**: 모든 사용자 API(특히 pull, hint, claim-proof)는 IP 및 지갑 주소(JWT) 기준 레이트리밋(예: 토큰 버킷) 적용

---

## 8. 스마트 컨트랙트 인터페이스 (ABI)

> PLAN.md C1–C4 기준

### 8.1. 상태 변수 (Public)

```solidity
mapping(uint256 => bytes32) public gameMerkleRoot;        // sessionId => merkleRoot
mapping(bytes32 => bool) public isClaimedBySessionCell;   // keccak256(sessionId, cellId) => claimed
uint256 public ticketPrice;                               // 단위: wei
address public owner;
```

### 8.2. 이벤트 (Events)

```solidity
event TicketPurchased(address indexed user, uint256 indexed sessionId, bytes32 merkleRoot);
event PrizeClaimed(address indexed user, bytes32 indexed prizeId, uint256 prizeTier);
```

### 8.3. 함수 (Functions)

#### User Functions

```solidity
function buyTicket(bytes32 _merkleRoot, uint256 _sessionId) external payable;

function claimPrize(
  uint256 _sessionId,
  bytes32[] calldata _merkleProof,
  bytes32 _prizeId,
  uint256 _prizeTier,
  uint8 _cellId,
  bytes32 _salt
) external;
```

**내부 로직 (참고)**:
```solidity
bytes32 leaf = keccak256(abi.encodePacked(uint8(_cellId), uint8(_prizeTier), bytes32(_salt)));
bytes32 claimKey = keccak256(abi.encodePacked(_sessionId, _cellId));
require(MerkleProof.verify(_merkleProof, root, leaf), "Invalid proof");
require(!isClaimedBySessionCell[claimKey], "Already claimed");
```

#### Admin Functions

```solidity
function setTicketPrice(uint256 _newPrice) external onlyOwner;
function withdrawFunds(address payable _to) external onlyOwner;
function setURI(string memory newuri) external onlyOwner;  // ERC1155
```

#### ERC1155 View

```solidity
function uri(uint256 _tokenId) public view override returns (string memory);
```

---

## 9. 핵심 사용자 플로우 (Key Flows)

### 9.1. 관리자 – 보드 생성 (B3)

1. 어드민이 `POST /api/admin/pre-generate-boards` (예: 100개) 호출
2. 백엔드가 100개 보드(prizeLayout, merkleRoot) 생성
3. Board 테이블에 `isAssigned=false`, `merkleRoot (UNIQUE)`로 저장

### 9.2. 사용자 – 게임 시작 (B4, C2)

#### 세션 시작 및 보드 할당

1. **(F)** '게임 시작' 클릭 → `GET /api/game/start-session`
2. **(B)** 미사용 보드 1개 안전 할당(원자 쿼리), GameSession 생성 (boardId UNIQUE)
3. **(B)** `{merkleRoot, sessionId}` 반환

#### 티켓 구매 (온체인)

4. **(F)** `buyTicket(merkleRoot, sessionId)` 트랜잭션 전송
5. **(C)** `gameMerkleRoot[sessionId] = merkleRoot` 저장, `TicketPurchased` 이벤트 발생

#### 영수증 검증 (오프체인)

6. **(F)** 트랜잭션 완료 후 `txHash` 획득
7. **(F)** `POST /api/verify/ticket-purchase` ({txHash, sessionId}) 호출
8. **(B)** viem으로 영수증 조회 및 `TicketPurchased` 이벤트 검증:
   - 컨트랙트 주소 확인
   - sessionId 일치 확인
   - user 주소 일치 확인
9. **(B)** 검증 성공 시 `GameSession.isActive=true` 업데이트
10. **(F)** 뽑기 가능 상태로 전환

### 9.3. 사용자 – 뽑기 (B4)

1. **(F)** 셀 클릭 → `POST /api/game/pull` ({cellId, sessionId})
2. **(B)** `isActive` 검증 → Board.prizeLayout에서 tier 조회
3. **(B)** RevealedCell, PrizeClaim, pullCount 업데이트
4. **(B)** `{tier}` 반환 → **(F)** UI Flip 애니메이션

### 9.4. 사용자 – 상품 수령 (B5, C3)

#### 클레임 프루프 요청

1. **(F)** '클레임' 클릭 (예: `prizeId="uuid-123"`)
2. **(F)** `GET /api/game/claim-proof?prizeId=uuid-123`
3. **(B)** 소유권 검증 → Merkle Tree 재생성 → merkleProof 생성
4. **(B)** 프루프 반환

#### 온체인 클레임

5. **(F)** `claimPrize(proof, ...)` 트랜잭션 전송
6. **(C)** 리프 검증 및 `MerkleProof.verify()` 통과
7. **(C)** `claimKey = keccak256(sessionId, cellId)` 확인
8. **(C)** `isClaimedBySessionCell[claimKey]=true` 설정
9. **(C)** `_mint()` (ERC1155), `PrizeClaimed` 이벤트 발생

#### 영수증 검증

10. **(F)** 트랜잭션 완료 후 `txHash` 획득
11. **(F)** `POST /api/verify/prize-claim` ({txHash, prizeId}) 호출
12. **(B)** viem으로 영수증 조회 및 `PrizeClaimed` 이벤트 검증:
    - 컨트랙트 주소 확인
    - prizeId 일치 확인
    - user 주소 일치 확인
13. **(B)** 검증 성공 시 `PrizeClaim.isClaimed=true` 업데이트
14. **(F)** prizes 쿼리 무효화 (UI 갱신)

---

## 10. 보안 및 검증 (Security)

### 10.1. 게임 무결성

- **Merkle Proof 검증**: `MerkleProof.verify()`로 백엔드 prizeLayout 조작 불가를 온체인 검증

### 10.2. 사용자 인증

- **API 인증**: 모든 API는 Privy JWT로 인증 (IDOR 방지)
- **JWT 주소 추출**: JWT에서 사용자 주소를 추출하여 소유권 검증

### 10.3. 어드민 인증

- **Supabase RLS**: Supabase RLS/정책으로 어드민 엔드포인트 보호

### 10.4. 재청구 방지 (핵심)

- **온체인 중복 방지**: 컨트랙트 `isClaimedBySessionCell`로 `keccak256(sessionId, cellId)` 기준 중복 클레임 차단
- **prizeId 용도**: prizeId는 오프체인 식별/이벤트용

### 10.5. 세션 보안

- **sessionId ↔ merkleRoot 매핑**: buyTicket 시 sessionId ↔ merkleRoot 1:1 매핑
- **활성 세션 검증**: `GameSession.isActive`로 티켓 구매 세션만 pull 허용

### 10.6. 보드 재사용 방지

- **UNIQUE 제약**: `Board.merkleRoot`, `GameSession.boardId`에 UNIQUE 제약으로 보드 1회성 할당 강제

### 10.7. 영수증 검증 보안 (Receipt Push)

- **직접 검증**: 백엔드가 viem으로 영수증을 직접 조회하여 이벤트 검증
- **다중 검증**:
  - 컨트랙트 주소 일치 확인
  - 이벤트 파라미터 일치 확인 (sessionId, prizeId 등)
  - 사용자 주소 일치 확인 (JWT vs 이벤트)
- **프론트엔드 신뢰 배제**: 프론트엔드가 보낸 값은 신뢰하지 않고, 영수증 로그만 검증

---

## 11. 테스트 전략 (Testing)

### 11.1. 스마트 컨트랙트 (Foundry)

- **Merkle Proof 검증**: 성공/실패 케이스
- **buyTicket 중복 방어**: 중복 sessionId 방어
- **claimPrize 재청구 방지 (핵심)**: 중복 셀(sessionId, cellId) 재청구 방지
- **Ownable 접근 제어**: 권한 검증
- **고정 테스트 벡터**: cellId=0, tier=1, salt=0x... → leaf/root 일치 검증

### 11.2. 백엔드 (Supabase Edge Functions)

- **createBoard 유틸**: 티어 분포, 해시 로직 (컨트랙트 C3와 1:1)
- **API 단위 테스트**: 인증 미들웨어 포함
- **DB 트랜잭션 테스트**: start-session 롤백/경합 테스트
- **claim-proof 검증**: 리프/루트 일치 검증
- **영수증 검증 테스트**:
  - viem 영수증 조회 로직
  - 이벤트 파싱 및 검증 로직
  - 잘못된 영수증/이벤트 거부

### 11.3. 프론트엔드 (Vite/Vitest)

- **react-query 훅**: 상태 관리 및 서버 상태 동기화
- **Jotai 상태 변경**: 전역 상태 관리
- **MSW 기반 API Mocking**: API 모킹 및 테스트
- **react-spring 애니메이션**: 애니메이션 렌더링
- **Privy useSendTransaction**: 로딩/성공/실패 처리
- **영수증 푸시 플로우**: 트랜잭션 → 영수증 획득 → API 호출 시퀀스

---

## 12. 배포 (Deployment)

### 12.1. 스마트 컨트랙트

- **배포 도구**: Foundry 스크립트
- **타겟 네트워크**: Sepolia 테스트넷

### 12.2. 백엔드

- **배포 도구**: Supabase CLI
- **배포 대상**:
  - Edge Functions
  - DB 마이그레이션
- **필요 환경 변수**:
  - RPC URL (viem용)
  - 컨트랙트 주소
  - Privy App Secret (JWT 검증용)

### 12.3. 프론트엔드

- **호스팅**: Vercel
- **환경 변수**:
  - `VITE_SUPABASE_URL`: Supabase URL
  - `VITE_SUPABASE_ANON_KEY`: Supabase Anonymous Key
  - `VITE_CONTRACT_ADDRESS`: 컨트랙트 주소
  - `VITE_PRIVY_APP_ID`: Privy App ID
  - `VITE_CHAIN_ID`: 체인 ID (Sepolia: 11155111)
  - `VITE_RPC_URL`: RPC URL

---

## 부록: 아키텍처 변경 사항

### Alchemy Notify → Receipt Push 방식

**기존 (Alchemy Notify)**:
- Alchemy Notify 웹훅을 통한 이벤트 리스닝
- 웹훅 엔드포인트 필요
- Alchemy 서명 검증 필요

**변경 (Receipt Push)**:
- 프론트엔드가 트랜잭션 완료 후 txHash를 백엔드에 전송
- 백엔드가 viem으로 영수증을 직접 조회
- 영수증의 로그에서 이벤트를 검증
- 외부 웹훅/스트리밍 불필요

**장점**:
- 외부 의존성 제거
- 지연/재시도 로직 단순화
- 직접적인 검증으로 보안 강화

**보안 강화**:
- 프론트엔드가 보낸 값은 신뢰하지 않음
- 영수증의 로그를 직접 검증하여 이벤트 발생 확인
- 컨트랙트 주소, 파라미터, 사용자 주소 다중 검증