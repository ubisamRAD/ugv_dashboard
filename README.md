# UGV Dashboard

Waveshare WAVE ROVER + RoArm-M2 로봇을 위한 웹 기반 대시보드.
STOMP over WebSocket + REST API를 통해 로봇 모니터링과 제어가 가능합니다.
로컬 PC에서 Docker로 인프라(RabbitMQ, DB)를 실행하고, RPi는 MQTT 클라이언트로 참여하는 구조입니다.

## 기능

### 로봇 제어 및 모니터링
- **실시간 모니터링** — 배터리 전압, 로봇팔 관절 각도, 맵 위 로봇 위치
- **주행 제어** — WASD 방향 버튼 + 속도 조절 + 긴급 정지
- **로봇팔 제어** — Base/Shoulder/Elbow 슬라이더 + 그리퍼 열기/닫기 + Home 프리셋
- **LiDAR 시각화** — 2D 탑다운 Canvas 렌더링 (줌/회전 지원)
- **Map 시각화** — OccupancyGrid PNG + 로봇 위치 + 경로 오버레이 + 클릭 Nav Goal
- **자율주행** — Shift+클릭으로 Nav2 목표 전송, Shift+드래그로 방향 지정 (RViz 2D Nav Goal 방식)
- **네비게이션 시각화** — 목표 마커(초록 십자+방향 화살표), 경로 오버레이, 진행 상태 표시
- **네비게이션 상태** — StatusPanel에서 상태/목표/남은 거리 실시간 표시 + Cancel 버튼
- **로그 조회** — 명령/네비게이션/이벤트 로그 히스토리 (SQLite 기반)
- **네비게이션 이벤트 로그** — Goal 전송, Path 수신, Arrived/Failed/Canceled 이벤트 실시간 표시

### 공장 관리 시스템
- **알람 관리** — 실시간 알람 배너, 알람 패널, 알람 이력 테이블
- **태스크 큐** — 태스크 생성/조회/상세, 실시간 상태 업데이트
- **생산 통계** — Chart.js 기반 생산량 차트, 생산 요약 대시보드

## 시스템 아키텍처

```
┌──────────────────────────────────────────────┐
│  웹 브라우저 (이 레포)                        │
│  Vue 3 + Vuetify + stompjs + Canvas          │
└──────┬─────────────────────┬─────────────────┘
       │ STOMP/WS (15674)    │ REST (8081, 맵/로그만)
       │ 제어 + 센서 구독     │ RPi bridge 직접
┌──────▼─────────────────────│─────────────────┐
│  RabbitMQ (로컬 PC Docker)  │                 │
│  MQTT:1883 + Web STOMP:15674                  │
└──────┬──────────────────────┘─────────────────┘
       │ MQTT (1883)          │
┌──────▼──────────┐    ┌──────▼──────────┐
│  RPi (ugv01)     │    │  RPi (ugv02)     │
│  ugv_bridge      │    │  ugv_bridge      │
│  :8081           │    │  :8081           │
│  ROS 2 노드      │    │  ROS 2 노드      │
└──────────────────┘    └──────────────────┘
```

모든 로봇 제어(cmd_vel, arm, gripper, navigate, cancel)는 **MQTT**로 통일되어 Factory API 프록시 없이 동작합니다.
MQTT 토픽은 `{robot_id}/` 네임스페이스로 자동 분리되므로 멀티 로봇도 지원합니다.
REST API는 **맵 PNG 조회**와 **로그 조회** 등 읽기 전용 용도로만 RPi bridge에 직접 요청합니다.

> **Factory API(`ugv_factory/`)**: 태스크/알람/생산통계 등 공장 관리 기능 전용으로 분리 예정. 로봇 제어와 독립적으로 동작합니다.

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| Frontend | Vue 3 + Vuetify 3 + Vite |
| 상태 관리 | Vuex 4 + vuex-persistedstate |
| 차트 | Chart.js + vue-chartjs |
| 실시간 통신 | stompjs → ws://localhost:15674/ws (RabbitMQ Web STOMP) |
| 로봇 제어 | STOMP/MQTT: cmd_vel, arm, gripper, navigate, cancel |
| 데이터 조회 | axios → RPi bridge REST (맵 PNG, 로그) |
| 메시지 브로커 | RabbitMQ (로컬 PC Docker, MQTT + STOMP + Web STOMP) |
| 백엔드 브릿지 | ugv_bridge (RPi, 별도 [ugv_ws](https://github.com/fhekwn549/ugv_ws) 레포) |
| 공장 백엔드 | Spring Boot + PostgreSQL + Redis + InfluxDB (ugv_factory/, 별도 분리 예정) |

## 프로젝트 구조

```
ugv_dashboard/
├── index.html
├── package.json
├── vite.config.js
├── Dockerfile                   # 프로덕션 빌드용 Docker 이미지
├── nginx.conf                   # Nginx 정적 파일 서빙 설정
├── .env                         # VITE_ROBOT_HOST, VITE_FACTORY_API_PORT (gitignored)
├── ugv_factory/                 # 공장 관리 백엔드 (Spring Boot)
│   ├── backend/
│   │   ├── pom.xml
│   │   ├── Dockerfile
│   │   └── src/main/java/com/ubisam/factory/
│   │       ├── rest/            # REST 컨트롤러 (robots, alarms, tasks, stats)
│   │       ├── domain/          # 엔티티 + 리포지토리 (Robot, Alarm, Task 등)
│   │       ├── stomp/           # 실시간 알림 퍼블리셔
│   │       └── config/          # Security, STOMP, CORS 설정
│   └── docker-compose.yml       # RabbitMQ + PostgreSQL + Redis + InfluxDB + Spring Boot
└── src/
    ├── main.js
    ├── App.vue
    ├── router/
    │   └── index.js             # /, /logs, /alarms, /tasks, /production
    ├── plugins/
    │   ├── index.js             # 플러그인 등록 진입점
    │   ├── vuetify.js           # Vuetify 3 설정 + 테마
    │   ├── stores.js            # Vuex 스토어
    │   └── axios.js             # axios 인스턴스 설정
    ├── composables/
    │   ├── useStomp.js          # STOMP/WS 연결/구독/발행 (싱글턴, 핵심)
    │   ├── useRobotId.js        # 멀티 로봇 ID 관리
    │   ├── useApi.js            # REST API 클라이언트 (axios)
    │   ├── useRobotState.js     # STOMP: pose, voltage, joints, map_pose
    │   ├── useRobotControl.js   # STOMP: cmd_vel / REST: arm, gripper
    │   ├── useLidar.js          # STOMP: scan → 극좌표→직교 변환
    │   ├── useMap.js            # REST: map PNG / STOMP: path, nav_status
    │   ├── useNavigation.js     # STOMP: nav_status / REST: cancel, initial_pose
    │   ├── useRos.js            # 하위호환 shim
    │   ├── useAlarms.js         # 공장 알람 관리
    │   ├── useTaskQueue.js      # 공장 태스크 큐
    │   ├── useProductionStats.js # 생산 통계
    │   └── useFactoryApi.js     # 공장 백엔드 REST API
    ├── components/
    │   ├── ConnectionBar.vue    # STOMP 브로커 URL + 연결 상태
    │   ├── StatusPanel.vue      # 배터리, 관절 상태, 네비게이션 상태
    │   ├── DriveControl.vue     # WASD + 속도 슬라이더
    │   ├── ArmControl.vue       # 3관절 + 그리퍼 슬라이더
    │   ├── LidarView.vue        # 2D LiDAR Canvas
    │   ├── MapView.vue          # 맵 + 로봇 위치 + 경로 + 목표 마커
    │   ├── LogPanel.vue         # 실시간 클라이언트 로그
    │   └── factory/
    │       ├── AlarmPanel.vue       # 알람 현황 패널
    │       ├── AlarmBanner.vue      # 알람 배너 (상단 경고)
    │       ├── AlarmHistoryTable.vue # 알람 이력 테이블
    │       ├── TaskQueuePanel.vue   # 태스크 큐 패널
    │       ├── TaskCreateDialog.vue # 태스크 생성 다이얼로그
    │       ├── TaskDetailCard.vue   # 태스크 상세 카드
    │       ├── ProductionChart.vue  # 생산량 차트
    │       └── ProductionSummary.vue # 생산 요약
    └── views/
        ├── DashboardView.vue    # 메인 대시보드 (Vuetify Grid)
        ├── LogHistoryView.vue   # 로그 히스토리 테이블
        ├── AlarmsView.vue       # 알람 관리 페이지
        ├── TaskQueueView.vue    # 태스크 큐 페이지
        └── ProductionView.vue   # 생산 통계 페이지
```

## 통신 프로토콜

### MQTT 구독 (실시간 모니터링)

| MQTT 토픽 | 데이터 | 용도 |
|-----------|--------|------|
| `ugv01/pose` | x, y, yaw, linear_vel, angular_vel | 오도메트리 위치 |
| `ugv01/map_pose` | x, y, yaw, valid | TF 기반 맵 좌표 위치 |
| `ugv01/voltage` | voltage | 배터리 전압 |
| `ugv01/joint_states` | joints: {name: rad} | 로봇팔 관절 각도 |
| `ugv01/scan` | angle_min, angle_increment, ranges, ... | LiDAR 스캔 |
| `ugv01/path` | poses: [{x, y}] | Nav2 글로벌 경로 |
| `ugv01/nav_status` | status, goal_x, goal_y, feedback_distance | 네비게이션 진행 |
| `ugv01/map_updated` | revision | 맵 변경 알림 |

### MQTT 발행 (제어)

| MQTT 토픽 | 데이터 | 용도 |
|-----------|--------|------|
| `ugv01/cmd_vel` | linear, angular | 주행 속도 명령 |
| `ugv01/arm` | positions: [rad, rad, rad] | 로봇팔 관절 명령 |
| `ugv01/gripper` | value: float | 그리퍼 명령 |
| `ugv01/navigate` | x, y, theta | Nav2 목표 전송 |
| `ugv01/cancel` | {} | 네비게이션 취소 |
| `ugv01/initial_pose` | x, y, yaw | AMCL 초기 위치 설정 |

### REST API (RPi bridge 직접, 읽기 전용)

| 메서드 | 엔드포인트 | 용도 |
|--------|-----------|------|
| GET | `/api/{id}/map` | 맵 PNG (base64) + 메타데이터 |
| GET | `/api/{id}/logs?type=command` | 명령 로그 조회 |
| GET | `/api/{id}/logs?type=event` | 이벤트 로그 조회 |
| GET | `/api/{id}/logs/navigation` | 네비게이션 로그 조회 |

## 설치

### 사전 요구사항

- Node.js 18+
- Docker + Docker Compose
- RPi에서 `ugv_bridge` + 하드웨어 드라이버 실행 중

### 설치 과정

```bash
git clone https://github.com/ubisamRAD/ugv_dashboard.git
cd ugv_dashboard
npm install
```

### 환경 변수 설정

```bash
cat > .env << 'EOF'
VITE_ROBOT_HOST=192.168.0.71
VITE_BRIDGE_PORT=8081
EOF
```

| 변수 | 용도 | 기본값 |
|------|------|--------|
| `VITE_ROBOT_HOST` | RPi IP (STOMP 브로커 호스트로도 사용) | `192.168.0.71` |
| `VITE_BRIDGE_PORT` | RPi bridge REST 포트 (맵/로그 조회용) | `8081` |

### 인프라 실행

RabbitMQ만 필요합니다 (Factory API, PostgreSQL, Redis, InfluxDB는 불필요):

```bash
# 방법 1: Docker로 RabbitMQ만 실행
docker run -d --name rabbitmq \
  -p 1883:1883 -p 15674:15674 -p 61613:61613 \
  -e RABBITMQ_DEFAULT_USER=guest -e RABBITMQ_DEFAULT_PASS=guest \
  rabbitmq:3-management

# 방법 2: 기존 ugv_factory docker-compose 사용 (RabbitMQ 포함)
cd ugv_factory && docker compose up -d rabbitmq
```

> RPi의 `ugv_bridge`에서 `mqtt_host`를 로컬 PC IP로 설정해야 합니다.

### Windows 방화벽 (WSL2 환경)

RPi가 로컬 PC의 Docker 서비스에 접근하려면 방화벽에서 포트를 열어야 합니다:

```powershell
# PowerShell (관리자 권한)
New-NetFirewallRule -DisplayName "UGV RabbitMQ" -Direction Inbound -LocalPort 1883,15674,61613 -Protocol TCP -Action Allow
```

## 실행

```bash
# 개발 서버
npm run dev
# → http://localhost:5173 접속

# 프로덕션 빌드
npm run build
```

### Docker 배포

```bash
docker build -t ugv-dashboard .
docker run -p 80:80 ugv-dashboard
```

브라우저에서 STOMP 브로커 URL (`ws://localhost:15674/ws`) 확인 후 Connect.

## 관련 레포

| 레포 | 역할 |
|------|------|
| [ugv_ws](https://github.com/fhekwn549/ugv_ws) | C++ 실시간 시리얼 드라이버(`ugv_cpp_nodes`) + ugv_bridge(MQTT/REST 브릿지) + ugv_roarm_description(URDF, launch, Nav2) |

### ugv_ws 아키텍처와의 관계

이 대시보드는 `ugv_bridge` 노드와 **MQTT(제어) + REST(조회)** 두 채널로 통신합니다.
Factory API 프록시 없이 직접 통신하며, 하위 드라이버가 Python이든 C++이든 대시보드에는 영향이 없습니다.

```
[이 대시보드]
    ↕ STOMP/WS (15674): 제어(arm, gripper, cmd_vel, navigate) + 센서 구독
    ↕ REST (8081): 맵 PNG, 로그 조회 (읽기 전용, RPi bridge 직접)
[RabbitMQ] (로컬 PC Docker) — MQTT 브로커만 필요, Factory API 불필요
    ↕ MQTT (1883)
[ugv_bridge (Python)]
    ↕ ROS 2 토픽 (CycloneDDS)
[ugv_driver_node (C++), roarm_driver_node (C++)]
    ↕ 시리얼 (UART)
[ESP32 모터 컨트롤러]
```
