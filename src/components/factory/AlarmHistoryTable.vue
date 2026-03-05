<template>
  <v-card>
    <v-card-title class="text-subtitle-1">Alarm History</v-card-title>
    <v-divider />
    <v-data-table
      :headers="headers"
      :items="alarms"
      density="compact"
      :items-per-page="10"
      no-data-text="No alarm history"
    >
      <template #item.severity="{ item }">
        <v-chip
          :color="severityColor(item.severity)"
          size="x-small"
          variant="tonal"
          label
          class="text-uppercase font-weight-bold"
        >{{ item.severity }}</v-chip>
      </template>
      <template #item.triggered_at="{ item }">
        <span class="text-caption">{{ formatDate(item.triggered_at) }}</span>
      </template>
      <template #item.acknowledged_at="{ item }">
        <span class="text-caption">{{ item.acknowledged_at ? formatDate(item.acknowledged_at) : '-' }}</span>
      </template>
      <template #item.resolved_at="{ item }">
        <span class="text-caption">{{ item.resolved_at ? formatDate(item.resolved_at) : '-' }}</span>
      </template>
      <template #item.active="{ item }">
        <v-chip
          :color="item.active ? 'error' : 'success'"
          size="x-small"
          variant="tonal"
          label
        >{{ item.active ? 'Active' : 'Resolved' }}</v-chip>
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup>
defineProps({ alarms: { type: Array, default: () => [] } })

const headers = [
  { title: 'Severity', key: 'severity', width: 100 },
  { title: 'Message', key: 'message' },
  { title: 'Triggered', key: 'triggered_at', width: 160 },
  { title: 'Acknowledged', key: 'acknowledged_at', width: 160 },
  { title: 'Resolved', key: 'resolved_at', width: 160 },
  { title: 'Status', key: 'active', width: 100 },
]

function severityColor(s) {
  if (s === 'critical') return 'error'
  if (s === 'warning') return 'warning'
  return 'info'
}

function formatDate(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString()
}
</script>
