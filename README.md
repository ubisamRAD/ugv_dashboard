# UGV Dashboard

Waveshare WAVE ROVER + RoArm-M2 로봇을 위한 웹 기반 대시보드.
roslibjs를 통해 RPi의 rosbridge_server에 직접 연결하여, 브라우저에서 로봇 모니터링과 제어가 가능합니다.

## 기능

- **실시간 모니터링** — 배터리 전압, IMU Yaw, 로봇팔 관절 각도
- **주행 제어** — WASD 방향 버튼 + 속도 조절 + 긴급 정지
- **로봇팔 제어** — Base/Shoulder/Elbow 슬라이더 + 그리퍼 열기/닫기 + Home 프리셋
- **LiDAR 시각화** — 2D 탑다운 Canvas 렌더링 (줌 지원)
- **Map 시각화** — OccupancyGrid + 로봇 위치 + 경로 오버레이 + 클릭 Nav Goal
- **로그 패널** — 연결/해제/에러 이벤트 실시간 표시

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| Frontend | Vue 3 + Vite |
| ROS 통신 | roslibjs → ws://RPi:9090 |
| Backend | Phase 2에서 Spring Boot 추가 예정 |

## 프로젝트 구조

```
ugv_dashboard/
├── index.html                  # Vite 진입점
├── package.json
├── vite.config.js
├── jsconfig.json
└── src/
    ├── main.js                 # Vue 앱 초기화
    ├── App.vue                 # 글로벌 스타일 (다크 테마)
    ├── router/
    │   └── index.js            # Vue Router 설정
    ├── composables/            # ROS 통신 로직
    │   ├── useRos.js           # rosbridge 연결 관리 (ROSLIB.Ros)
    │   ├── useRobotState.js    # /odom, /voltage, /imu, /joint_states 구독
    │   ├── useRobotControl.js  # /cmd_vel, /arm_controller, /gripper 발행
    │   ├── useLidar.js         # /scan 구독 + 극좌표→직교 변환
    │   └── useMap.js           # /map, /plan 구독 + /goal_pose 발행
    ├── components/
    │   ├── ConnectionBar.vue   # 상단: rosbridge URL 입력 + 연결 상태
    │   ├── StatusPanel.vue     # 배터리, IMU Yaw, 관절 상태
    │   ├── DriveControl.vue    # WASD 방향 버튼 + 속도 슬라이더
    │   ├── ArmControl.vue      # 3관절 + 그리퍼 슬라이더 + Home
    │   ├── LidarView.vue       # 2D LiDAR Canvas 렌더링
    │   ├── MapView.vue         # 2D 맵 + 로봇 위치 + 경로
    │   └── LogPanel.vue        # 실시간 로그
    └── views/
        └── DashboardView.vue   # 메인 대시보드 (CSS Grid 레이아웃)
```

## ROS 토픽 매핑

### 구독 (모니터링)

| 토픽 | 메시지 타입 | 용도 |
|------|------------|------|
| `/odom` | nav_msgs/Odometry | IMU 방위각 (Yaw) |
| `/voltage` | std_msgs/Float32 | 배터리 전압 |
| `/imu/data` | sensor_msgs/Imu | IMU 데이터 |
| `/joint_states` | sensor_msgs/JointState | 로봇팔 관절 각도 |
| `/scan` | sensor_msgs/LaserScan | LiDAR 스캔 데이터 |
| `/map` | nav_msgs/OccupancyGrid | SLAM 맵 |
| `/plan` | nav_msgs/Path | Nav2 전역 경로 |

### 발행 (제어)

| 토픽 | 메시지 타입 | 용도 |
|------|------------|------|
| `/cmd_vel` | geometry_msgs/Twist | 주행 속도 명령 |
| `/arm_controller/joint_trajectory` | trajectory_msgs/JointTrajectory | 로봇팔 관절 명령 |
| `/roarm/gripper_cmd` | std_msgs/Float64 | 그리퍼 명령 |
| `/goal_pose` | geometry_msgs/PoseStamped | Nav2 목표 지점 |

## 설치

### 사전 요구사항

- Node.js 18+ (WSL 또는 아무 PC)
- RPi에서 `rasp_bringup.launch.py` 실행 중 (rosbridge_server 포함)

### 설치 과정

```bash
git clone https://github.com/<your-username>/ugv_dashboard.git
cd ugv_dashboard
npm install
```

## 실행

### 1. RPi (SSH)

```bash
ssh pi@192.168.0.71
cd ~/ugv_ws && source install/setup.bash
ros2 launch ugv_roarm_description rasp_bringup.launch.py
```

rosbridge_server가 `ws://192.168.0.71:9090`에서 대기합니다.

### 2. 대시보드 (WSL 또는 아무 PC)

```bash
cd ugv_dashboard
npm run dev
```

### 3. 브라우저

`http://localhost:5173` 접속 → rosbridge URL 확인 → **Connect** 클릭

같은 네트워크의 다른 기기(폰, 노트북 등)에서도 `http://<WSL_IP>:5173`으로 접속 가능합니다.

## 빌드 (프로덕션)

```bash
npm run build
```

`dist/` 폴더에 정적 파일이 생성됩니다. 아무 웹 서버에서 서빙하면 됩니다.

## 참고

- **WAVE ROVER**는 엔코더가 없어서 오도메트리 X/Y 위치, 선속도/각속도는 사용 불가
- 위치 추정이 필요하면 LiDAR 기반 SLAM (slam_toolbox) 사용
- LiDAR 스캔 방향은 LD19 물리 장착 기준 +90° 보정 적용됨
- 그리퍼 스케일은 teleop_all.py와 동일 (슬라이더 0°=닫힘, 120°=완전 열림)
