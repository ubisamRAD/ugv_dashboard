import { ref, watch, readonly } from 'vue'
import ROSLIB from 'roslib'
import { useRos } from './useRos'

const mapData = ref(null)
const globalPath = ref([])

let subscribers = []

function subscribe(ros) {
  unsubscribe()

  const mapSub = new ROSLIB.Topic({
    ros,
    name: '/map',
    messageType: 'nav_msgs/msg/OccupancyGrid',
    throttle_rate: 2000
  })
  mapSub.subscribe((msg) => {
    mapData.value = {
      width: msg.info.width,
      height: msg.info.height,
      resolution: msg.info.resolution,
      origin: msg.info.origin,
      data: msg.data
    }
  })
  subscribers.push(mapSub)

  const pathSub = new ROSLIB.Topic({
    ros,
    name: '/plan',
    messageType: 'nav_msgs/msg/Path',
    throttle_rate: 500
  })
  pathSub.subscribe((msg) => {
    globalPath.value = msg.poses.map((p) => ({
      x: p.pose.position.x,
      y: p.pose.position.y
    }))
  })
  subscribers.push(pathSub)
}

function unsubscribe() {
  subscribers.forEach((s) => {
    try { s.unsubscribe() } catch { /* ignore */ }
  })
  subscribers = []
}

function publishNavGoal(ros, x, y, theta) {
  if (!ros) return

  const goalTopic = new ROSLIB.Topic({
    ros,
    name: '/goal_pose',
    messageType: 'geometry_msgs/msg/PoseStamped'
  })

  const sinH = Math.sin(theta / 2)
  const cosH = Math.cos(theta / 2)

  goalTopic.publish(
    new ROSLIB.Message({
      header: {
        stamp: { sec: 0, nanosec: 0 },
        frame_id: 'map'
      },
      pose: {
        position: { x, y, z: 0 },
        orientation: { x: 0, y: 0, z: sinH, w: cosH }
      }
    })
  )
}

export function useMap() {
  const { ros, isConnected } = useRos()

  watch(isConnected, (connected) => {
    if (connected && ros.value) {
      subscribe(ros.value)
    } else {
      unsubscribe()
    }
  })

  return {
    mapData: readonly(mapData),
    globalPath: readonly(globalPath),
    publishNavGoal: (x, y, theta) => publishNavGoal(ros.value, x, y, theta)
  }
}
