<template>
  <v-container fluid>
    <v-row align="center" class="mb-4">
      <v-col cols="auto">
        <h2 class="text-h6">Task Queue</h2>
      </v-col>
      <v-spacer />
      <v-col cols="auto">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="showCreate = true">
          New Task
        </v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="8">
        <TaskQueuePanel
          :tasks="tasks"
          :selected-id="selectedId"
          :active-filter="filter"
          @select="selectedId = $event"
          @filter="handleFilter"
        />
      </v-col>
      <v-col cols="12" md="4">
        <TaskDetailCard
          v-if="selectedTask"
          :task="selectedTask"
          @execute="executeTask($event)"
          @cancel="updateTask($event, { status: 'canceled' })"
          @delete="handleDelete"
        />
        <v-card v-else class="d-flex align-center justify-center" min-height="200">
          <span class="text-medium-emphasis text-body-2">Select a task to view details</span>
        </v-card>
      </v-col>
    </v-row>

    <TaskCreateDialog
      :visible="showCreate"
      @close="showCreate = false"
      @create="handleCreate"
    />
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import TaskQueuePanel from '@/components/factory/TaskQueuePanel.vue'
import TaskDetailCard from '@/components/factory/TaskDetailCard.vue'
import TaskCreateDialog from '@/components/factory/TaskCreateDialog.vue'
import { useTaskQueue } from '@/composables/useTaskQueue'

const { tasks, fetchTasks, createTask, updateTask, deleteTask, executeTask } = useTaskQueue()

const selectedId = ref(null)
const showCreate = ref(false)
const filter = ref('')

const selectedTask = computed(() => tasks.value.find((t) => t.id === selectedId.value))

function handleFilter(f) {
  filter.value = f
  fetchTasks(f || null)
}

async function handleCreate(data) {
  await createTask(data)
  showCreate.value = false
}

async function handleDelete(id) {
  await deleteTask(id)
  selectedId.value = null
}

onMounted(() => fetchTasks())
</script>
