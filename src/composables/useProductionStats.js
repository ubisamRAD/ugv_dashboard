import { ref, readonly } from 'vue'
import { useFactoryApi } from './useFactoryApi'

const summary = ref(null)
const telemetry = ref([])
const loading = ref(false)

export function useProductionStats() {
  const { get } = useFactoryApi()

  async function fetchSummary(period = '24h') {
    loading.value = true
    const data = await get(`/api/stats/summary?period=${period}`)
    if (!data?.error) {
      summary.value = data
    }
    loading.value = false
  }

  async function fetchTelemetry(metric = 'battery', resolution = '1m', period = '1h') {
    const data = await get(
      `/api/stats/telemetry?metric=${metric}&resolution=${resolution}&period=${period}`
    )
    if (!data?.error) {
      telemetry.value = data
    }
    return data
  }

  return {
    summary: readonly(summary),
    telemetry: readonly(telemetry),
    loading: readonly(loading),
    fetchSummary,
    fetchTelemetry
  }
}
