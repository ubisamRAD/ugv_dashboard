<template>
  <div class="panel-card">
    <h3 class="panel-title">Arm Control</h3>

    <div class="joint-controls">
      <div v-for="(joint, idx) in joints" :key="joint.name" class="joint-ctrl">
        <div class="joint-header">
          <span class="joint-label">{{ joint.label }}</span>
          <span class="joint-value">{{ jointDeg(joint.name) }}°</span>
        </div>
        <input
          v-model.number="jointValues[idx]"
          type="range"
          :min="joint.min"
          :max="joint.max"
          step="1"
          class="slider"
          @input="sendArm"
        />
      </div>
    </div>

    <div class="gripper-section">
      <div class="joint-header">
        <span class="joint-label">Gripper</span>
        <span class="joint-value">{{ gripperValue.toFixed(0) }}° ({{ gripperValue === 0 ? 'Closed' : gripperValue >= 120 ? 'Open' : '' }})</span>
      </div>
      <input
        v-model.number="gripperValue"
        type="range"
        min="0"
        max="120"
        step="1"
        class="slider"
        @input="sendGripper"
      />
    </div>

    <button class="home-btn" @click="goHome">Home Position</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRobotControl } from '@/composables/useRobotControl'
import { useRobotState } from '@/composables/useRobotState'

const { publishArmJoint, publishGripper } = useRobotControl()
const { jointPositions } = useRobotState()

const joints = [
  { name: 'arm_base_link_to_arm_link1', label: 'Base', min: -180, max: 180 },
  { name: 'arm_link1_to_arm_link2', label: 'Shoulder', min: -90, max: 90 },
  { name: 'arm_link2_to_arm_link3', label: 'Elbow', min: -180, max: 180 }
]

const jointValues = ref([0, 45, -45])
const gripperValue = ref(0)  // 0°=closed, 120°=fully open

// teleop_all.py constants
const GRIPPER_GRIP_MAX = (2 * Math.PI) / 3  // 120° in rad
const GRIPPER_ESP32_SCALE = 1.5
// Calibration: physical full open reached at slider 80° → scale slider so 120° maps to that
const GRIPPER_SLIDER_SCALE = 80 / 120

function degToRad(deg) {
  return (deg * Math.PI) / 180
}

function jointDeg(name) {
  const rad = jointPositions.value[name]
  if (rad == null) return '--'
  return ((rad * 180) / Math.PI).toFixed(0)
}

function sendArm() {
  const gripRad = degToRad(gripperValue.value * GRIPPER_SLIDER_SCALE)
  const positions = [
    degToRad(jointValues.value[0]),
    degToRad(jointValues.value[1]),
    degToRad(jointValues.value[2]),
    -gripRad  // URDF = -grip_level (axis negation)
  ]
  publishArmJoint(positions)
}

function sendGripper() {
  // Same as teleop_all.py: ESP32 = (GRIP_MAX - grip_level) * SCALE
  const gripRad = degToRad(gripperValue.value * GRIPPER_SLIDER_SCALE)
  const esp32Val = (GRIPPER_GRIP_MAX - gripRad) * GRIPPER_ESP32_SCALE
  publishGripper(esp32Val)
}

function goHome() {
  jointValues.value = [0, 0, 0]
  gripperValue.value = 0
  sendArm()
  sendGripper()
}
</script>

<style scoped>
.panel-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 10px;
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-dim);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.joint-controls {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 6px;
}

.joint-ctrl,
.gripper-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.joint-header {
  display: flex;
  justify-content: space-between;
}

.joint-label {
  font-size: 12px;
  color: var(--color-text-dim);
}

.joint-value {
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--color-accent);
}

.gripper-section {
  margin-bottom: 8px;
  padding-top: 6px;
  border-top: 1px solid var(--color-border);
}

.slider {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--color-surface-alt);
  border-radius: 2px;
  outline: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-accent);
  cursor: pointer;
}

.home-btn {
  width: 100%;
  padding: 6px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  background: var(--color-surface-alt);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  transition: all 0.2s;
}

.home-btn:hover {
  background: var(--color-accent);
  color: #fff;
  border-color: var(--color-accent);
}
</style>
