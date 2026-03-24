<template>
  <v-app-bar density="compact" color="surface" elevation="1">
    <v-app-bar-title class="text-primary font-weight-bold" style="flex: none">
      UGV Dashboard
    </v-app-bar-title>

    <v-tabs class="ml-4" density="compact" color="primary">
      <v-tab to="/" exact>Control</v-tab>
      <v-tab to="/logs">Logs</v-tab>
    </v-tabs>

    <v-spacer />

    <div class="d-flex align-center ga-2 mr-2">
      <v-chip
        :color="isConnected ? 'success' : 'error'"
        size="small"
        variant="flat"
        label
      >
        <v-icon start size="x-small">
          {{ isConnected ? 'mdi-check-circle' : 'mdi-close-circle' }}
        </v-icon>
        {{ isConnected ? 'Connected' : 'Disconnected' }}
      </v-chip>

      <v-select
        v-model="selectedRobot"
        :items="availableRobots"
        :disabled="!isConnected || availableRobots.length === 0"
        hide-details
        density="compact"
        variant="outlined"
        style="min-width: 140px; max-width: 180px"
        placeholder="Robot"
      />

      <v-text-field
        v-model="brokerUrl"
        placeholder="ws://localhost:15674/ws"
        :disabled="isConnected"
        hide-details
        density="compact"
        variant="outlined"
        style="min-width: 320px"
        class="text-mono"
        @keyup.enter="handleConnect"
        @focus="onFocus"
      />

      <v-btn
        :color="isConnected ? 'error' : 'primary'"
        size="small"
        @click="handleConnect"
      >
        {{ isConnected ? 'Disconnect' : 'Connect' }}
      </v-btn>
    </div>
  </v-app-bar>
</template>

<script setup>
import { watch, computed } from 'vue'
import { useStomp } from '@/composables/useStomp'
import { useRobotId } from '@/composables/useRobotId'

const { brokerUrl, connectedHost, isConnected, connect, disconnect } = useStomp()
const { robotId, setRobotId, availableRobots, fetchRobots } = useRobotId()

const selectedRobot = computed({
  get: () => robotId.value,
  set: (val) => setRobotId(val),
})

watch(isConnected, (connected) => {
  if (connected) {
    fetchRobots()
  }
})

function onFocus(e) {
  // Move cursor to start so full URL is visible
  const input = e.target
  setTimeout(() => input.setSelectionRange(0, 0), 0)
}

function handleConnect() {
  if (isConnected.value) {
    disconnect()
  } else {
    connect(brokerUrl.value)
  }
}
</script>

<style scoped>
.text-mono :deep(input) {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  text-overflow: ellipsis;
  direction: ltr;
}
</style>
