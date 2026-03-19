<template>
  <div ref="containerRef" class="robot-viewer-3d" />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import URDFLoader from 'urdf-loader'
import { useRobotState } from '@/composables/useRobotState'
import { useRobotControl } from '@/composables/useRobotControl'

const containerRef = ref(null)
const { jointPositions } = useRobotState()
const { lastCmdVel } = useRobotControl()

let renderer, scene, camera, controls, robot
let animationId = null
let lastTime = 0
let leftWheelAngle = 0
let rightWheelAngle = 0
const stlLoader = new STLLoader()

const LEFT_WHEELS = ['left_up_wheel_link_joint', 'left_down_wheel_link_joint']
const RIGHT_WHEELS = ['right_up_wheel_link_joint', 'right_down_wheel_link_joint']
const WHEEL_RADIUS = 0.033  // 바퀴 반지름 (m)
const WHEEL_BASE = 0.14     // 좌우 바퀴 간격 (m)

const LINK_COLORS = {
  base_link: 0x556677,
  arm_base_link: 0x667788,
  arm_link1: 0x4488cc,
  arm_link2: 0x44aadd,
  arm_link3: 0x44ccee,
  arm_gripper_link: 0xee8844,
}

onMounted(() => {
  initScene()
  loadRobot()
  animate()
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  if (animationId) cancelAnimationFrame(animationId)
  if (renderer) {
    renderer.dispose()
    renderer.forceContextLoss()
  }
})

watch(jointPositions, (joints) => {
  if (!robot) return
  for (const [name, rad] of Object.entries(joints)) {
    const joint = robot.joints[name]
    if (joint) {
      // 그리퍼: ESP32 값에 π 오프셋 적용 (3D 모델 정렬)
      const val = name === 'arm_link3_to_arm_gripper_link' ? rad + Math.PI : rad
      joint.setJointValue(val)
    }
  }
}, { deep: true })

function initScene() {
  const el = containerRef.value
  const w = el.clientWidth
  const h = el.clientHeight

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(w, h)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  el.appendChild(renderer.domElement)

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(50, w / h, 0.01, 10)
  camera.position.set(0.4, 0.3, 0.4)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(0, 0.05, 0)
  controls.enableDamping = true
  controls.dampingFactor = 0.1
  controls.update()

  scene.add(new THREE.AmbientLight(0xffffff, 0.6))

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0)
  dirLight.position.set(0.5, 1, 0.5)
  scene.add(dirLight)

  const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3)
  fillLight.position.set(-0.5, 0.5, -0.5)
  scene.add(fillLight)

  const grid = new THREE.GridHelper(1, 20, 0x444466, 0x333355)
  grid.position.y = -0.01
  scene.add(grid)

  scene.add(new THREE.AxesHelper(0.15))
}

function loadRobot() {
  const loader = new URDFLoader()
  loader.packages = '/robot'
  loader.loadMeshCb = (path, _manager, onComplete) => {
    stlLoader.load(path, (geometry) => {
      const material = new THREE.MeshPhongMaterial({
        color: 0x6688cc,
        specular: 0x222222,
        shininess: 40,
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.castShadow = true
      mesh.receiveShadow = true
      onComplete(mesh)
    }, undefined, (err) => {
      console.warn('STL load failed:', path, err)
      onComplete(new THREE.Object3D())
    })
  }

  loader.load('/robot/rasp_roarm.urdf', (result) => {
    robot = result
    // URDF Z-up → Three.js Y-up 변환
    robot.rotation.x = -Math.PI / 2
    scene.add(robot)

    // 링크별 색상 적용
    robot.traverse((child) => {
      if (child.isMesh) {
        const linkName = findLinkName(child)
        if (linkName && LINK_COLORS[linkName]) {
          child.material = new THREE.MeshPhongMaterial({
            color: LINK_COLORS[linkName],
            specular: 0x222222,
            shininess: 40,
          })
        }
        if (linkName && linkName.includes('wheel')) {
          child.material = new THREE.MeshPhongMaterial({
            color: 0x333333,
            specular: 0x111111,
            shininess: 20,
          })
        }
      }
    })

    // 초기 관절 상태 적용
    if (jointPositions.value) {
      for (const [name, rad] of Object.entries(jointPositions.value)) {
        const joint = robot.joints[name]
        if (joint) {
          const val = name === 'arm_link3_to_arm_gripper_link' ? rad + Math.PI : rad
          joint.setJointValue(val)
        }
      }
    }
  })
}

function findLinkName(obj) {
  let current = obj.parent
  while (current) {
    if (current.isURDFLink) return current.name
    current = current.parent
  }
  return null
}

function animate(time) {
  animationId = requestAnimationFrame(animate)

  // 바퀴 회전 애니메이션 (cmd_vel 기반, 스키드 스티어)
  if (robot && lastTime > 0) {
    const dt = (time - lastTime) / 1000
    if (dt < 0.5) {
      const lin = lastCmdVel.linear || 0
      const ang = lastCmdVel.angular || 0
      // 차동 구동: 좌/우 바퀴 속도 분리
      const leftSpeed = (lin - ang * WHEEL_BASE / 2) / WHEEL_RADIUS
      const rightSpeed = (lin + ang * WHEEL_BASE / 2) / WHEEL_RADIUS
      // 왼쪽 바퀴 축이 반대 (URDF axis 0 -1 0) → 부호 반전
      leftWheelAngle -= leftSpeed * dt
      rightWheelAngle += rightSpeed * dt

      for (const name of LEFT_WHEELS) {
        const joint = robot.joints[name]
        if (joint) joint.setJointValue(leftWheelAngle)
      }
      for (const name of RIGHT_WHEELS) {
        const joint = robot.joints[name]
        if (joint) joint.setJointValue(rightWheelAngle)
      }
    }
  }
  lastTime = time

  controls.update()
  renderer.render(scene, camera)
}

function onResize() {
  const el = containerRef.value
  if (!el) return
  const w = el.clientWidth
  const h = el.clientHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
}
</script>

<style scoped>
.robot-viewer-3d {
  width: 100%;
  height: 100%;
  min-height: 300px;
  flex: 1;
}
</style>
