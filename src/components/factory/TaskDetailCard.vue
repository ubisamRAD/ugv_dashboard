<template>
  <v-card v-if="task">
    <v-card-title class="d-flex align-center ga-2">
      <v-chip
        :color="statusColor(task.status)"
        size="small"
        variant="tonal"
        label
        class="text-uppercase font-weight-bold"
      >{{ task.status }}</v-chip>
      <span class="text-subtitle-1 font-weight-bold">{{ task.task_type }}</span>
      <v-spacer />
      <span class="text-caption text-medium-emphasis">#{{ task.id }}</span>
    </v-card-title>
    <v-divider />
    <v-card-text>
      <v-list density="compact" class="pa-0">
        <v-list-item>
          <template #prepend><span class="text-caption text-medium-emphasis" style="width:80px">Priority</span></template>
          <v-list-item-title class="text-body-2">{{ task.priority }}</v-list-item-title>
        </v-list-item>
        <v-list-item>
          <template #prepend><span class="text-caption text-medium-emphasis" style="width:80px">Robot</span></template>
          <v-list-item-title class="text-body-2">{{ task.robot_id }}</v-list-item-title>
        </v-list-item>
        <v-list-item>
          <template #prepend><span class="text-caption text-medium-emphasis" style="width:80px">Created</span></template>
          <v-list-item-title class="text-body-2">{{ formatDate(task.created_at) }}</v-list-item-title>
        </v-list-item>
        <v-list-item v-if="task.started_at">
          <template #prepend><span class="text-caption text-medium-emphasis" style="width:80px">Started</span></template>
          <v-list-item-title class="text-body-2">{{ formatDate(task.started_at) }}</v-list-item-title>
        </v-list-item>
        <v-list-item v-if="task.completed_at">
          <template #prepend><span class="text-caption text-medium-emphasis" style="width:80px">Completed</span></template>
          <v-list-item-title class="text-body-2">{{ formatDate(task.completed_at) }}</v-list-item-title>
        </v-list-item>
        <v-list-item v-if="task.payload">
          <template #prepend><span class="text-caption text-medium-emphasis" style="width:80px">Payload</span></template>
          <v-list-item-title class="text-caption" style="font-family: monospace">{{ JSON.stringify(task.payload) }}</v-list-item-title>
        </v-list-item>
        <v-list-item v-if="task.error_message">
          <template #prepend><span class="text-caption text-medium-emphasis" style="width:80px">Error</span></template>
          <v-list-item-title class="text-body-2 text-error">{{ task.error_message }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card-text>
    <v-divider />
    <v-card-actions>
      <v-btn
        v-if="task.status === 'queued'"
        color="primary"
        size="small"
        @click="$emit('execute', task.id)"
      >Execute Now</v-btn>
      <v-btn
        v-if="task.status === 'queued' || task.status === 'running'"
        color="error"
        size="small"
        @click="$emit('cancel', task.id)"
      >Cancel</v-btn>
      <v-spacer />
      <v-btn
        v-if="task.status !== 'running'"
        variant="outlined"
        size="small"
        @click="$emit('delete', task.id)"
      >Delete</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
defineProps({ task: Object })
defineEmits(['execute', 'cancel', 'delete'])

function statusColor(s) {
  if (s === 'queued') return 'primary'
  if (s === 'running') return 'warning'
  if (s === 'succeeded') return 'success'
  if (s === 'failed') return 'error'
  return 'default'
}

function formatDate(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString()
}
</script>
