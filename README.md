# PCK - EVM Grid Gacha dApp

7×7 그리드 기반 EVM 갓챠 dApp 프로젝트

## 프로젝트 개요

**목표**: 오프체인 로직 + 온체인 검증(Merkle Proof) 방식의 갓챠 게임

**핵심 아키텍처**:
- 프론트엔드(React): UI/UX, Privy 지갑 연동
- 백엔드(Supabase): 게임 로직, Receipt Push 방식 검증
- 컨트랙트(Solidity): 결제 및 검증, ERC1155 기반
- Shared(TypeScript): 타입 정의 및 유틸리티 공유

## 모노레포 구조

```
pck/
├── frontend/          # React 프론트엔드 (Vite, viem, react-query)
├── backend/           # Supabase Edge Functions (Deno)
├── contract/          # Foundry 스마트 컨트랙트 (Solidity)
├── shared/            # 공유 TypeScript 패키지
└── docs/              # 프로젝트 문서
    ├── PLAN.md               # 구현 계획 및 마일스톤
    ├── TECHSPEC.md           # 기술 스펙
    ├── TESTING_POLICY.md     # 테스팅 전략 (전체)
    └── TESTING_SHARED.md     # Shared 패키지 테스팅 가이드
```

## 시작하기

### 필수 요구사항

- Node.js 18+
- pnpm 8+
- Foundry (contract 개발용)
- Supabase CLI (backend 개발용)

### 개발 환경 설정

각 패키지는 독립적으로 개발 및 배포됩니다:

```bash
# Shared 패키지
cd shared
pnpm install
pnpm build

# Frontend
cd frontend
pnpm install
pnpm dev

# Backend
cd backend
pnpm install
supabase start

# Contract
cd contract
forge install
forge test
```

## 게임 메커니즘

### 1. 보드 사전 생성 (Admin, Off-Chain)
- 어드민이 보드 생성 (prizeLayout + merkleRoot)
- DB에 저장 (isAssigned=false)

### 2. 게임 시작 (Off-Chain + On-Chain)
- 백엔드에서 미사용 보드 할당
- 프론트엔드가 merkleRoot로 buyTicket() 호출
- Receipt Push로 검증 후 세션 활성화

### 3. 게임 플레이 (Off-Chain)
- 셀 클릭 → 백엔드 pull API 호출
- tier 반환 → UI 업데이트
- 3회마다 힌트 제공

### 4. 상품 수령 (On-Chain)
- 백엔드에서 merkleProof 생성
- 프론트엔드가 claimPrize() 호출
- Receipt Push로 검증 후 claim 처리

### 상품 분포 (7×7 = 49칸)

| Tier | 개수 | 등급 |
|------|------|------|
| 1    | 1    | 최상 |
| 2    | 2    | 상   |
| 3    | 6    | 중상 |
| 4    | 10   | 중   |
| 5    | 18   | 중하 |
| 6    | 12   | 하   |

## 문서

- **[PLAN.md](docs/PLAN.md)**: 전체 구현 계획 및 체크리스트
- **[TECHSPEC.md](docs/TECHSPEC.md)**: 상세 기술 스펙
- **[TESTING_POLICY.md](docs/TESTING_POLICY.md)**: 프로젝트 테스팅 전략
- **[TESTING_SHARED.md](docs/TESTING_SHARED.md)**: Shared 패키지 테스팅

## 개발 원칙

### TDD (Test-Driven Development)

**중요한 비즈니스 로직에만 적용**:
- RED → GREEN → REFACTOR
- 간단한 코드는 TDD 생략
- 상세 내용: [TESTING_POLICY.md](docs/TESTING_POLICY.md)

### 코드 품질

- TypeScript Strict Mode 사용
- 타입 안정성 최우선
- 컴파일러 경고 0개 유지

### 커밋 규칙

- 테스트 통과 시에만 커밋
- 타입체크 통과 필수
- 구조 변경과 기능 변경 분리 (Tidy First)

## 스크립트

```bash
# Shared 패키지 빌드
cd shared && pnpm build

# Frontend 개발 서버
cd frontend && pnpm dev

# Backend 로컬 개발
cd backend && supabase start

# Contract 테스트
cd contract && forge test

# 전체 타입 체크 (각 폴더에서 실행)
cd shared && pnpm typecheck
cd frontend && pnpm typecheck
cd backend && pnpm typecheck
```

## 브랜치 전략

- `main`: 프로덕션 배포 브랜치
- `develop`: 개발 통합 브랜치
- `feature/*`: 기능 개발 브랜치

## 기술 스택

### Frontend
- React 18 + TypeScript
- Vite
- TailwindCSS
- viem (Ethereum)
- react-query (Data fetching)
- Privy (Wallet/Auth)

### Backend
- Supabase (PostgreSQL + Edge Functions)
- Deno Runtime
- viem (Receipt verification)

### Contract
- Solidity 0.8.x
- Foundry
- OpenZeppelin (ERC1155, Ownable, MerkleProof)

### Shared
- TypeScript 5.x
- viem (Merkle utilities)

## 배포

### Frontend
- Vercel 배포
- 환경 변수: Supabase URL/Key, Contract 주소, Privy App ID

### Backend
- Supabase Cloud
- Edge Functions 자동 배포

### Contract
- 테스트넷(Sepolia) 먼저 배포
- 메인넷 배포 전 감사 필요

## 라이선스

Private - 상업용 프로젝트

## 기여

1. 이슈 생성 또는 확인
2. 기능 브랜치 생성
3. 구현 및 테스트
4. PR 생성
5. 코드 리뷰 후 머지

---

**문서 참조**: 구현 전 반드시 [docs/PLAN.md](docs/PLAN.md)와 [docs/TESTING_POLICY.md](docs/TESTING_POLICY.md)를 확인하세요.
