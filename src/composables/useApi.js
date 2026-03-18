import { computed } from 'vue'
import api from '@/plugins/axios'
import { useRobotId } from './useRobotId'

// RPi bridge direct connection (no Factory API proxy)
const robotHost = import.meta.env.VITE_ROBOT_HOST || 'localhost'
const bridgePort = import.meta.env.VITE_BRIDGE_PORT || '8081'
const bridgeBase = `http://${robotHost}:${bridgePort}`

export function useApi() {
  const { robotId } = useRobotId()
  const apiBase = computed(() => bridgeBase)

  return {
    apiBase,
    robotId,
    get: (path) => {
      const url = `${bridgeBase}${path}`
      return api.get(url).then((r) => r.data).catch(() => ({ error: 'request_failed' }))
    },
    post: (path, body) => {
      const url = `${bridgeBase}${path}`
      return api.post(url, body).then((r) => r.data).catch(() => ({ error: 'request_failed' }))
    },
  }
}
