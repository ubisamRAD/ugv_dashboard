import { ref, shallowRef, readonly, markRaw } from 'vue'
import ROSLIB from 'roslib'

const url = ref('ws://192.168.0.71:9090')
const isConnected = ref(false)
const ros = shallowRef(null)
const logs = ref([])

function addLog(level, message) {
  const entry = {
    time: new Date().toLocaleTimeString(),
    level,
    message
  }
  logs.value = [entry, ...logs.value].slice(0, 200)
}

function connect(wsUrl) {
  if (wsUrl) url.value = wsUrl

  disconnect()

  const instance = new ROSLIB.Ros({ url: url.value })

  instance.on('connection', () => {
    isConnected.value = true
    addLog('info', `Connected to ${url.value}`)
  })

  instance.on('error', (error) => {
    addLog('error', `Connection error: ${error}`)
  })

  instance.on('close', () => {
    isConnected.value = false
    addLog('warn', 'Connection closed')
  })

  ros.value = markRaw(instance)
}

function disconnect() {
  if (ros.value) {
    try {
      ros.value.close()
    } catch {
      // ignore
    }
    ros.value = null
    isConnected.value = false
  }
}

export function useRos() {
  return {
    url,
    isConnected: readonly(isConnected),
    ros,
    logs: readonly(logs),
    connect,
    disconnect,
    addLog
  }
}
