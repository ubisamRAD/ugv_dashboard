<template>
  <v-container fluid>
    <v-row align="center" class="mb-4">
      <v-col cols="auto">
        <h2 class="text-h6">Production Monitoring</h2>
      </v-col>
      <v-spacer />
      <v-col cols="auto">
        <v-btn-toggle v-model="period" density="compact" color="primary" mandatory>
          <v-btn v-for="p in periods" :key="p" :value="p" size="small" @click="changePeriod(p)">
            {{ p }}
          </v-btn>
        </v-btn-toggle>
      </v-col>
    </v-row>

    <ProductionSummary :data="summary" class="mb-4" />
    <ProductionChart
      title="Telemetry"
      :points="telemetry"
      @metric-change="changeMetric"
      @period-change="changeTelemetryPeriod"
    />
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ProductionSummary from '@/components/factory/ProductionSummary.vue'
import ProductionChart from '@/components/factory/ProductionChart.vue'
import { useProductionStats } from '@/composables/useProductionStats'

const { summary, telemetry, fetchSummary, fetchTelemetry } = useProductionStats()

const periods = ['1h', '6h', '24h', '7d']
const period = ref('24h')
const metric = ref('battery')
const telemetryPeriod = ref('1h')

const resolutionMap = { '1h': '1m', '6h': '5m', '24h': '30m', '7d': '4h' }

function changePeriod(p) {
  period.value = p
  fetchSummary(p)
}

function changeMetric(m) {
  metric.value = m
  fetchTelemetry(m, resolutionMap[telemetryPeriod.value], telemetryPeriod.value)
}

function changeTelemetryPeriod(p) {
  telemetryPeriod.value = p
  fetchTelemetry(metric.value, resolutionMap[p], p)
}

onMounted(() => {
  fetchSummary(period.value)
  fetchTelemetry(metric.value, '1m', telemetryPeriod.value)
})
</script>
