<template>
  <div class="panel-card">
    <h3 class="panel-title">Robot Status</h3>

    <div class="status-section">
      <div class="stat-row">
        <span class="stat-label">Battery</span>
        <span :class="['stat-value', { warn: battery < 9 }]">
          {{ battery.toFixed(1) }} V
        </span>
      </div>
      <div class="battery-bar">
        <div
          class="battery-fill"
          :style="{ width: batteryPercent + '%' }"
          :class="{ low: batteryPercent < 20 }"
        ></div>
      </div>
    </div>

    <div class="status-section">
      <div class="stat-row">
        <span class="stat-label">Yaw (IMU)</span>
        <span class="stat-value">{{ (orientation * 180 / Math.PI).toFixed(1) }}°</span>
      </div>
    </div>

    <div class="status-section">
      <div class="section-label">Arm Joints</div>
      <div class="joint-list">
        <div v-for="(label, key) in armJointLabels" :key="key" class="joint-row">
          <span class="joint-name">{{ label }}</span>
          <span class="joint-val">{{ formatJoint(key) }}°</span>
        </div>
      </div>
    </div>

    <div class="status-section">
      <div class="section-label">Navigation</div>
      <div class="stat-row">
        <span class="stat-label">Status</span>
        <span :class="['stat-value', navStatusClass]">{{ navStatus.status }}</span>
      </div>
      <template v-if="navStatus.goalX != null">
        <div class="stat-row">
          <span class="stat-label">Goal</span>
          <span class="stat-value mono-sm">({{ navStatus.goalX.toFixed(2) }}, {{ navStatus.goalY.toFixed(2) }})</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Heading</span>
          <span class="stat-value mono-sm">{{ (navStatus.goalTheta * 180 / Math.PI).toFixed(1) }}°</span>
        </div>
      </template>
      <div v-if="navStatus.distance != null" class="stat-row">
        <span class="stat-label">Remaining</span>
        <span class="stat-value mono-sm">{{ navStatus.distance.toFixed(2) }} m</span>
      </div>
      <button
        v-if="navStatus.status === 'navigating'"
        class="nav-cancel-btn"
        @click="cancelNavigation"
      >Cancel Navigation</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRobotState } from '@/composables/useRobotState'
import { useMap } from '@/composables/useMap'

const {
  battery,
  orientation,
  jointPositions
} = useRobotState()

const { navStatus, cancelNavigation } = useMap()

const navStatusClass = computed(() => {
  const s = navStatus.value.status
  if (s === 'navigating') return 'nav-active'
  if (s === 'succeeded') return 'nav-ok'
  if (s === 'failed' || s === 'canceled') return 'nav-err'
  return ''
})

const armJointLabels = {
  arm_base_link_to_arm_link1: 'Base',
  arm_link1_to_arm_link2: 'Shoulder',
  arm_link2_to_arm_link3: 'Elbow',
  arm_link3_to_arm_gripper_link: 'Gripper'
}

const batteryPercent = computed(() => {
  const min = 7.5
  const max = 12.6
  return Math.max(0, Math.min(100, ((battery.value - min) / (max - min)) * 100))
})

function formatJoint(key) {
  const rad = jointPositions.value[key]
  if (rad == null) return '--'
  return (rad * 180 / Math.PI).toFixed(1)
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

.status-section {
  margin-bottom: 8px;
}

.status-section:last-child {
  margin-bottom: 0;
}

.section-label {
  font-size: 11px;
  color: var(--color-text-dim);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-dim);
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  font-family: var(--font-mono);
}

.stat-value.warn {
  color: var(--color-danger);
}

.battery-bar {
  height: 6px;
  background: var(--color-surface-alt);
  border-radius: 3px;
  overflow: hidden;
}

.battery-fill {
  height: 100%;
  background: var(--color-success);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.battery-fill.low {
  background: var(--color-danger);
}

.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 3px 6px;
  background: var(--color-surface-alt);
  border-radius: 4px;
}

.stat-key {
  font-size: 11px;
  color: var(--color-text-dim);
}

.stat-val {
  font-size: 12px;
  font-family: var(--font-mono);
}

.joint-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.joint-row {
  display: flex;
  justify-content: space-between;
  padding: 3px 6px;
  background: var(--color-surface-alt);
  border-radius: 4px;
  font-size: 12px;
}

.joint-name {
  color: var(--color-text-dim);
}

.joint-val {
  font-family: var(--font-mono);
}

.mono-sm {
  font-size: 12px;
}

.nav-active {
  color: var(--color-accent, #4e8cff);
}

.nav-ok {
  color: var(--color-success, #34d399);
}

.nav-err {
  color: var(--color-danger, #f87171);
}

.nav-cancel-btn {
  width: 100%;
  margin-top: 6px;
  padding: 5px 0;
  background: rgba(248, 113, 113, 0.15);
  border: 1px solid rgba(248, 113, 113, 0.4);
  color: #f87171;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-family: var(--font-mono);
}

.nav-cancel-btn:hover {
  background: rgba(248, 113, 113, 0.3);
}
</style>
