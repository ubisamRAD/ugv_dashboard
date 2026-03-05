<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <span class="text-subtitle-1">{{ title }}</span>
      <v-spacer />
      <v-select
        v-model="selectedMetric"
        :items="metricItems"
        density="compact"
        hide-details
        style="max-width: 160px"
        class="mr-2"
        @update:model-value="$emit('metric-change', selectedMetric)"
      />
      <v-select
        v-model="selectedPeriod"
        :items="periodItems"
        density="compact"
        hide-details
        style="max-width: 120px"
        @update:model-value="$emit('period-change', selectedPeriod)"
      />
    </v-card-title>
    <v-divider />
    <v-card-text style="height: 300px">
      <Line v-if="chartData.datasets[0].data.length > 0" :data="chartData" :options="chartOptions" />
      <div v-else class="d-flex align-center justify-center h-100 text-medium-emphasis text-body-2">
        No telemetry data available
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler)

const props = defineProps({
  title: { type: String, default: 'Telemetry' },
  points: { type: Array, default: () => [] },
})

defineEmits(['metric-change', 'period-change'])

const metricItems = [
  { title: 'Battery (V)', value: 'battery' },
  { title: 'Linear Vel (m/s)', value: 'linear_vel' },
  { title: 'Angular Vel (rad/s)', value: 'angular_vel' },
  { title: 'Position X', value: 'x' },
  { title: 'Position Y', value: 'y' },
]

const periodItems = [
  { title: '1 Hour', value: '1h' },
  { title: '6 Hours', value: '6h' },
  { title: '24 Hours', value: '24h' },
  { title: '7 Days', value: '7d' },
]

const selectedMetric = ref('battery')
const selectedPeriod = ref('1h')

const chartData = computed(() => ({
  labels: props.points.map((p) => {
    const d = new Date(p.time)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }),
  datasets: [
    {
      label: selectedMetric.value,
      data: props.points.map((p) => p.value),
      borderColor: '#4fc3f7',
      backgroundColor: 'rgba(79, 195, 247, 0.1)',
      fill: true,
      tension: 0.3,
      pointRadius: 0,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { mode: 'index', intersect: false },
  },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.06)' },
      ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 }, maxTicksLimit: 10 },
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.06)' },
      ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } },
    },
  },
}
</script>

<style scoped>
.h-100 { height: 100%; }
</style>
