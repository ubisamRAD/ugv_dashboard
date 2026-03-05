<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <span class="text-subtitle-1">Task Queue</span>
      <v-spacer />
      <v-btn-toggle
        :model-value="activeFilter"
        density="compact"
        color="primary"
        mandatory
        @update:model-value="$emit('filter', $event)"
      >
        <v-btn v-for="f in filters" :key="f.value" :value="f.value" size="x-small">
          {{ f.label }}
        </v-btn>
      </v-btn-toggle>
    </v-card-title>
    <v-divider />
    <div v-if="tasks.length === 0" class="text-center text-medium-emphasis pa-6 text-body-2">
      No tasks
    </div>
    <v-list density="compact" class="pa-0" style="max-height: 500px; overflow-y: auto">
      <v-list-item
        v-for="task in tasks"
        :key="task.id"
        :active="selectedId === task.id"
        @click="$emit('select', task.id)"
      >
        <template #prepend>
          <v-icon :color="statusColor(task.status)" size="x-small">mdi-circle</v-icon>
        </template>
        <v-list-item-title class="text-body-2 font-weight-medium">
          {{ task.task_type }}
          <v-chip size="x-small" variant="tonal" class="ml-1">P{{ task.priority }}</v-chip>
        </v-list-item-title>
        <template #append>
          <v-chip
            :color="statusColor(task.status)"
            size="x-small"
            variant="tonal"
            label
            class="text-uppercase font-weight-bold mr-2"
          >{{ task.status }}</v-chip>
          <span class="text-caption text-medium-emphasis">{{ timeAgo(task.created_at) }}</span>
        </template>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script setup>
defineProps({
  tasks: { type: Array, default: () => [] },
  selectedId: { type: Number, default: null },
  activeFilter: { type: String, default: '' },
})
defineEmits(['select', 'filter'])

const filters = [
  { label: 'All', value: '' },
  { label: 'Queued', value: 'queued' },
  { label: 'Running', value: 'running' },
  { label: 'Done', value: 'succeeded' },
  { label: 'Failed', value: 'failed' },
]

function statusColor(s) {
  if (s === 'queued') return 'primary'
  if (s === 'running') return 'warning'
  if (s === 'succeeded') return 'success'
  if (s === 'failed') return 'error'
  return 'default'
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}
</script>
