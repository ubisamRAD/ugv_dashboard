<template>
  <v-container fluid>
    <v-row align="center" class="mb-4">
      <v-col cols="auto">
        <h2 class="text-h6">Alarms</h2>
      </v-col>
      <v-spacer />
      <v-col cols="auto">
        <v-btn variant="outlined" size="small" prepend-icon="mdi-refresh" @click="refresh">
          Refresh
        </v-btn>
      </v-col>
    </v-row>

    <AlarmPanel
      :alarms="activeAlarms"
      class="mb-4"
      @acknowledge="acknowledgeAlarm"
      @resolve="resolveAlarm"
    />

    <AlarmHistoryTable :alarms="alarmHistory" class="mb-4" />

    <!-- Alarm Rules -->
    <v-card>
      <v-card-title class="d-flex align-center">
        <span class="text-subtitle-1">Alarm Rules</span>
        <v-spacer />
        <v-btn
          :color="showDefnForm ? 'default' : 'primary'"
          size="small"
          @click="showDefnForm = !showDefnForm"
        >{{ showDefnForm ? 'Cancel' : '+ Add Rule' }}</v-btn>
      </v-card-title>
      <v-divider />

      <v-expand-transition>
        <v-card-text v-if="showDefnForm">
          <v-row dense>
            <v-col cols="6">
              <v-text-field v-model="newDefn.name" label="Name" />
            </v-col>
            <v-col cols="6">
              <v-select
                v-model="newDefn.severity"
                :items="['info', 'warning', 'critical']"
                label="Severity"
              />
            </v-col>
          </v-row>
          <v-row dense>
            <v-col cols="5">
              <v-text-field v-model="newDefn.condition_metric" label="Metric (e.g. battery)" />
            </v-col>
            <v-col cols="3">
              <v-select
                v-model="newDefn.condition_operator"
                :items="['<', '<=', '>', '>=']"
                label="Operator"
              />
            </v-col>
            <v-col cols="4">
              <v-text-field v-model.number="newDefn.condition_value" label="Value" type="number" />
            </v-col>
          </v-row>
          <v-row dense>
            <v-col cols="9">
              <v-text-field v-model="newDefn.message_template" label="Message (use {value})" />
            </v-col>
            <v-col cols="3" class="d-flex align-center">
              <v-btn color="success" block @click="handleCreateDefn">Save</v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-expand-transition>

      <v-list density="compact" class="pa-0" style="max-height: 300px; overflow-y: auto">
        <v-list-item v-for="d in definitions" :key="d.id">
          <template #prepend>
            <v-chip
              :color="severityColor(d.severity)"
              size="x-small"
              variant="tonal"
              label
              class="text-uppercase font-weight-bold mr-2"
            >{{ d.severity }}</v-chip>
          </template>
          <v-list-item-title class="text-body-2 font-weight-medium">{{ d.name }}</v-list-item-title>
          <v-list-item-subtitle class="text-caption" style="font-family: monospace">
            {{ d.condition_metric }} {{ d.condition_operator }} {{ d.condition_value }}
          </v-list-item-subtitle>
          <template #append>
            <v-btn icon="mdi-delete" size="x-small" color="error" variant="text" @click="deleteDefinition(d.id)" />
          </template>
        </v-list-item>
      </v-list>
    </v-card>
  </v-container>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import AlarmPanel from '@/components/factory/AlarmPanel.vue'
import AlarmHistoryTable from '@/components/factory/AlarmHistoryTable.vue'
import { useAlarms } from '@/composables/useAlarms'

const {
  activeAlarms, alarmHistory, definitions,
  fetchActive, fetchHistory, acknowledgeAlarm, resolveAlarm,
  fetchDefinitions, createDefinition, deleteDefinition,
} = useAlarms()

const showDefnForm = ref(false)
const newDefn = reactive({
  name: '',
  severity: 'warning',
  condition_metric: '',
  condition_operator: '<',
  condition_value: 0,
  message_template: '',
  cooldown_seconds: 60,
})

function severityColor(s) {
  if (s === 'critical') return 'error'
  if (s === 'warning') return 'warning'
  return 'info'
}

function refresh() {
  fetchActive()
  fetchHistory()
}

async function handleCreateDefn() {
  await createDefinition({ ...newDefn })
  showDefnForm.value = false
  Object.assign(newDefn, {
    name: '', severity: 'warning', condition_metric: '',
    condition_operator: '<', condition_value: 0, message_template: '',
  })
}

onMounted(() => {
  fetchActive()
  fetchHistory()
  fetchDefinitions()
  if (Notification.permission === 'default') {
    Notification.requestPermission()
  }
})
</script>
