<template>
  <div class="panel-card">
    <h3 class="panel-title">Drive Control</h3>

    <div class="dpad">
      <button
        class="dpad-btn up"
        @pointerdown="startDrive('forward')"
        @pointerup="stopDrive"
        @pointerleave="stopDrive"
      >W</button>
      <button
        class="dpad-btn left"
        @pointerdown="startDrive('left')"
        @pointerup="stopDrive"
        @pointerleave="stopDrive"
      >A</button>
      <button class="dpad-btn stop" @click="emergencyStop">STOP</button>
      <button
        class="dpad-btn right"
        @pointerdown="startDrive('right')"
        @pointerup="stopDrive"
        @pointerleave="stopDrive"
      >D</button>
      <button
        class="dpad-btn down"
        @pointerdown="startDrive('backward')"
        @pointerup="stopDrive"
        @pointerleave="stopDrive"
      >S</button>
    </div>

    <div class="sliders">
      <div class="slider-row">
        <label class="slider-label">Linear: {{ maxLinear.toFixed(1) }} m/s</label>
        <input
          v-model.number="maxLinear"
          type="range"
          min="0.05"
          max="0.5"
          step="0.05"
          class="slider"
        />
      </div>
      <div class="slider-row">
        <label class="slider-label">Angular: {{ maxAngular.toFixed(1) }} rad/s</label>
        <input
          v-model.number="maxAngular"
          type="range"
          min="0.1"
          max="2.0"
          step="0.1"
          class="slider"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { useRobotControl } from '@/composables/useRobotControl'

const { publishCmdVel, stopAll } = useRobotControl()

const maxLinear = ref(0.2)
const maxAngular = ref(1.0)

let driveInterval = null

const directions = {
  forward:  () => [maxLinear.value, 0],
  backward: () => [-maxLinear.value, 0],
  left:     () => [0, maxAngular.value],
  right:    () => [0, -maxAngular.value]
}

function startDrive(dir) {
  stopDrive()
  const getVel = directions[dir]
  const [lin, ang] = getVel()
  publishCmdVel(lin, ang)

  driveInterval = setInterval(() => {
    const [l, a] = getVel()
    publishCmdVel(l, a)
  }, 100)
}

function stopDrive() {
  if (driveInterval) {
    clearInterval(driveInterval)
    driveInterval = null
  }
  stopAll()
}

function emergencyStop() {
  stopDrive()
}

onUnmounted(() => {
  stopDrive()
})
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

.dpad {
  display: grid;
  grid-template-areas:
    ". up ."
    "left stop right"
    ". down .";
  grid-template-columns: 1fr 1fr 1fr;
  gap: 4px;
  max-width: 160px;
  margin: 0 auto 10px;
}

.dpad-btn {
  aspect-ratio: 1;
  border-radius: 6px;
  font-weight: 700;
  font-size: 14px;
  color: var(--color-text);
  background: var(--color-surface-alt);
  border: 1px solid var(--color-border);
  transition: all 0.15s;
  user-select: none;
  touch-action: none;
}

.dpad-btn:active {
  background: var(--color-accent);
  color: #fff;
  transform: scale(0.95);
}

.dpad-btn.up { grid-area: up; }
.dpad-btn.down { grid-area: down; }
.dpad-btn.left { grid-area: left; }
.dpad-btn.right { grid-area: right; }

.dpad-btn.stop {
  grid-area: stop;
  background: var(--color-danger);
  color: #fff;
  font-size: 10px;
  letter-spacing: 0.5px;
}

.dpad-btn.stop:active {
  background: #dc2626;
}

.sliders {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.slider-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.slider-label {
  font-size: 11px;
  color: var(--color-text-dim);
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
</style>
