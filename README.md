# UGV Dashboard

Waveshare WAVE ROVER + RoArm-M2 로봇을 위한 웹 대시보드.
STOMP over WebSocket으로 실시간 제어/모니터링하고, REST API로 맵/로그를 조회합니다.

## 기능

- **실시간 모니터링** -- 배터리 전압, 로봇팔 관절 각도, 맵 위 로봇 위치, 네비게이션 상태
- **주행 제어** -- WASD 방향 버튼 + 속도 조절 + 긴급 정지
- **로봇팔 제어** -- Base/Shoulder/Elbow 슬라이더 + 그리퍼(62~172도) + Home 프리셋
- **3D 로봇 뷰어** -- Three.js + urdf-loader + STLLoader, 관절/그리퍼/바퀴 실시간 애니메이션
- **LiDAR 시각화** -- 2D 탑다운 Canvas (줌/회전 지원)
- **맵 시각화** -- OccupancyGrid PNG + 로봇 위치 + 경로 오버레이 + 클릭 Nav Goal
- **자율주행** -- Shift+클릭으로 Nav2 목표 전송, Shift+드래그로 방향 지정
- **로그** -- 실시간 클라이언트 로그 + 명령/네비게이션/이벤트 로그 히스토리

## 아키텍처

```
[웹 브라우저 (이 레포)]
    │ STOMP/WS (:15674)  ── 제어 + 센서 구독
    │ REST (:8081)        ── 맵 PNG, 로그 (읽기 전용)
    ▼
[RPi (192.168.0.71)]
  ├─ RabbitMQ       ── MQTT(:1883) + Web STOMP(:15674)
  ├─ Mosquitto      ── 로컬 MQTT(:1883), ugv_bridge가 사용
  ├─ ugv_bridge     ── ROS 2 ↔ MQTT/REST 브릿지 (:8081)
  └─ ROS 2 노드     ── 드라이버, Nav2 등
```

MQTT 토픽은 `{robot_id}/` 네임스페이스로 분리되어 멀티 로봇을 지원합니다.

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| UI | Vue 3 + Vuetify 3 + Vite |
| 3D | Three.js + urdf-loader |
| 상태 관리 | Vuex 4 + vuex-persistedstate |
| 차트 | Chart.js + vue-chartjs |
| 실시간 통신 | stompjs → `ws://{ROBOT_HOST}:15674/ws` (RabbitMQ Web STOMP) |
| 데이터 조회 | axios → RPi bridge REST (`http://{ROBOT_HOST}:8081`) |

## 프로젝트 구조

```
ugv_dashboard/
├── index.html
├── package.json
├── vite.config.js
├── .env                         # VITE_ROBOT_HOST, VITE_BRIDGE_PORT
├── Dockerfile / nginx.conf      # 프로덕션 배포용
├── src/
│   ├── main.js
│   ├── App.vue
│   ├── router/index.js          # /, /logs, /alarms, /tasks, /production
│   ├── plugins/
│   │   ├── index.js             # 플러그인 등록
│   │   ├── vuetify.js           # Vuetify 3 설정 + 테마
│   │   ├── stores.js            # Vuex 스토어
│   │   └── axios.js             # axios 인스턴스
│   ├── composables/
│   │   ├── useStomp.js          # STOMP/WS 연결/구독/발행 (싱글턴)
│   │   ├── useRobotId.js        # 멀티 로봇 ID 관리
│   │   ├── useApi.js            # REST API 클라이언트 (axios)
│   │   ├── useRobotState.js     # STOMP: pose, voltage, joints, map_pose
│   │   ├── useRobotControl.js   # STOMP: cmd_vel, arm, gripper + lastCmdVel
│   │   ├── useLidar.js          # STOMP: scan → 극좌표→직교 변환
│   │   ├── useMap.js            # REST: map PNG / STOMP: path, nav_status
│   │   ├── useNavigation.js     # STOMP: nav_status / navigate, cancel, initial_pose
│   │   └── useLogs.js           # REST: 로그 조회
│   ├── components/
│   │   ├── ConnectionBar.vue    # STOMP 브로커 URL + 연결 상태
│   │   ├── StatusPanel.vue      # 배터리, 관절, 네비게이션 상태
│   │   ├── DriveControl.vue     # WASD + 속도 슬라이더
│   │   ├── ArmControl.vue       # 3관절 + 그리퍼 슬라이더
│   │   ├── RobotViewer3D.vue    # Three.js URDF 3D 뷰어
│   │   ├── LidarView.vue       # 2D LiDAR Canvas
│   │   ├── MapView.vue          # 맵 + 로봇 위치 + 경로 + Nav Goal
│   │   └── LogPanel.vue         # 실시간 클라이언트 로그
│   └── views/
│       ├── DashboardView.vue    # 메인 대시보드
│       └── LogHistoryView.vue   # 로그 히스토리 테이블
└── ugv_factory/                 # 공장 관리 시스템 (별도, 본 대시보드와 독립)
```

> **참고**: `composables/`에는 공장 관리용 `useAlarms.js`, `useTaskQueue.js`, `useProductionStats.js`, `useFactoryApi.js`도 있으며, `components/factory/`와 `views/` 하위에 관련 페이지가 있습니다. 로봇 제어와는 독립적입니다.

## 통신 프로토콜

### STOMP 구독 (실시간 모니터링)

| MQTT 토픽 | 데이터 | 용도 |
|-----------|--------|------|
| `{id}/pose` | x, y, yaw, linear_vel, angular_vel | 오도메트리 |
| `{id}/map_pose` | x, y, yaw, valid | TF 기반 맵 좌표 |
| `{id}/voltage` | voltage | 배터리 전압 |
| `{id}/joint_states` | joints: {name: rad} | 로봇팔 관절 |
| `{id}/scan` | angle_min, angle_increment, ranges | LiDAR 스캔 |
| `{id}/path` | poses: [{x, y}] | Nav2 글로벌 경로 |
| `{id}/nav_status` | status, goal_x, goal_y, feedback_distance | 네비게이션 진행 |
| `{id}/map_updated` | revision | 맵 변경 알림 |

### STOMP 발행 (제어)

| MQTT 토픽 | 데이터 | 용도 |
|-----------|--------|------|
| `{id}/cmd_vel` | linear, angular | 주행 속도 |
| `{id}/arm` | positions: [rad, rad, rad] | 로봇팔 관절 |
| `{id}/gripper` | value: float | 그리퍼 (62~172도) |
| `{id}/navigate` | x, y, theta | Nav2 목표 |
| `{id}/cancel` | {} | 네비게이션 취소 |
| `{id}/initial_pose` | x, y, yaw | AMCL 초기 위치 |

> `{id}`는 로봇 ID (기본: `ugv01`). STOMP destination은 `/topic/ugv01.pose` 형태로 변환됩니다.

### REST API (RPi bridge, 읽기 전용)

| 메서드 | 엔드포인트 | 용도 |
|--------|-----------|------|
| GET | `/api/{id}/map` | 맵 PNG (base64) + 메타데이터 |
| GET | `/api/{id}/logs?type=command` | 명령 로그 |
| GET | `/api/{id}/logs?type=event` | 이벤트 로그 |
| GET | `/api/{id}/logs/navigation` | 네비게이션 로그 |

## 설치 및 실행

### 사전 요구사항

- Node.js 18+
- RPi에서 RabbitMQ + Mosquitto + `ugv_bridge` 실행 중

### 설치

```bash
git clone https://github.com/ubisamRAD/ugv_dashboard.git
cd ugv_dashboard
npm install
```

### 환경 변수

`.env` 파일을 프로젝트 루트에 생성합니다:

```env
VITE_ROBOT_HOST=192.168.0.71
VITE_BRIDGE_PORT=8081
```

| 변수 | 용도 | 기본값 |
|------|------|--------|
| `VITE_ROBOT_HOST` | RPi IP (STOMP 브로커 + REST API 호스트) | `192.168.0.71` |
| `VITE_BRIDGE_PORT` | RPi bridge REST 포트 | `8081` |

### 개발 서버

```bash
npm run dev
# → http://localhost:5173
```

### 프로덕션 빌드 / Docker 배포

```bash
npm run build

# Docker
docker build -t ugv-dashboard .
docker run -p 80:80 ugv-dashboard
```

## 관련 레포

| 레포 | 역할 |
|------|------|
| [ugv_ws](https://github.com/fhekwn549/ugv_ws) | ugv_bridge (MQTT/REST 브릿지) + C++ 시리얼 드라이버 + URDF/Nav2 설정 |
