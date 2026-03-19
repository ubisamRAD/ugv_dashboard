import { computed } from 'vue'
import store from '@/plugins/stores'

export function useRobotId() {
  const robotId = computed(() => store.state.robotId)

  function setRobotId(id) {
    store.commit('setRobotId', id)
  }

  return {
    robotId,
    setRobotId,
  }
}
