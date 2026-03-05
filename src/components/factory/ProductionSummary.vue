<template>
  <v-row>
    <v-col v-for="kpi in kpis" :key="kpi.label" cols="12" sm="6" md="3">
      <v-card>
        <v-card-text>
          <div class="text-caption text-medium-emphasis mb-1">{{ kpi.label }}</div>
          <div class="text-h5 font-weight-bold" :class="kpi.colorClass">{{ kpi.value }}</div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ data: Object })

const kpis = computed(() => {
  const d = props.data
  const rate = d?.success_rate
  const rateColor = !rate ? '' : rate >= 90 ? 'text-success' : rate >= 70 ? 'text-warning' : 'text-error'

  let uptime = '-'
  if (d?.uptime_seconds) {
    const h = Math.floor(d.uptime_seconds / 3600)
    const m = Math.floor((d.uptime_seconds % 3600) / 60)
    uptime = `${h}h ${m}m`
  }

  return [
    { label: 'Tasks Completed', value: d?.tasks_completed ?? '-', colorClass: 'text-success' },
    { label: 'Success Rate', value: rate != null ? rate + '%' : '-', colorClass: rateColor },
    { label: 'Total Distance', value: d?.total_distance != null ? d.total_distance.toFixed(1) + ' m' : '-', colorClass: '' },
    { label: 'Uptime', value: uptime, colorClass: '' },
  ]
})
</script>
