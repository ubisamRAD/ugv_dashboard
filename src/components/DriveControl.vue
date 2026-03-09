<template>
  <v-card>
    <v-card-title class="text-overline">Drive Control</v-card-title>
    <v-card-text class="pt-0">
      <div class="dpad mx-auto mb-3">
        <v-btn
          class="dpad-up"
          icon="mdi-arrow-up-bold"
          size="small"
          variant="tonal"
          @pointerdown="startDrive('forward')"
          @pointerup="stopDrive"
          @pointerleave="stopDrive"
        />
        <v-btn
          class="dpad-left"
          icon="mdi-arrow-left-bold"
          size="small"
          variant="tonal"
          @pointerdown="startDrive('left')"
          @pointerup="stopDrive"
          @pointerleave="stopDrive"
        />
        <v-btn
          class="dpad-stop"
          icon="mdi-stop"
          size="small"
          color="error"
          @click="emergencyStop"
        />
        <v-btn
          class="dpad-right"
          icon="mdi-arrow-right-bold"
          size="small"
          variant="tonal"
          @pointerdown="startDrive('right')"
          @pointerup="stopDrive"
          @pointerleave="stopDrive"
        />
        <v-btn
          class="dpad-down"
          icon="mdi-arrow-down-bold"
          size="small"
          variant="tonal"
          @pointerdown="startDrive('backward')"
          @pointerup="stopDrive"
          @pointerleave="stopDrive"
        />
      </div>

      <div class="text-caption text-medium-emphasis mb-1">
        Linear: {{ maxLinear.toFixed(2) }} m/s
      </div>
      <v-slider
        v-model="maxLinear"
        :min="0.05"
        :max="0.5"
        :step="0.05"
        color="primary"
        hide-details
        density="compact"
        class="mb-2"
      />

      <div class="text-caption text-medium-emphasis mb-1">
        Angular: {{ maxAngular.toFixed(1) }} rad/s
      </div>
      <v-slider
        v-model="maxAngular"
        :min="0.1"
        :max="2.0"
        :step="0.1"
        color="primary"
        hide-details
        density="compact"
      />
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { useRobotControl } from '@/composables/useRobotControl'

const { publishCmdVel, stopAll } = useRobotControl()

const maxLinear = ref(0.05)
const maxAngular = ref(1.0)

let driveInterval = null

const directions = {
  forward:  () => [maxLinear.value, 0],
  backward: () => [-maxLinear.value, 0],
  left:     () => [0, maxAngular.value],
  right:    () => [0, -maxAngular.value],
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

onUnmounted(() => stopDrive())
</script>

<style scoped>
.dpad {
  display: grid;
  grid-template-areas:
    ". up ."
    "left stop right"
    ". down .";
  grid-template-columns: 1fr 1fr 1fr;
  gap: 4px;
  max-width: 150px;
}
.dpad-up { grid-area: up; }
.dpad-down { grid-area: down; }
.dpad-left { grid-area: left; }
.dpad-right { grid-area: right; }
.dpad-stop { grid-area: stop; }
</style>
