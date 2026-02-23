import { shallowRef } from 'vue'
import ROSLIB from 'roslib'
import { useRos } from './useRos'

const cmdVelTopic = shallowRef(null)
const armTopic = shallowRef(null)
const gripperTopic = shallowRef(null)

const ARM_JOINTS = [
  'arm_base_link_to_arm_link1',
  'arm_link1_to_arm_link2',
  'arm_link2_to_arm_link3',
  'arm_link3_to_arm_gripper_link'
]

function ensureTopics(ros) {
  if (!ros) return false

  if (!cmdVelTopic.value) {
    cmdVelTopic.value = new ROSLIB.Topic({
      ros,
      name: '/cmd_vel',
      messageType: 'geometry_msgs/msg/Twist'
    })
  }

  if (!armTopic.value) {
    armTopic.value = new ROSLIB.Topic({
      ros,
      name: '/arm_controller/joint_trajectory',
      messageType: 'trajectory_msgs/msg/JointTrajectory'
    })
  }

  if (!gripperTopic.value) {
    gripperTopic.value = new ROSLIB.Topic({
      ros,
      name: '/roarm/gripper_cmd',
      messageType: 'std_msgs/msg/Float64'
    })
  }

  return true
}

function publishCmdVel(linear, angular) {
  const { ros } = useRos()
  if (!ensureTopics(ros.value)) return

  cmdVelTopic.value.publish(
    new ROSLIB.Message({
      linear: { x: linear, y: 0, z: 0 },
      angular: { x: 0, y: 0, z: angular }
    })
  )
}

function publishArmJoint(positions) {
  const { ros } = useRos()
  if (!ensureTopics(ros.value)) return

  const point = {
    positions,
    time_from_start: { sec: 0, nanosec: 500000000 }
  }

  armTopic.value.publish(
    new ROSLIB.Message({
      joint_names: ARM_JOINTS,
      points: [point]
    })
  )
}

function publishGripper(value) {
  const { ros } = useRos()
  if (!ensureTopics(ros.value)) return

  gripperTopic.value.publish(
    new ROSLIB.Message({ data: value })
  )
}

function stopAll() {
  publishCmdVel(0, 0)
}

function resetTopics() {
  cmdVelTopic.value = null
  armTopic.value = null
  gripperTopic.value = null
}

export function useRobotControl() {
  return {
    publishCmdVel,
    publishArmJoint,
    publishGripper,
    stopAll,
    resetTopics,
    ARM_JOINTS
  }
}
