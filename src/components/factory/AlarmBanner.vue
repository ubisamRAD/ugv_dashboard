<template>
  <v-alert
    v-if="latestCritical"
    type="error"
    prominent
    closable
    density="compact"
    class="alarm-banner"
    @click:close="dismissCritical"
  >
    <template #prepend>
      <v-icon icon="mdi-alert-circle" class="pulse-icon" />
    </template>
    {{ latestCritical.message }}
  </v-alert>
</template>

<script setup>
import { useAlarms } from '@/composables/useAlarms'

const { latestCritical, dismissCritical } = useAlarms()
</script>

<style scoped>
.alarm-banner {
  border-radius: 0;
}
.pulse-icon {
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>
