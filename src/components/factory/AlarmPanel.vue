<template>
  <v-card>
    <v-card-title class="text-subtitle-1">
      Active Alarms ({{ alarms.length }})
    </v-card-title>
    <v-divider />
    <div v-if="alarms.length === 0" class="text-center text-medium-emphasis pa-6 text-body-2">
      No active alarms
    </div>
    <v-list density="compact" class="pa-0" style="max-height: 400px; overflow-y: auto">
      <v-list-item
        v-for="alarm in alarms"
        :key="alarm.id"
        :class="borderClass(alarm.severity)"
      >
        <template #prepend>
          <v-chip
            :color="severityColor(alarm.severity)"
            size="x-small"
            variant="tonal"
            label
            class="text-uppercase font-weight-bold"
          >{{ alarm.severity }}</v-chip>
        </template>
        <v-list-item-title class="text-body-2">{{ alarm.message }}</v-list-item-title>
        <v-list-item-subtitle class="text-caption">{{ formatTime(alarm.triggered_at) }}</v-list-item-subtitle>
        <template #append>
          <div class="d-flex ga-1">
            <v-btn
              v-if="!alarm.acknowledged"
              color="warning"
              size="x-small"
              variant="flat"
              @click="$emit('acknowledge', alarm.id)"
            >ACK</v-btn>
            <v-btn
              color="success"
              size="x-small"
              variant="flat"
              @click="$emit('resolve', alarm.id)"
            >Resolve</v-btn>
          </div>
        </template>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script setup>
defineProps({ alarms: { type: Array, default: () => [] } })
defineEmits(['acknowledge', 'resolve'])

function severityColor(s) {
  if (s === 'critical') return 'error'
  if (s === 'warning') return 'warning'
  return 'info'
}

function borderClass(s) {
  if (s === 'critical') return 'border-l-error'
  if (s === 'warning') return 'border-l-warning'
  return 'border-l-info'
}

function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString()
}
</script>

<style scoped>
.border-l-error { border-left: 3px solid rgb(var(--v-theme-error)); }
.border-l-warning { border-left: 3px solid rgb(var(--v-theme-warning)); }
.border-l-info { border-left: 3px solid rgb(var(--v-theme-info)); }
</style>
