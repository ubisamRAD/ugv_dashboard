import { ref, watch, readonly } from 'vue'
import { useMqtt } from './useMqtt'

const ROBOT_ID = 'ugv01'

const scanPoints = ref([])

let subscribed = false

function setupSubscription() {
  if (subscribed) return
  subscribed = true

  const { subscribe } = useMqtt()

  subscribe(`${ROBOT_ID}/scan`, (msg) => {
    const points = []
    const { angle_min, angle_increment, ranges, range_min, range_max } = msg

    for (let i = 0; i < ranges.length; i++) {
      const r = ranges[i]
      if (r == null || r < range_min || r >= range_max || !isFinite(r)) continue

      const angle = angle_min + i * angle_increment + Math.PI / 2
      points.push({
        x: r * Math.cos(angle),
        y: r * Math.sin(angle)
      })
    }

    scanPoints.value = points
  })
}

export function useLidar() {
  const { isConnected } = useMqtt()

  watch(isConnected, (connected) => {
    if (connected) {
      setupSubscription()
    }
  }, { immediate: true })

  return {
    scanPoints: readonly(scanPoints)
  }
}
