# 기여 가이드 (ugv_dashboard)

UGV RoArm 프로젝트의 웹 대시보드 리포지토리에 기여하기 위한 가이드입니다. Vue 3 + Vite 기반의 SPA로, STOMP over WebSocket(RabbitMQ)을 통해 로봇과 통신합니다.

---

## 개발 환경 요구사항

| 항목 | 버전 |
|------|------|
| Node.js | 18.x 이상 |
| npm | 9.x 이상 |
| 브라우저 | Chrome / Firefox (최신) |

---

## 설치 및 실행

### 클론

```bash
git clone https://github.com/ubisamRAD/ugv_dashboard.git
cd ugv_dashboard
```

### 의존성 설치

```bash
npm install
```

### 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성합니다:

```bash
# 로봇(RPi)의 IP 주소
VITE_ROBOT_HOST=192.168.0.71
```

> `VITE_ROBOT_HOST`는 MQTT 브로커와 API 서버의 호스트로 사용됩니다.

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173`으로 접속합니다.

### 프로덕션 빌드

```bash
npm run build
npm run preview  # 빌드 결과 미리보기
```

---

## 프로젝트 구조

```
ugv_dashboard/
├── src/
│   ├── App.vue                  # 루트 컴포넌트
│   ├── main.js                  # 앱 진입점
│   ├── router/                  # Vue Router 설정
│   ├── views/
│   │   ├── DashboardView.vue    # 메인 대시보드 페이지
│   │   └── LogHistoryView.vue   # 로그 이력 페이지
│   ├── components/
│   │   ├── ArmControl.vue       # 로봇팔 제어
│   │   ├── ConnectionBar.vue    # 연결 상태 표시
│   │   ├── DriveControl.vue     # 주행 제어
│   │   ├── LidarView.vue        # LiDAR 시각화
│   │   ├── LogPanel.vue         # 로그 패널
│   │   ├── MapView.vue          # 지도 시각화
│   │   └── StatusPanel.vue      # 상태 정보
│   └── composables/
│       ├── useApi.js            # REST API 통신
│       ├── useLidar.js          # LiDAR 데이터 처리
│       ├── useLogs.js           # 로그 관리
│       ├── useMap.js            # 지도 데이터
│       ├── useStomp.js          # STOMP/WS 연결/구독 (핵심)
│       ├── useMqtt.js           # useStomp re-export shim
│       ├── useNavigation.js     # 내비게이션 제어
│       ├── useRobotControl.js   # 로봇 제어 명령
│       ├── useRobotState.js     # 로봇 상태 관리
│       └── useRos.js            # ROS 브릿지 통신
├── public/
├── .env                         # 환경 변수 (git에 포함하지 않음)
├── package.json
├── vite.config.js
└── index.html
```

---

## 아키텍처 개요

```
[Vue Component] → [Composable] → [STOMP / REST API] → [ugv_bridge on RPi]
```

- **Components**: UI 렌더링과 사용자 인터랙션 담당
- **Composables**: 비즈니스 로직과 상태 관리 (`use*.js`)
- **STOMP/WS**: 실시간 데이터 (센서, 상태) 수신 (RabbitMQ Web STOMP)
- **REST API**: 명령 전송 및 설정 변경

---

## 토픽 추가 절차

새로운 MQTT/STOMP 토픽을 추가할 때의 절차입니다:

> **참고**: Dashboard는 STOMP over WebSocket으로 통신하지만, `useMqtt` shim을 통해 기존 API를 그대로 사용합니다. 내부적으로 `useStomp.js`가 MQTT 토픽명(`ugv01/pose`)을 STOMP destination(`/topic/ugv01.pose`)으로 자동 변환합니다.

### 1. ugv_bridge 측 (백엔드)

`ugv_ws` 리포에서 `ugv_bridge` 패키지에 새 토픽 퍼블리시/구독 추가 (paho-mqtt, MQTT 토픽명 사용)

### 2. ugv_dashboard 측 (프론트엔드)

1. **Composable 수정/생성**: `src/composables/`에서 관련 composable에 토픽 구독 로직 추가
   ```javascript
   // src/composables/useNewFeature.js
   import { useMqtt } from './useMqtt'  // useStomp의 shim

   export function useNewFeature() {
     const { subscribe, publish } = useMqtt()

     // MQTT 스타일 토픽명 사용 — STOMP 변환은 자동
     subscribe('ugv01/new_topic', (message) => {
       // 메시지 처리
     })

     return { /* 반환할 상태/함수 */ }
   }
   ```

2. **컴포넌트 생성/수정**: `src/components/`에서 UI 컴포넌트 추가

3. **View에 통합**: 필요 시 `DashboardView.vue`에 컴포넌트 배치

### 3. 양쪽 리포에 PR 생성

- `ugv_ws` PR: bridge 측 변경사항
- `ugv_dashboard` PR: 프론트엔드 변경사항
- 두 PR을 상호 참조 (`Related: org/repo#이슈번호`)

---

## 브랜치 전략

기여자(팀원)별 브랜치를 생성하고, 기본 브랜치로 PR을 보내는 방식입니다.

```
main  ← 보호된 기본 브랜치 (직접 push 불가)
 ├── jeonghun/add-camera-view     ← 기여자별 작업 브랜치
 ├── minsoo/fix-lidar-render
 └── jiyeon/update-status-panel
```

### 브랜치 네이밍

```
<이름>/<간단한-설명>
```

- 소문자만 사용, 단어 구분은 하이픈(`-`)
- `<이름>`은 GitHub 사용자명 또는 이름
- 설명은 영어로 간결하게 (3~5 단어)

---

## 작업 흐름 튜토리얼 (처음부터 끝까지)

### Step 1: 기본 브랜치를 최신으로 업데이트

```bash
cd ugv_dashboard
git checkout main
git pull origin main
```

### Step 2: 내 작업 브랜치 만들기

```bash
git checkout -b jeonghun/add-camera-view
```

> `jeonghun` 부분을 본인 이름으로 바꾸세요.
> 이 명령은 브랜치를 만들고 동시에 그 브랜치로 전환합니다.

현재 브랜치 확인:

```bash
git branch
# * jeonghun/add-camera-view   ← 현재 브랜치 (* 표시)
#   main
```

### Step 3: 코드 수정

파일을 수정하고, 빌드가 되는지 확인합니다:

```bash
npm run build
```

개발 서버를 띄워서 브라우저에서 확인해볼 수도 있습니다:

```bash
npm run dev
# → http://localhost:5173 접속해서 확인
```

### Step 4: 변경사항 확인 및 커밋

```bash
# 어떤 파일이 변경되었는지 확인
git status

# 변경된 파일을 스테이징 (커밋할 파일 선택)
git add src/components/CameraView.vue
git add src/views/DashboardView.vue

# 커밋 (메시지는 영어로)
git commit -m "feat(components): add camera stream view"
```

> **주의**: `git add .`은 의도하지 않은 파일까지 포함될 수 있으니, 변경한 파일만 지정하세요.
> 특히 `.env` 파일은 절대 커밋하지 마세요 (gitignored).

### Step 5: GitHub에 push

```bash
git push -u origin jeonghun/add-camera-view
```

> 처음 push할 때는 `-u` 옵션이 필요합니다. 이후 같은 브랜치에서는 `git push`만 하면 됩니다.

### Step 6: GitHub에서 PR (Pull Request) 만들기

1. GitHub 리포 페이지에 접속하면 상단에 **"Compare & pull request"** 버튼이 나타납니다 → 클릭

2. 또는 **Pull requests** 탭 → **New pull request** → base를 `main`, compare를 본인 브랜치로 선택

3. PR 작성:
   - **제목**: 커밋 메시지와 동일한 형식 (예: `feat(components): add camera stream view`)
   - **본문**:
     - 변경된 컴포넌트/composable 목록
     - UI 변경이 있으면 스크린샷 첨부
     - `ugv_bridge` 측 변경이 필요한 경우 관련 PR 링크
   - **Create pull request** 클릭

### Step 7: 코드 리뷰 & 머지

1. 팀원 1명이 PR을 리뷰하고 **Approve** (승인)
2. 승인 후 **Merge pull request** → **Confirm merge** 클릭
3. 머지 완료 후 **Delete branch** 클릭 (GitHub 원격 브랜치 삭제)

### Step 8: 로컬 정리

```bash
# 기본 브랜치로 돌아가서 최신 받기
git checkout main
git pull origin main

# 머지 완료된 로컬 브랜치 삭제
git branch -d jeonghun/add-camera-view
```

### 요약 흐름도

```
git pull → git checkout -b <이름>/<설명> → 코드 수정 → git add → git commit → git push
→ GitHub에서 PR 생성 → 리뷰 승인 → Merge → 로컬 정리
```

---

## 커밋 메시지 컨벤션

[Conventional Commits](https://www.conventionalcommits.org/) 스타일. **영어로 작성합니다.**

```
<type>(<scope>): <subject>
```

| Type | 설명 | 예시 |
|------|------|------|
| `feat` | 새로운 기능 | `feat(components): add camera stream view` |
| `fix` | 버그 수정 | `fix(stomp): handle reconnect on disconnect` |
| `docs` | 문서 변경 | `docs: update CONTRIBUTING.md` |
| `refactor` | 코드 리팩토링 | `refactor(composables): extract map utils` |
| `test` | 테스트 추가/수정 | `test: add LidarView unit test` |
| `chore` | 빌드/설정 등 | `chore: update vite config` |

Scope는 모듈명 사용: `stomp`, `components`, `composables`, `router`, `config`

---

## 코드 스타일

### Vue 컴포넌트

- **SFC** (Single File Component) 형식 사용
- `<script setup>` 문법 사용
- 컴포넌트명은 PascalCase (`ArmControl.vue`)
- Props와 emits를 명시적으로 선언

### JavaScript

- ES6+ 문법 사용
- Composable 함수명은 `use` 접두사 (`useMqtt`, `useRobotState`)
- 비동기 처리는 `async/await` 사용

### CSS

- Scoped 스타일 사용 (`<style scoped>`)
- 반응형 레이아웃 고려

---

## 문의

프로젝트 관련 문의는 GitHub Issues를 통해 등록해 주세요.
