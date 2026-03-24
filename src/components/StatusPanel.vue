<template>
  <v-card>
    <v-card-title class="text-overline">Robot Status</v-card-title>
    <v-card-text class="pt-0">
      <!-- Battery -->
      <div class="d-flex justify-space-between align-center mb-1">
        <span class="text-caption text-medium-emphasis">Battery</span>
        <span class="text-body-2 font-weight-bold" :class="{ 'text-error': battery < 9 }">
          {{ battery.toFixed(1) }} V
        </span>
      </div>
      <v-progress-linear
        :model-value="batteryPercent"
        :color="batteryPercent < 20 ? 'error' : 'success'"
        height="6"
        rounded
        class="mb-3"
      />

      <!-- Yaw -->
      <div class="d-flex justify-space-between align-center mb-1">
        <span class="text-caption text-medium-emphasis">Yaw (LiDAR odom)</span>
        <span class="text-body-2 font-weight-bold">{{ (orientation * 180 / Math.PI).toFixed(1) }}°</span>
      </div>
      <div class="d-flex justify-space-between align-center mb-3">
        <span class="text-caption text-medium-emphasis">Yaw (IMU 센서)</span>
        <span class="text-body-2 font-weight-bold">{{ (imuYaw * 180 / Math.PI).toFixed(1) }}°</span>
      </div>

      <!-- Arm Joints -->
      <div class="text-overline mb-1">Arm Joints</div>
      <v-list density="compact" class="pa-0 mb-3">
        <v-list-item
          v-for="(label, key) in armJointLabels"
          :key="key"
          class="px-2"
          min-height="28"
        >
          <template #prepend>
            <span class="text-caption text-medium-emphasis">{{ label }}</span>
          </template>
          <template #append>
            <span class="text-caption font-weight-bold text-primary">{{ formatJoint(key) }}°</span>
          </template>
        </v-list-item>
      </v-list>

      <!-- Navigation -->
      <div class="text-overline mb-1">Navigation</div>
      <div class="d-flex justify-space-between align-center mb-1">
        <span class="text-caption text-medium-emphasis">Status</span>
        <v-chip
          :color="navChipColor"
          size="x-small"
          variant="tonal"
          label
        >{{ navStatus.status }}</v-chip>
      </div>
      <template v-if="navStatus.goalX != null">
        <div class="d-flex justify-space-between align-center mb-1">
          <span class="text-caption text-medium-emphasis">Goal</span>
          <span class="text-caption">({{ navStatus.goalX.toFixed(2) }}, {{ navStatus.goalY.toFixed(2) }})</span>
        </div>
        <div class="d-flex justify-space-between align-center mb-1">
          <span class="text-caption text-medium-emphasis">Heading</span>
          <span class="text-caption">{{ (navStatus.goalTheta * 180 / Math.PI).toFixed(1) }}°</span>
        </div>
      </template>
      <div v-if="navStatus.distance != null" class="d-flex justify-space-between align-center mb-1">
        <span class="text-caption text-medium-emphasis">Remaining</span>
        <span class="text-caption">{{ navStatus.distance.toFixed(2) }} m</span>
      </div>
      <v-btn
        v-if="navStatus.status === 'navigating'"
        color="error"
        variant="outlined"
        size="small"
        block
        class="mt-2"
        @click="cancelNavigation"
      >Cancel Navigation</v-btn>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { useRobotState } from '@/composables/useRobotState'
import { useMap } from '@/composables/useMap'

const { battery, orientation, imuYaw, jointPositions } = useRobotState()
const { navStatus, cancelNavigation } = useMap()

const navChipColor = computed(() => {
  const s = navStatus.value.status
  if (s === 'navigating') return 'primary'
  if (s === 'succeeded') return 'success'
  if (s === 'failed' || s === 'canceled') return 'error'
  return 'default'
})

const armJointLabels = {
  arm_base_link_to_arm_link1: 'Base',
  arm_link1_to_arm_link2: 'Shoulder',
  arm_link2_to_arm_link3: 'Elbow',
  arm_link3_to_arm_gripper_link: 'Gripper',
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
