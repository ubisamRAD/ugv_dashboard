# UGV Dashboard (Archived)

> **이 프로젝트는 [ugv-frontend](https://github.com/ubisamRAD/ugv-frontend)로 이전되었습니다.**
> 새 버전은 ubisam boilerplate 기반으로 OAuth2 인증이 추가되었습니다.
> 이 레포는 참조용으로 유지됩니다.

---

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
    │ STOMP/WS (:15674)  ── 제어 명령 + 센서 데이터 구독
    │ REST (:8081)        ── 맵 PNG, 로그, 제어 (폴백)
    ▼
[RabbitMQ ── 프로토콜 변환 허브]
    │ MQTT (:1883)        ← ugv_bridge가 paho-mqtt로 연결
    │ Web STOMP (:15674)  ← 브라우저가 WebSocket으로 연결
    │ 내부에서 MQTT ↔ STOMP 자동 변환
    ▼
[RPi]
  ├─ ugv_bridge     ── ROS 2 ↔ MQTT/REST 브릿지 (FastAPI :8081)
  ├─ ugv_driver_node (C++)  ── 바퀴 제어 + IMU/전압 (/dev/ttyAMA0)
  ├─ roarm_driver_node (C++) ── 로봇팔 제어 + 관절 피드백 (/dev/ttyUSB0)
  ├─ ldlidar_node            ── LiDAR 스캔 (/dev/ttyUSB1)
  └─ Nav2 (map_server, AMCL, planner 등)
```

MQTT 토픽은 `{robot_id}/` 네임스페이스로 분리되어 멀티 로봇을 지원합니다.

### 왜 STOMP/WebSocket인가?

브라우저는 TCP 소켓을 열 수 없어서 MQTT에 직접 연결이 불가능합니다.
RabbitMQ가 MQTT·STOMP·WebSocket을 동시에 지원하므로, 브라우저는 WebSocket으로 RabbitMQ에 연결하고
RabbitMQ가 내부에서 STOMP ↔ MQTT 변환을 처리합니다.

### 데이터 흐름

```
하향 (제어):  JS Object → JSON → STOMP Frame → WS Frame
              → RabbitMQ → MQTT Packet → ugv_bridge
              → ROS2 메시지 → CycloneDDS → C++ 노드 → 시리얼 → ESP32

상향 (센서):  ESP32/LiDAR → 시리얼 → C++ 노드 → ROS2 메시지
              → CycloneDDS → ugv_bridge → RobotState (thread-safe)
              → MQTT publish 루프 → RabbitMQ → STOMP Frame → WS Frame → JS Object

맵 (REST):   MQTT로 revision 알림 → 브라우저가 REST로 PNG 요청
```

### ugv_bridge 내부 구조

ugv_bridge는 3개의 스레드로 동작합니다:

| 스레드 | 역할 |
|--------|------|
| ROS2 콜백 | 토픽 수신 → `RobotState`에 저장 (`update_*`) |
| MQTT publish 루프 | 50Hz 틱, 주기적으로 `RobotState`에서 스냅샷 읽어 MQTT 발행 |
| FastAPI | REST 요청 시 `RobotState`에서 데이터 읽어 응답 |

`RobotState`는 `threading.Lock()`으로 보호되는 공유 저장소입니다.

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
├── src/
│   ├── main.js
│   ├── App.vue
│   ├── router/index.js          # /, /logs
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
```

## 통신 프로토콜

### STOMP 구독 (실시간 모니터링)

| MQTT 토픽 | 발행 주기 | 데이터 | 용도 |
|-----------|-----------|--------|------|
| `{id}/pose` | 10Hz | x, y, yaw, linear_vel, angular_vel | 오도메트리 |
| `{id}/map_pose` | 10Hz | x, y, yaw, valid | TF 기반 맵 좌표 (AMCL) |
| `{id}/voltage` | 1Hz | voltage | 배터리 전압 |
| `{id}/joint_states` | 5Hz | joints: {name: rad} | 로봇팔 관절 (4개) |
| `{id}/scan` | 5Hz | angle_min, angle_increment, ranges | LiDAR 스캔 (4x 다운샘플) |
| `{id}/path` | 변경 시 | poses: [{x, y}] | Nav2 글로벌 경로 |
| `{id}/nav_status` | 이벤트+1Hz | status, goal_x, goal_y, feedback_distance | 네비게이션 진행 |
| `{id}/map_updated` | 이벤트 | revision | 맵 변경 알림 → REST로 PNG 요청 |

### STOMP 발행 (제어)

| MQTT 토픽 | QoS | 데이터 | 용도 |
|-----------|-----|--------|------|
| `{id}/cmd_vel` | 0 | linear, angular | 주행 속도 (연속 스트림, 유실 허용) |
| `{id}/arm` | 1 | positions: [rad, rad, rad] | 로봇팔 관절 (단발 명령, ACK 필요) |
| `{id}/gripper` | 1 | value: float | 그리퍼 (62~172도) |
| `{id}/navigate` | 1 | x, y, theta | Nav2 목표 |
| `{id}/cancel` | 1 | {} | 네비게이션 취소 |
| `{id}/initial_pose` | 1 | x, y, yaw | AMCL 초기 위치 |

> `{id}`는 로봇 ID (기본: `ugv01`). STOMP destination은 `/topic/ugv01.pose` 형태로 변환됩니다.
>
> **QoS 0**: 연속으로 보내는 데이터 — 한 개 유실되어도 다음 것이 바로 옴.
> **QoS 1**: 단발 명령 — 유실되면 동작이 안 일어나므로 브로커 ACK 필요.

### REST API (RPi bridge)

| 메서드 | 엔드포인트 | 용도 |
|--------|-----------|------|
| GET | `/api/health` | 헬스체크 |
| GET | `/api/robots` | 등록된 로봇 목록 |
| GET | `/api/{id}/status` | 전체 상태 스냅샷 |
| GET | `/api/{id}/map` | 맵 PNG (base64) + 메타데이터 |
| GET | `/api/{id}/logs?type=command` | 명령 로그 |
| GET | `/api/{id}/logs?type=event` | 이벤트 로그 |
| GET | `/api/{id}/logs/navigation` | 네비게이션 로그 |
| POST | `/api/{id}/cmd_vel` | 주행 명령 (REST 폴백) |
| POST | `/api/{id}/arm` | 로봇팔 명령 |
| POST | `/api/{id}/gripper` | 그리퍼 명령 |
| POST | `/api/{id}/navigate` | Nav2 목표 전송 |
| POST | `/api/{id}/cancel` | 네비게이션 취소 |
| POST | `/api/{id}/initial_pose` | AMCL 초기 위치 |

> 대시보드는 제어에 STOMP를 사용하지만, POST 엔드포인트도 제공되어 curl 등으로 직접 제어할 수 있습니다.

## 컴포넌트 ↔ Composable 의존성

```
Views → Components → Composables → useStomp / useApi → 외부 (STOMP / REST)
```

| Component | useStomp | useRobotState | useRobotControl | useMap | useLidar | 역할 |
|-----------|----------|---------------|-----------------|--------|----------|------|
| ConnectionBar | V | | | | | 브로커 연결/해제 |
| StatusPanel | | V | | V | | 배터리, 관절, 네비 |
| DriveControl | | | V | | | WASD 속도 명령 |
| ArmControl | | V | V | | | 3관절 슬라이더 |
| RobotViewer3D | | V | V | | | 3D URDF 뷰어 |
| LidarView | | | | | V | 2D LiDAR 시각화 |
| MapView | | V | | V | V | 맵 + 경로 + 목표점 |
| LogPanel | V | | | | | 실시간 로그 |

## 새 UI 기능 추가 가이드

### 1. 기존 데이터 사용 (Composable에 이미 있는 경우)

```vue
<script setup>
import { useRobotState } from '@/composables/useRobotState'
const { linearVel } = useRobotState()
</script>

<template>
  <v-card>{{ linearVel.toFixed(2) }} m/s</v-card>
</template>
```

### 2. 새 MQTT 토픽 구독이 필요한 경우

```javascript
// src/composables/useTemperature.js
import { ref, watch, readonly } from 'vue'
import { useStomp } from './useStomp'
import { useRobotId } from './useRobotId'

const temperature = ref(0)

export function useTemperature() {
  const { isConnected, subscribe, unsubscribe } = useStomp()
  const { robotId } = useRobotId()

  watch([isConnected, robotId], ([connected, rid]) => {
    if (connected && rid) {
      subscribe(`${rid}/temperature`, (data) => {
        temperature.value = data.temp
      })
    }
  }, { immediate: true })

  return { temperature: readonly(temperature) }
}
```

### 3. DashboardView에 등록

`src/views/DashboardView.vue`의 그리드 레이아웃에 새 컴포넌트를 추가합니다.

> ugv_bridge 쪽에도 새 토픽 발행이 필요하면: `RobotState`에 필드 추가 → `_publish_loop`에 주기 추가 → `snapshot_*` 메서드 추가.

## 설치 및 실행

### 사전 요구사항

- Node.js 18+
- RPi에서 RabbitMQ + `ugv_bridge` 실행 중

### 설치

```bash
git clone https://github.com/ubisamRAD/ugv_dashboard.git
cd ugv_dashboard
npm install
```

### 환경 변수

`.env` 파일을 프로젝트 루트에 생성합니다:

```env
VITE_ROBOT_HOST=<RPi_IP>
VITE_BRIDGE_PORT=8081
```

| 변수 | 용도 | 기본값 |
|------|------|--------|
| `VITE_ROBOT_HOST` | RPi IP (STOMP 브로커 + REST API 호스트) | `localhost` |
| `VITE_BRIDGE_PORT` | RPi bridge REST 포트 | `8081` |

### 개발 서버

```bash
npm run dev
# → http://localhost:5173
```

### 프로덕션 빌드

```bash
npm run build
```

## 관련 레포

| 레포 | 역할 |
|------|------|
| [ugv_ws](https://github.com/fhekwn549/ugv_ws) | ugv_bridge (MQTT/REST 브릿지) + C++ 시리얼 드라이버 + URDF/Nav2 설정 |
