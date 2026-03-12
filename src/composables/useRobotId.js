import { computed, ref } from 'vue'
import store from '@/plugins/stores'

const factoryHost = import.meta.env.VITE_ROBOT_HOST || 'localhost'
const factoryPort = import.meta.env.VITE_FACTORY_API_PORT || '8082'
const availableRobots = ref([])

export function useRobotId() {
  const robotId = computed(() => store.state.robotId)

  function setRobotId(id) {
    store.commit('setRobotId', id)
  }

  async function fetchRobots() {
    try {
      const res = await fetch(`http://${factoryHost}:${factoryPort}/api/robots`)
      const data = await res.json()
      if (Array.isArray(data)) {
        availableRobots.value = data.map((r) => r.id)
      }
    } catch {
      // ignore fetch errors
    }
  }

  return {
    robotId,
    setRobotId,
    availableRobots,
    fetchRobots,
  }
}
