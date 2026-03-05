import { ref, watch, readonly } from 'vue'
import { useFactoryApi } from './useFactoryApi'
import { useStomp } from './useStomp'
import { useRobotId } from './useRobotId'

const activeAlarms = ref([])
const alarmHistory = ref([])
const definitions = ref([])
const loading = ref(false)
const latestCritical = ref(null)

let subscribedFor = null

function teardown(rid) {
  const { unsubscribe } = useStomp()
  unsubscribe(`factory/${rid}/alarm`)
}

function setup(rid) {
  const { subscribe } = useStomp()
  subscribe(`factory/${rid}/alarm`, (data) => {
    if (data.active) {
      activeAlarms.value.unshift(data)
      if (data.severity === 'critical') {
        latestCritical.value = data
        // Browser notification
        if (Notification.permission === 'granted') {
          new Notification('UGV Alarm', { body: data.message })
        }
      }
    } else {
      activeAlarms.value = activeAlarms.value.filter((a) => a.id !== data.id)
    }
  })
}

export function useAlarms() {
  const { get, post, del } = useFactoryApi()
  const { isConnected } = useStomp()
  const { robotId } = useRobotId()

  watch([isConnected, robotId], ([connected, rid]) => {
    if (subscribedFor) {
      teardown(subscribedFor)
      subscribedFor = null
    }
    if (connected && rid) {
      activeAlarms.value = []
      latestCritical.value = null
      setup(rid)
      subscribedFor = rid
    }
  }, { immediate: true })

  async function fetchActive() {
    loading.value = true
    const data = await get('/api/alarms/active')
    if (!data?.error) activeAlarms.value = data
    loading.value = false
  }

  async function fetchHistory(limit = 100) {
    const data = await get(`/api/alarms/history?limit=${limit}`)
    if (!data?.error) alarmHistory.value = data
  }

  async function acknowledgeAlarm(id, by = 'operator') {
    const result = await post(`/api/alarms/${id}/acknowledge`, { acknowledged_by: by })
    if (!result?.error) {
      const idx = activeAlarms.value.findIndex((a) => a.id === id)
      if (idx >= 0) activeAlarms.value[idx] = result
    }
  }

  async function resolveAlarm(id) {
    const result = await post(`/api/alarms/${id}/resolve`)
    if (!result?.error) {
      activeAlarms.value = activeAlarms.value.filter((a) => a.id !== id)
    }
  }

  async function fetchDefinitions() {
    const data = await get('/api/alarms/definitions')
    if (!data?.error) definitions.value = data
  }

  async function createDefinition(defn) {
    const result = await post('/api/alarms/definitions', defn)
    if (!result?.error) definitions.value.push(result)
    return result
  }

  async function deleteDefinition(id) {
    await del(`/api/alarms/definitions/${id}`)
    definitions.value = definitions.value.filter((d) => d.id !== id)
  }

  function dismissCritical() {
    latestCritical.value = null
  }

  return {
    activeAlarms: readonly(activeAlarms),
    alarmHistory: readonly(alarmHistory),
    definitions: readonly(definitions),
    loading: readonly(loading),
    latestCritical: readonly(latestCritical),
    fetchActive,
    fetchHistory,
    acknowledgeAlarm,
    resolveAlarm,
    fetchDefinitions,
    createDefinition,
    deleteDefinition,
    dismissCritical
  }
}
