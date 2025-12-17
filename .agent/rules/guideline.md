---
trigger: always_on
---

# Project Development Guidelines & System Protocol

이 문서는 AI 페르소나 행동 수칙과 프로젝트 개발 표준(Next.js, Code Quality, Git Workflow - Epic Strategy)을 정의합니다.

---

## 0. Behavioral Protocols (AI 행동 수칙)
**CRITICAL:** 아래 수칙을 엄격히 준수하십시오.

1.  **Language:** 모든 응답은 **한국어(Korean)**로 작성합니다.
2.  **Tone & Style:**
    * **No Flattery:** "네, 알겠습니다", "좋은 질문입니다" 같은 빈말을 생략하고 즉시 핵심 내용/코드로 시작합니다.
    * **High Efficiency:** 명확한 논리에 기반한 설명을 지향합니다.
3.  **Critical Thinking & Planning:**
    * **Plan First:** 코드를 작성하기 전에 반드시 **구현 계획(Step-by-Step)**이나 **의사코드(Pseudo-code)**를 먼저 설명하고 진행합니다.
    * **Constructive Critique:** 비효율적인 접근 방식에 대해 반드시 **이유**와 함께 **더 나은 대안**을 제시합니다.
    * **Neutrality:** 장단점을 객관적으로 분석합니다.

---

## 1. Tech Stack & Version Control
명시된 기술 스택과 버전을 엄격히 준수합니다.

* **Framework:** `Next.js 14+ (App Router)` - **Pages Router 사용 금지.**
* **Language:** `TypeScript 5+` (Strict Mode).
* **Styling:** `Tailwind CSS` (권장), `CSS Modules`. (Arbitrary values `w-[10px]` 지양)
* **State Management:**
    * Client: `Zustand`
    * Server: `React Query (TanStack Query)`
* **Package Manager:** `npm` or `pnpm` (프로젝트 설정 따름).

---

## 2. Project Structure & Naming (New)
파일 생성 및 네이밍 시 아래 규칙을 따릅니다.

1.  **Directory Structure:**
    * 모든 소스 코드는 `src/` 디렉토리 하위에서 관리합니다.
    * 기능별로 폴더를 응집도 있게 구성합니다 (Colocation).
    * `src/components/ui`: 재사용 가능한 기본 UI 컴포넌트.
    * `src/features/<feature-name>`: 특정 기능과 관련된 컴포넌트, 훅, 스토어 모음.
2.  **Import Path:**
    * 상대 경로(`../../`) 대신 **절대 경로(`@/...`) Alias**를 사용합니다.
3.  **Naming Convention:**
    * **Components:** `PascalCase` (예: `UserProfile.tsx`)
    * **Functions/Hooks:** `camelCase` (예: `useAuth.ts`, `fetchUser`)
    * **Constants:** `UPPER_SNAKE_CASE` (예: `API_TIMEOUT`)
    * **Files:** 컴포넌트는 `PascalCase.tsx`, 그 외(유틸, 훅)는 `camelCase.ts`를 권장합니다.

---

## 3. Next.js & Architecture Philosophy
**Framework Mode:** `Next.js App Router`

1.  **Component Strategy:**
    * **Logic/View Separation:** 비즈니스 로직은 Custom Hook(또는 Store)으로 분리하고, View 컴포넌트는 UI 렌더링에 집중합니다.
    * **Context API (Composition):** 전역 상태가 아닌 도메인별 상태(Sidebar 등)는 Context API와 Hook 조합을 통해 Prop Drilling을 방지합니다.
    * **Server/Client Components:** 기본적으로 Server Component를 유지하고, 인터랙션이 필요한 경우에만 `"use client"`를 최상단에 선언합니다.
2.  **State Management Guidelines:**
    * **Global Client State:** `Zustand` 사용. 파일명은 `store/outliner.ts` 처럼 명사형 권장.
    * **Server State:** 데이터 페칭은 `useEffect` 대신 반드시 `React Query`를 사용합니다.

---

## 4. Code Quality & Implementation Standards
1.  **TypeScript:**
    * 명시적인 `interface` 또는 `type`을 사용합니다.
    * `any` 타입 사용은 **엄격히 금지**됩니다. (제네릭이나 `unknown` 활용)
2.  **Syntax & Patterns:**
    * **Early Return:** 중첩된 `if`문 대신 조기 리턴(Guard Clause)을 사용하여 가독성을 높입니다.
    * **Arrow Functions:** 컴포넌트 및 함수 선언 시 화살표 함수(`const App = () => {}`)를 선호합니다.
    * **Immutability:** 불변성을 유지하며, 배열/객체 조작 시 전개 연산자(`...`)나 배열 메서드(`map`, `filter`)를 사용합니다.
3.  **Clean Code:**
    * **Single Responsibility:** 함수와 컴포넌트는 하나의 역할만 수행하도록 리팩토링합니다.
    * **Legacy Management:** 더 이상 사용하지 않는 주석이나 코드는 즉시 삭제합니다 (`git`이 있으므로 보존 불필요).
4.  **Abstraction & Stability:**
    * **High Abstraction:** 코드는 구체적인 구현보다 **높은 레벨의 추상화**를 지향합니다.
    * **Preserve Working Code:** **기존에 정상 작동하는 코드는 최대한 건드리지 않습니다.**
    * **Separate First, Then Modify:** 기존 로직 수정 시, **코드를 먼저 분리(Isolation)**하여 영향 범위를 격리한 후 수정합니다.

---

## 5. Git Workflow & Branch Strategy (Epic Branch Strategy)

### 5.1 Overview
대규모 기능(Epic)과 개별 작업(Task)을 구분하여 형상 관리.

### 5.2 Branch Hierarchy
1.  **`develop`**: Main Integration Branch.
2.  **`epic/<topic>`**: Feature Integration Branch. (예: `epic/editor`)
3.  **`feat/issue-<id>/<desc>`**: Task Branch. (Base: `epic/...` or `develop`)

### 5.3 Integration Workflow
1.  **Start:** `origin` Fetch 및 Base 브랜치 최신화.
2.  **Work:** `feat/issue-...` 브랜치 생성 및 작업.
3.  **PR:** Base 브랜치로 PR 생성 (Title: `TYPE(scope): Title`).
4.  **Merge:** Squash Merge 권장.

---

## 6. Negative Constraints (Don'ts)
**다음 사항은 절대 하지 마십시오.**

* ❌ **Don't use `default export`:** 리팩토링 편의성을 위해 Named Export(`export const ...`)를 사용합니다. (Page 파일 제외)
* ❌ **Don't use `useEffect` for Data Fetching:** 비동기 데이터 호출은 React Query나 SWR을 사용합니다.
* ❌ **Don't leave `console.log`:** 디버깅 코드는 커밋 전에 삭제합니다.
* ❌ **Don't create generic names:** `data`, `info`, `temp` 같은 모호한 변수명을 피합니다.

---

## 7. Commit Convention
* **Format:** `TYPE(scope): English imperative title`
* **Body:** **한국어(Korean)**로 핵심 변경 내용 개조식 기술.
* **Types:** `FEAT`, `FIX`, `CHORE`, `REFACTOR`, `DOCS`, `STYLE`, `TEST`
* **Example:**
    ```text
    REFACTOR(sidebar): Decompose logic and state

    - SidebarContext 도입 및 Hook 분리 (useSidebarSelection 등)
    - getSortedChildren 성능 최적화 (O(1))
    ```