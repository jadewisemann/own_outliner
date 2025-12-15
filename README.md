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

### I: core & MVC

- Core & Performance
    - [x] 프로젝트 초기 설정 (Vite + React + TS + Tailwind v4)
    - [x] 데이터 아키텍처 (Flat Dictionary 구조: O(1) 성능)
    - [x] 가상화 (Virtualization): `react-virtuoso` 도입 및 최적화
    - [x] 데이터 영속성 (LocalStorage) 및 Yjs 도입
    - [x] 실행 취소/다시 실행 (Undo/Redo): `zundo` 기반 상태 관리

- Basic Editing
    - [x] 기본 조작 (Add, Delete, Indent, Outdent, Reorder)
    - [x] 지능형 선택 (Smart Selection, Ctrl+A)
    - [x] 논리적 노드/텍스트 복사 & 붙여넣기 (스마트 인덴트 감지)
    - [x] 인라인 포매팅 (Markdown 스타일)

- UX Polish
    - [x] 줌 인/아웃 (Hoisting)
    - [x] 다중 선택 및 일괄 삭제
    - [x] 검색 (Cmd + P)
    - [x] 슬래시(/) 포커스


### **I.5**: core refine
    - [ ] internal link refactoring
        - [x] add alias
        - [x] add node link
        - [ ] add backlink


### **II**: core improvement and add feature

- refine Logic
    - [ ] Logical Indentation
        - [ ] option으로 분기 처리
    - [ ] 노드 이동 알고리즘 개선: 드래그/단축키 이동 시 부모-자식 재계산 로직 강화

- 기능 고도화
    - [ ] 노드 내 개행(Soft break)
    - [ ] $nodelink (search) 다른 파일내 노드 검색 기능 추가

- 노드 종류 추가
    - [ ] $code-block
        - [ ] 코드 블록
        - [ ] 인라인 코드 블록
        - [ ] 코드 블록 syntax highlight
    - [ ] $tag
        - [ ] 태그
        - [ ] 태그 검색
    - [ ] $todo
        - [ ] 체크박스
        - [ ] 체크박스 검색
    - [ ] $memo

- 기능 추가
    - [ ] $inliternal-link (link search) prefix 추가 또는 폴더 탐색
    - [ ] $quick-changer 
    - [ ] $breadcrumb (줌인)
    - [ ] 로컬 저장(md로 저장) 
    - [ ] $daily
        - [ ] 일일 저널
        - [ ] 일일 저널 검색


### **III**: UI/UX 확장 및 추가 기능
- 추가 노드
    - [ ] $paragraph
    - [ ] $quote
    - [ ] $horizontal-divider
    - [ ] $date
        - [ ] 날짜
        - [ ] 날짜 검색
    - [ ] $time
    - [ ] $calendar


- 애니메이션
    - [ ] 이동 트랜지션
    - [ ] 커서 애니메이션

- Customization
    - [ ] 테마 시스템
        - [ ] VS Code 테마 임포터
        - [ ] 터미널, 12색 테마 컨버터
    - [ ] 외형 설정 세팅
        - [ ] 폰트/색상 커스텀 설정
        - [ ] 에디터 폭, 배경색, 사이드바 설정
    - [ ] 시작 옵션: 홈 화면 vs 마지막 문서 열기

### IV: 생태계 및 멀티 플랫폼

- Platform
    - [ ] Tauri 모바일: Rust 백엔드 기반 Android/iOS 앱 빌드
    - [ ] PWA / WebAssembly: 웹 기반 구동 환경

- Sync & Data
    - [ ] 협업/동기화
        - [ ] GitHub 연동
            - github을 저장소로 이용
            - 자동 커밋 및 푸쉬, 풀
        - [ ] Yjs 기반 실시간 협업
    - [ ] SSO를 외부 브라우저에서 하게 하기
