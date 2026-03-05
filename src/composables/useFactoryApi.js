import { computed } from 'vue'
import api from '@/plugins/axios'
import { useStomp } from './useStomp'

const factoryPort = import.meta.env.VITE_FACTORY_API_PORT || '8082'

function baseUrl() {
  const { connectedHost } = useStomp()
  return `http://${connectedHost.value}:${factoryPort}`
}

export function useFactoryApi() {
  const { connectedHost } = useStomp()
  const apiBase = computed(() => `http://${connectedHost.value}:${factoryPort}`)

  return {
    apiBase,
    get: (path) => api.get(`${baseUrl()}${path}`).then((r) => r.data).catch(() => ({ error: 'request_failed' })),
    post: (path, body) => api.post(`${baseUrl()}${path}`, body).then((r) => r.data).catch(() => ({ error: 'request_failed' })),
    patch: (path, body) => api.patch(`${baseUrl()}${path}`, body).then((r) => r.data).catch(() => ({ error: 'request_failed' })),
    del: (path) => api.delete(`${baseUrl()}${path}`).then((r) => r.data).catch(() => null),
  }
}
