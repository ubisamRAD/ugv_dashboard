import { useStomp } from './useStomp'
import { useRobotId } from './useRobotId'

const THROTTLE_MS = 100  // 10Hz max

const ARM_JOINTS = [
  'arm_base_link_to_arm_link1',
  'arm_link1_to_arm_link2',
  'arm_link2_to_arm_link3',
  'arm_link3_to_arm_gripper_link'
]

// Throttle state for arm and gripper
let armPending = false
let armLatest = null
let gripperPending = false
let gripperLatest = null

function _publish(topic, data) {
  const { publish } = useStomp()
  const { robotId } = useRobotId()
  publish(`${robotId.value}/${topic}`, data)
}

function publishCmdVel(linear, angular) {
  _publish('cmd_vel', { linear, angular })
}

function publishArmJoint(positions) {
  armLatest = positions
  if (armPending) return
  armPending = true
  _publish('arm', { positions })
  setTimeout(() => {
    armPending = false
    if (armLatest !== positions) {
      publishArmJoint(armLatest)
    }
  }, THROTTLE_MS)
}

function publishGripper(value) {
  gripperLatest = value
  if (gripperPending) return
  gripperPending = true
  _publish('gripper', { value })
  setTimeout(() => {
    gripperPending = false
    if (gripperLatest !== value) {
      publishGripper(gripperLatest)
    }
  }, THROTTLE_MS)
}

function publishNavigate(x, y, theta) {
  _publish('navigate', { x, y, theta })
}

function publishCancel() {
  _publish('cancel', {})
}

function publishInitialPose(x, y, yaw) {
  _publish('initial_pose', { x, y, yaw })
}

function stopAll() {
  publishCmdVel(0, 0)
}

function resetTopics() {
  // No-op: STOMP handles cleanup automatically
}

export function useRobotControl() {
  return {
    publishCmdVel,
    publishArmJoint,
    publishGripper,
    publishNavigate,
    publishCancel,
    publishInitialPose,
    stopAll,
    resetTopics,
    ARM_JOINTS
  }
}
