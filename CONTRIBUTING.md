# 기여 가이드 (ugv_dashboard)

UGV RoArm 프로젝트의 웹 대시보드 리포지토리에 기여하기 위한 가이드입니다. Vue 3 + Vite 기반의 SPA로, MQTT를 통해 로봇과 통신합니다.

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
git clone https://github.com/fhekwn549/ugv_dashboard.git
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
│       ├── useMqtt.js           # MQTT 연결/구독
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
[Vue Component] → [Composable] → [MQTT / REST API] → [ugv_bridge on RPi]
```

- **Components**: UI 렌더링과 사용자 인터랙션 담당
- **Composables**: 비즈니스 로직과 상태 관리 (`use*.js`)
- **MQTT**: 실시간 데이터 (센서, 상태) 수신
- **REST API**: 명령 전송 및 설정 변경

---

## MQTT 토픽 추가 절차

새로운 MQTT 토픽을 추가할 때의 절차입니다:

### 1. ugv_bridge 측 (백엔드)

`ugv_ws` 리포에서 `ugv_bridge` 패키지에 새 토픽 퍼블리시/구독 추가

### 2. ugv_dashboard 측 (프론트엔드)

1. **Composable 수정/생성**: `src/composables/`에서 관련 composable에 토픽 구독 로직 추가
   ```javascript
   // src/composables/useNewFeature.js
   import { useMqtt } from './useMqtt'

   export function useNewFeature() {
     const { subscribe, publish } = useMqtt()

     // 토픽 구독
     subscribe('ugv/new_topic', (message) => {
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

워크스페이스 루트의 [BRANCHING_STRATEGY.md](../ugv_ws/BRANCHING_STRATEGY.md)를 참고하세요.

기본 브랜치: `main`

---

## PR 작성 가이드

1. `main`에서 `feature/<이슈번호>-<설명>` 브랜치 생성
2. 변경 후 아래 항목을 PR 본문에 포함:
   - 변경된 컴포넌트/composable 목록
   - UI 변경이 있으면 스크린샷 첨부
   - `ugv_bridge` 측 변경이 필요한 경우 관련 PR 링크
3. `npm run build`가 성공하는지 확인

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
