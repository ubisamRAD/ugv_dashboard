<template>
  <v-dialog :model-value="visible" max-width="450" @update:model-value="!$event && $emit('close')">
    <v-card>
      <v-card-title>New Task</v-card-title>
      <v-divider />
      <v-card-text>
        <v-select
          v-model="form.task_type"
          :items="['navigate', 'pick', 'place', 'patrol']"
          label="Type"
          class="mb-2"
        />
        <v-text-field
          v-model.number="form.priority"
          label="Priority (1-10)"
          type="number"
          :min="1"
          :max="10"
          class="mb-2"
        />

        <template v-if="form.task_type === 'navigate'">
          <v-row dense>
            <v-col cols="4">
              <v-text-field v-model.number="nav.x" label="X" type="number" step="0.1" />
            </v-col>
            <v-col cols="4">
              <v-text-field v-model.number="nav.y" label="Y" type="number" step="0.1" />
            </v-col>
            <v-col cols="4">
              <v-text-field v-model.number="nav.theta" label="Theta" type="number" step="0.1" />
            </v-col>
          </v-row>
        </template>

        <template v-if="form.task_type === 'pick' || form.task_type === 'place'">
          <v-row dense>
            <v-col cols="4">
              <v-text-field v-model.number="arm.j1" label="J1" type="number" step="0.1" />
            </v-col>
            <v-col cols="4">
              <v-text-field v-model.number="arm.j2" label="J2" type="number" step="0.1" />
            </v-col>
            <v-col cols="4">
              <v-text-field v-model.number="arm.j3" label="J3" type="number" step="0.1" />
            </v-col>
          </v-row>
        </template>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="$emit('close')">Cancel</v-btn>
        <v-btn color="primary" @click="handleCreate">Create</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { reactive } from 'vue'

defineProps({ visible: Boolean })
const emit = defineEmits(['close', 'create'])

const form = reactive({ task_type: 'navigate', priority: 5 })
const nav = reactive({ x: 0, y: 0, theta: 0 })
const arm = reactive({ j1: 0, j2: 0, j3: 0 })

function handleCreate() {
  let payload = {}
  if (form.task_type === 'navigate') {
    payload = { x: nav.x, y: nav.y, theta: nav.theta }
  } else if (form.task_type === 'pick' || form.task_type === 'place') {
    payload = { positions: [arm.j1, arm.j2, arm.j3] }
  } else if (form.task_type === 'patrol') {
    payload = { waypoints: [] }
  }
  emit('create', { task_type: form.task_type, priority: form.priority, payload })
}
</script>
