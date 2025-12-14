# Own Outliner

**React**, **TypeScript**, **Zustand**로 구축된 고성능 **로컬 우선(Local-First) 아웃라이너**입니다.
Dynalist와 Workflowy에서 영감을 받아, 마우스 없이 키보드만으로 생각의 속도에 맞춰 정리할 수 있는 도구를 지향합니다.

## 기술 스택 (Tech Stack)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-443E38?style=for-the-badge&logo=react&logoColor=bear)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri-FFC131?style=for-the-badge&logo=tauri&logoColor=black)

---

##  단축키 및 핵심 기능 (Keymap & Features)

### 1. 기본 편집 (Basic Editing)
- 엔터 (Enter): 새 노드 생성 / (문장 중간에서) 노드 나누기.
- 백스페이스 (Backspace): 빈 노드 삭제 / (문장 맨 앞에서) 앞 노드와 병합.
- 탭 (Tab): 들여쓰기 (Indent) - 현재 노드를 위쪽 형제 노드의 자식으로 이동.
- Shift + 탭 (Shift + Tab): 내어쓰기 (Outdent) - 현재 노드를 부모 수준으로 이동.

### 2. 네비게이션 및 구조 변경 (Navigation & Structure)
- ↑ / ↓: 커서 상하 이동.
- Alt + ↑ / ↓: 순서 변경 (Reorder) - 현재 노드를 위/아래 형제와 교환.
- Ctrl + A: 지능형 선택 (Smart Selection) - 텍스트 전체 -> 현재 노드 -> 하위 포함(Branch) -> 전체 순으로 확장.
- Ctrl + . (Period): 줌 인 (Zoom In) - 현재 노드를 루트(Root)로 집중 보기.
- Ctrl + , (Comma): 줌 아웃 (Zoom Out) - 상위 레벨로 이동.

### 3. 심화 기능 제안 (Dynalist Inspired Features)
*다음 기능들은 개발 로드맵에 포함되어 있으며 순차적으로 구현 예정입니다.*

#### 리치 콘텐츠
- 노트 (Note): `Shift + Enter`로 불렛 포인트 아래에 상세 설명(작은 텍스트) 추가.
- 체크박스 (Status): `Ctrl + Enter`로 항목 완료 처리(취소선) 및 완료된 항목 숨기기.
- 태그 및 링크: `#태그` 지원 및 `[[` 위키 스타일 링크.

#### 정리 및 이동
- 이동 (Move Item): `Ctrl + Shift + M`으로 특정 노드를 검색하여 즉시 이동.
- 브레드크럼 (Breadcrumbs): 줌 인 상태에서 현재 위치 경로 표시 및 네비게이션.
- 클립보드: 하위 노드가 포함된 상태로 복사/붙여넣기 및 스마트 텍스트 파싱.

#### 데이터 관리
- OPML 내보내기/가져오기: 기존 아웃라이너(Workflowy/Dynalist)와의 호환성 확보.
- 검색 및 필터: 실시간 텍스트 필터링.

---

## 개발 로드맵 (Development Roadmap)

### Phase 1: 핵심 엔진 (완료)
- [x] 프로젝트 초기 설정 (Vite + React + TS + Tailwind v4)
- [x] 데이터 아키텍처 설계 (Flat Dictionary 구조: O(1) 성능)
- [x] 기본 조작 구현 (Add, Delete, Indent, Outdent)
- [x] 데이터 영속성 (LocalStorage)

### Phase 2: 고급 상호작용 (완료)
- [x] 순서 변경 (Alt + Up/Down): 즉각적인 형제 노드 교체 로직.
- [x] 지능형 선택 (Ctrl + A): 단계별 선택 로직 구현.
- [x] 줌 인/아웃 (Hoisting): 화면 렌더링 루트를 동적으로 변경하는 기능.
- [x] 스마트 붙여넣기 (Smart Paste): 텍스트 붙여넣기 시 들여쓰기 구조 자동 인식 (완료).
- [x] 논리적 노드 복사/붙여넣기: Ctrl+A로 선택된 노드 자체를 구조적으로 복사/이동.

### Phase 3: UX 고도화 (Polish)
- [x] 다중 선택: Shift + Arrow로 여러 줄 선택.
- [x] 다중 삭제: Backspace/Delete로 선택된 노드 일괄 삭제.
- [x] 실행 취소/다시 실행 (Undo/Redo): zundo를 활용한 데이터 및 포커스 상태 복구.
- [x] 검색 (Search): Cmd + P로 전역 검색 및 빠른 이동.
- [ ] 드래그 앤 드롭: 마우스를 이용한 직관적인 이동.
- [ ] 애니메이션: 부드러운 이동 트랜지션.

### Phase 4: 확장성 (Scalability)
- [x] 가상화 (Virtualization): react-virtuoso를 도입하여 대용량 노드 렌더링 성능 최적화.
- [ ] OPML 내보내기/가져오기: 백업 및 다른 아웃라이너와의 호환성.

### Phase 5: 확장성 (Scalability)
- [ ] OPML 내보내기/가져오기: 백업 및 다른 아웃라이너와의 호환성.

### FIX
- [x] break line login
    - node의 맨앞에서는 현재 노드의 위에 생겨야 함
- [x] 슬래쉬 (/)가 생겼을 때 포커스 깨짐
- [x] 최상단의 라인이 지워지면 커서가 포커스를 잃어버림
    - 포커스를 다음 노드로 이전시킬것
- [x] 제목에 올라가면 다시 못내려옴 
- [x] undo/redo
- [x] 인라인 포매팅 (md-like)
- [ ] internal link
    - [[uuid || 문서이름]]
    - ((node's uuid))
    - 위로 그냥 다른 문법으로 쓰고 랜더링만 덮어씌우는게 좋을지도

### TODO
- [ ] logical indentation
- [ ] 노드 이동 알고리즘 수정
- [ ] 메모 추가
- [ ] 노드내 개행
- [ ] 노드에 긴줄 쓰기

- [ ] 브래드 크럼블
- [ ] 파일 구조 고민 (later)
    - [ ] 메모 추가하거나 하면 일반적인 md로는 커버가 안됨
    - [ ] 이것도 문서 링크로 처리를 해야 할까?
        - [ ] 문서 링크이되 바로 보이는 구조?
- [ ] 도큐먼트 확장 추가
    - [ ] 모든 도큐먼트가 저장되는 폴더 존재
- [ ] 코드 블록
    - [ ] 인라인 코드 블록

- [ ] daily journal 기능 추가
    -  side bar에 색셔닝
- [ ] ---나 ~~~로 vertical line 추가
- [ ] 직전에 열렸던 문서에서 시작하기 옵션
    - [ ] home 설정 기능
    - 직전 문서에서 열지 home에서 시작할지 고를 수 있음
- [ ] 외형 설정
    - 폰트, 강조 색, 배경 색, 폭 등
    - 디자인 요소 추출 후 ai studio에 프롬프팅해서 추출
    - vsc 태마 importer
    - 터미널 12색 importer
- [ ] 내장 theme
- [ ] 외부 CSS 사이드로드
- [ ] 멀티 플랫폼 확장:
    - [ ] Tauri: Rust 백엔드를 활용한 초경량 네이티브 데스크탑 및 모바일 앱 (Android/iOS 지원).
        - [ ] React Native: Tauri의 android, ios  DX가 끔찍하다는 커뮤니티 의견이 있음
    - [ ] WebAssembly: 브라우저에서 실행 가능한 WebAssembly를 활용한 모바일 앱.
    - [ ] PWA: 모바일 설치 지원.
- [ ] collaborate 편집 기능 (Real-time): Yjs 등을 활용한 동시 편집 
    - [x] yjs 도입
    - [ ] github로 연동하기 

### TODO / MISC
- [ ] favicon 변경