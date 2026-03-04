import { ref } from 'vue'

const robotHost = import.meta.env.VITE_ROBOT_HOST || 'localhost'
const apiPort = import.meta.env.VITE_API_PORT || '8081'
const apiBase = ref(`http://${robotHost}:${apiPort}`)
const robotId = ref('ugv01')

async function request(method, path, body = null) {
  const url = `${apiBase.value}${path}`
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  }
  if (body) opts.body = JSON.stringify(body)

  try {
    const res = await fetch(url, opts)
    return await res.json()
  } catch {
    return { error: 'request_failed' }
  }
}

export function useApi() {
  return {
    apiBase,
    robotId,
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body)
  }
}
