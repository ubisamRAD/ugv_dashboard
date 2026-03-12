import { computed } from 'vue'
import api from '@/plugins/axios'
import { useRobotId } from './useRobotId'

const factoryHost = import.meta.env.VITE_ROBOT_HOST || 'localhost'
const factoryPort = import.meta.env.VITE_FACTORY_API_PORT || '8082'
const proxyBase = `http://${factoryHost}:${factoryPort}`

export function useApi() {
  const { robotId } = useRobotId()
  const apiBase = computed(() => proxyBase)

  return {
    apiBase,
    robotId,
    get: (path) => {
      const url = `${proxyBase}${rewritePath(path)}`
      return api.get(url).then((r) => r.data).catch(() => ({ error: 'request_failed' }))
    },
    post: (path, body) => {
      const url = `${proxyBase}${rewritePath(path)}`
      return api.post(url, body).then((r) => r.data).catch(() => ({ error: 'request_failed' }))
    },
  }
}

/** Rewrite bridge API paths to proxy paths:
 *  /api/ugv01/arm → /api/robots/ugv01/arm */
function rewritePath(path) {
  return path.replace(/^\/api\//, '/api/robots/')
}
