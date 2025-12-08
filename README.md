# Own Outliner

**React**, **TypeScript**, **Zustand**로 구축된 고성능 **로컬 우선(Local-First) 아웃라이너**입니다.
Dynalist와 Workflowy에서 영감을 받아, 마우스 없이 키보드만으로 생각의 속도에 맞춰 정리할 수 있는 도구를 지향합니다.

## 📚 기술 스택 (Tech Stack)
- **Core**: React 19, TypeScript
- **State**: Zustand (Normalized Flat State Architecture - 평탄화된 정규화 데이터 구조)
- **Styling**: Tailwind CSS v4
- **Persistence**: LocalStorage (새로고침 해도 데이터 유지)
- **Bundler**: Vite

---

## 🎮 단축키 및 핵심 기능 (Keymap & Features)

### 1. 기본 편집 (Basic Editing)
- **엔터 (Enter)**: 새 노드 생성 / (문장 중간에서) 노드 나누기.
- **백스페이스 (Backspace)**: 빈 노드 삭제 / (문장 맨 앞에서) 앞 노드와 병합.
- **탭 (Tab)**: 들여쓰기 (Indent) - 현재 노드를 위쪽 형제 노드의 자식으로 이동.
- **Shift + 탭 (Shift + Tab)**: 내어쓰기 (Outdent) - 현재 노드를 부모 수준으로 이동.

### 2. 네비게이션 및 구조 변경 (Navigation & Structure)
- **↑ / ↓**: 커서 상하 이동.
- **Alt + ↑ / ↓**: **순서 변경 (Reorder)** - 현재 노드를 위/아래 형제와 교환.
- **Ctrl + A**: **지능형 선택 (Smart Selection)** - 텍스트 전체 -> 현재 노드 -> 하위 포함(Branch) -> 전체 순으로 확장.
- **Ctrl + . (Period)**: **줌 인 (Zoom In)** - 현재 노드를 루트(Root)로 집중 보기.
- **Ctrl + , (Comma)**: **줌 아웃 (Zoom Out)** - 상위 레벨로 이동.

### 3. 심화 기능 제안 (Dynalist Inspired Features)
*다음 기능들은 개발 로드맵에 포함되어 있으며 순차적으로 구현 예정입니다.*

#### ✍️ 리치 콘텐츠
- **노트 (Note)**: `Shift + Enter`로 불렛 포인트 아래에 상세 설명(작은 텍스트) 추가.
- **체크박스 (Status)**: `Ctrl + Enter`로 항목 완료 처리(취소선) 및 완료된 항목 숨기기.
- **태그 및 링크**: `#태그` 지원 및 `[[` 위키 스타일 링크.

#### 🗂 정리 및 이동
- **이동 (Move Item)**: `Ctrl + Shift + M`으로 특정 노드를 검색하여 즉시 이동.
- **브레드크럼 (Breadcrumbs)**: 줌 인 상태에서 현재 위치 경로 표시 및 네비게이션.
- **클립보드**: 하위 노드가 포함된 상태로 복사/붙여넣기 및 스마트 텍스트 파싱.

#### ⚙️ 데이터 관리
- **OPML 내보내기/가져오기**: 기존 아웃라이너(Workflowy/Dynalist)와의 호환성 확보.
- **검색 및 필터**: 실시간 텍스트 필터링.

---

## 🚀 개발 로드맵 (Development Roadmap)

### Phase 1: 핵심 엔진 (✅ 완료)
- [x] 프로젝트 초기 설정 (Vite + React + TS + Tailwind v4)
- [x] 데이터 아키텍처 설계 (Flat Dictionary 구조: O(1) 성능)
- [x] 기본 조작 구현 (Add, Delete, Indent, Outdent)
- [x] 데이터 영속성 (LocalStorage)

### Phase 2: 고급 상호작용 (🚧 현재 진행 중)
- [ ] **순서 변경 (Alt + Up/Down)**: 즉각적인 형제 노드 교체 로직.
- [ ] **지능형 선택 (Ctrl + A)**: 단계별 선택 로직 구현.
- [ ] **줌 인/아웃 (Hoisting)**: 화면 렌더링 루트를 동적으로 변경하는 기능.
- [ ] **노드 분할/병합**: 텍스트 중간에서 Enter/Backspace 동작 정교화.

### Phase 3: UX 고도화 (Polish)
- [ ] **다중 선택**: Shift + Arrow로 여러 줄 선택 및 일괄 이동/삭제.
- [ ] **드래그 앤 드롭**: 마우스를 이용한 직관적인 이동.
- [ ] **애니메이션**: 부드러운 이동 트랜지션.

### Phase 4: 확장성 (Scalability)
- [ ] **가상화 (Virtualization)**: 10,000개 이상의 노드에서도 끊김 없는 스크롤.
- [ ] **실행 취소/다시 실행 (Undo/Redo)**: 히스토리 스택 관리.
