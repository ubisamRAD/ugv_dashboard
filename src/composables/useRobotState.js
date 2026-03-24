import { ref, watch, readonly } from 'vue'
import { useStomp } from './useStomp'
import { useRobotId } from './useRobotId'

const battery = ref(0)
const position = ref({ x: 0, y: 0 })
const orientation = ref(0)
const linearVel = ref(0)
const angularVel = ref(0)
const imuYaw = ref(0)
const jointPositions = ref({})
const mapPosition = ref({ x: 0, y: 0 })
const mapOrientation = ref(0)
const mapPoseValid = ref(false)

let subscribedFor = null

function resetState() {
  battery.value = 0
  position.value = { x: 0, y: 0 }
  orientation.value = 0
  linearVel.value = 0
  angularVel.value = 0
  imuYaw.value = 0
  jointPositions.value = {}
  mapPosition.value = { x: 0, y: 0 }
  mapOrientation.value = 0
  mapPoseValid.value = false
}

function teardown(rid) {
  const { unsubscribe } = useStomp()
  unsubscribe(`${rid}/pose`)
  unsubscribe(`${rid}/voltage`)
  unsubscribe(`${rid}/joint_states`)
  unsubscribe(`${rid}/imu`)
  unsubscribe(`${rid}/map_pose`)
}

function setup(rid) {
  const { subscribe } = useStomp()

  subscribe(`${rid}/pose`, (data) => {
    position.value = { x: data.x, y: data.y }
    orientation.value = data.yaw
    linearVel.value = data.linear_vel
    angularVel.value = data.angular_vel
  })

  subscribe(`${rid}/voltage`, (data) => {
    battery.value = data.voltage
  })

  subscribe(`${rid}/joint_states`, (data) => {
    jointPositions.value = data.joints || {}
  })

  subscribe(`${rid}/imu`, (data) => {
    imuYaw.value = data.yaw
  })

  subscribe(`${rid}/map_pose`, (data) => {
    mapPosition.value = { x: data.x, y: data.y }
    mapOrientation.value = data.yaw
    mapPoseValid.value = !!data.valid
  })
}

export function useRobotState() {
  const { isConnected } = useStomp()
  const { robotId } = useRobotId()

  watch([isConnected, robotId], ([connected, rid]) => {
    if (subscribedFor) {
      teardown(subscribedFor)
      subscribedFor = null
    }
    if (connected && rid) {
      resetState()
      setup(rid)
      subscribedFor = rid
    }
  }, { immediate: true })

  return {
    battery: readonly(battery),
    position: readonly(position),
    orientation: readonly(orientation),
    linearVel: readonly(linearVel),
    angularVel: readonly(angularVel),
    imuYaw: readonly(imuYaw),
    jointPositions: readonly(jointPositions),
    mapPosition: readonly(mapPosition),
    mapOrientation: readonly(mapOrientation),
    mapPoseValid: readonly(mapPoseValid),
  }
}
