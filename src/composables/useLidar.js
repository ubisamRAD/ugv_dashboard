import { ref, watch, readonly } from 'vue'
import ROSLIB from 'roslib'
import { useRos } from './useRos'

const scanPoints = ref([])

let subscriber = null

function subscribe(ros) {
  unsubscribe()

  subscriber = new ROSLIB.Topic({
    ros,
    name: '/scan',
    messageType: 'sensor_msgs/msg/LaserScan',
    throttle_rate: 100
  })

  subscriber.subscribe((msg) => {
    const points = []
    const { angle_min, angle_increment, ranges, range_min, range_max } = msg

    for (let i = 0; i < ranges.length; i++) {
      const r = ranges[i]
      if (r < range_min || r > range_max || !isFinite(r)) continue

      const angle = angle_min + i * angle_increment + Math.PI / 2
      points.push({
        x: r * Math.cos(angle),
        y: r * Math.sin(angle)
      })
    }

    scanPoints.value = points
  })
}

function unsubscribe() {
  if (subscriber) {
    try { subscriber.unsubscribe() } catch { /* ignore */ }
    subscriber = null
  }
}

export function useLidar() {
  const { ros, isConnected } = useRos()

  watch(isConnected, (connected) => {
    if (connected && ros.value) {
      subscribe(ros.value)
    } else {
      unsubscribe()
    }
  })

  return {
    scanPoints: readonly(scanPoints)
  }
}
