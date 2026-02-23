import { ref, watch, readonly } from 'vue'
import ROSLIB from 'roslib'
import { useRos } from './useRos'

const battery = ref(0)
const position = ref({ x: 0, y: 0 })
const orientation = ref(0)
const linearVel = ref(0)
const angularVel = ref(0)
const imuYaw = ref(0)
const jointPositions = ref({})

let subscribers = []

function quaternionToYaw(q) {
  const siny = 2 * (q.w * q.z + q.x * q.y)
  const cosy = 1 - 2 * (q.y * q.y + q.z * q.z)
  return Math.atan2(siny, cosy)
}

function subscribe(ros) {
  unsubscribe()

  const odomSub = new ROSLIB.Topic({
    ros,
    name: '/odom',
    messageType: 'nav_msgs/msg/Odometry',
    throttle_rate: 100
  })
  odomSub.subscribe((msg) => {
    const p = msg.pose.pose.position
    position.value = { x: p.x, y: p.y }
    orientation.value = quaternionToYaw(msg.pose.pose.orientation)
    linearVel.value = msg.twist.twist.linear.x
    angularVel.value = msg.twist.twist.angular.z
  })
  subscribers.push(odomSub)

  const voltageSub = new ROSLIB.Topic({
    ros,
    name: '/voltage',
    messageType: 'std_msgs/msg/Float32',
    throttle_rate: 1000
  })
  voltageSub.subscribe((msg) => {
    battery.value = msg.data
  })
  subscribers.push(voltageSub)

  const jointSub = new ROSLIB.Topic({
    ros,
    name: '/joint_states',
    messageType: 'sensor_msgs/msg/JointState',
    throttle_rate: 200
  })
  jointSub.subscribe((msg) => {
    const joints = {}
    for (let i = 0; i < msg.name.length; i++) {
      joints[msg.name[i]] = msg.position[i] || 0
    }
    jointPositions.value = joints
  })
  subscribers.push(jointSub)

  const imuSub = new ROSLIB.Topic({
    ros,
    name: '/imu/data',
    messageType: 'sensor_msgs/msg/Imu',
    throttle_rate: 200
  })
  imuSub.subscribe((msg) => {
    imuYaw.value = quaternionToYaw(msg.orientation)
  })
  subscribers.push(imuSub)
}

function unsubscribe() {
  subscribers.forEach((s) => {
    try { s.unsubscribe() } catch { /* ignore */ }
  })
  subscribers = []
}

export function useRobotState() {
  const { ros, isConnected } = useRos()

  watch(isConnected, (connected) => {
    if (connected && ros.value) {
      subscribe(ros.value)
    } else {
      unsubscribe()
    }
  })

  return {
    battery: readonly(battery),
    position: readonly(position),
    orientation: readonly(orientation),
    linearVel: readonly(linearVel),
    angularVel: readonly(angularVel),
    imuYaw: readonly(imuYaw),
    jointPositions: readonly(jointPositions)
  }
}
