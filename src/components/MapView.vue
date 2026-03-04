<template>
  <div class="map-container" ref="containerRef">
    <canvas
      ref="canvasRef"
      @wheel="onWheel"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @mouseleave="onMouseUp"
      @contextmenu.prevent
    ></canvas>
    <div v-if="navStatus.status === 'navigating'" class="nav-overlay">
      <span class="nav-status">
        Navigating<span v-if="navStatus.distance != null"> — {{ navStatus.distance.toFixed(2) }}m</span>
        <span v-if="navStatus.goalX != null"> | Goal: ({{ navStatus.goalX.toFixed(2) }}, {{ navStatus.goalY.toFixed(2) }}) → {{ (navStatus.goalTheta * 180 / Math.PI).toFixed(0) }}°</span>
      </span>
      <button class="nav-cancel-btn" @click="cancelNavigation">Cancel</button>
    </div>
    <div v-else-if="showResult && navStatus.status === 'succeeded'" class="nav-overlay nav-done">
      <span class="nav-status">Arrived</span>
    </div>
    <div v-else-if="showResult && (navStatus.status === 'failed' || navStatus.status === 'canceled')" class="nav-overlay nav-err">
      <span class="nav-status">{{ navStatus.status === 'failed' ? 'Failed' : 'Canceled' }}</span>
    </div>
    <div v-if="navGoalDragging" class="nav-hint">Shift+Drag to set heading</div>
    <button class="lidar-toggle" :class="{ active: showScan }" @click="showScan = !showScan">
      LiDAR
    </button>
    <div class="map-info">
      <span v-if="mapData">{{ mapData.width }}x{{ mapData.height }} | {{ mapData.resolution }}m/px</span>
      <span v-else>No map data</span>
      <span>Zoom: {{ mapZoom.toFixed(1) }}x</span>
      <span>Rot: {{ rotationDeg }}°</span>
      <span v-if="mapPoseValid">TF</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useMap } from '@/composables/useMap'
import { useRobotState } from '@/composables/useRobotState'
import { useLidar } from '@/composables/useLidar'

const { mapData, globalPath, navStatus, publishNavGoal, cancelNavigation } = useMap()
const { scanPoints } = useLidar()

const showResult = ref(false)
let resultTimer = null

watch(() => navStatus.value.status, (s) => {
  if (s === 'succeeded' || s === 'failed' || s === 'canceled') {
    showResult.value = true
    clearTimeout(resultTimer)
    resultTimer = setTimeout(() => { showResult.value = false }, 3000)
  } else {
    showResult.value = false
  }
})
const { position, orientation, mapPosition, mapOrientation, mapPoseValid } = useRobotState()
const showScan = ref(true)

const canvasRef = ref(null)
const containerRef = ref(null)
const mapZoom = ref(1)
const rotation = ref(0)
const panX = ref(0)
const panY = ref(0)

const rotationDeg = computed(() => Math.round(rotation.value * 180 / Math.PI))

let animationId = null
let resizeObserver = null
let mapImage = null

// Interaction state
let dragging = false
let dragType = null // 'pan' | 'rotate' | 'navgoal'
let dragStartX = 0
let dragStartY = 0
let dragStartAngle = 0
let panStartX = 0
let panStartY = 0
let rotationStart = 0
const CLICK_THRESHOLD = 4

// Nav goal drag state
const navGoalDragging = ref(false)
let navGoalStartWorld = null // { x, y } in map coords
let navGoalTheta = 0

function getAngleFromCenter(e) {
  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  const cx = rect.width / 2
  const cy = rect.height / 2
  return Math.atan2(e.clientY - rect.top - cy, e.clientX - rect.left - cx)
}

function onMouseDown(e) {
  dragStartX = e.clientX
  dragStartY = e.clientY

  if (e.button === 2) {
    // Right drag = rotate
    dragging = true
    dragType = 'rotate'
    dragStartAngle = getAngleFromCenter(e)
    rotationStart = rotation.value
    canvasRef.value.style.cursor = 'grabbing'
  } else if (e.button === 0 && e.shiftKey) {
    // Shift + left = nav goal (with optional drag for heading)
    dragging = true
    dragType = 'navgoal'
    navGoalStartWorld = screenToWorld(e)
    navGoalTheta = 0
    navGoalDragging.value = true
    canvasRef.value.style.cursor = 'crosshair'
  } else if (e.button === 0) {
    // Left drag = pan
    dragging = true
    dragType = 'pan'
    panStartX = panX.value
    panStartY = panY.value
    canvasRef.value.style.cursor = 'grabbing'
  }
}

function onMouseMove(e) {
  if (!dragging) return

  if (dragType === 'rotate') {
    const currentAngle = getAngleFromCenter(e)
    rotation.value = rotationStart + (currentAngle - dragStartAngle)
  } else if (dragType === 'pan') {
    panX.value = panStartX + (e.clientX - dragStartX)
    panY.value = panStartY + (e.clientY - dragStartY)
  } else if (dragType === 'navgoal') {
    const dx = e.clientX - dragStartX
    const dy = e.clientY - dragStartY
    const moved = Math.sqrt(dx * dx + dy * dy)
    if (moved > CLICK_THRESHOLD) {
      // Compute heading from drag direction in screen space
      // Undo canvas rotation to get map-frame angle
      const cos = Math.cos(-rotation.value)
      const sin = Math.sin(-rotation.value)
      const mx = dx * cos - dy * sin
      const my = -(dx * sin + dy * cos)  // flip Y for map coords
      navGoalTheta = Math.atan2(my, mx)
    } else {
      navGoalTheta = 0
    }
  }
}

function onMouseUp(e) {
  if (!dragging) return

  const dx = e.clientX - dragStartX
  const dy = e.clientY - dragStartY
  const moved = Math.sqrt(dx * dx + dy * dy)

  dragging = false

  if (dragType === 'navgoal' && navGoalStartWorld) {
    // Send nav goal with heading from drag
    const theta = moved >= CLICK_THRESHOLD ? navGoalTheta : 0
    publishNavGoal(navGoalStartWorld.x, navGoalStartWorld.y, theta)
    navGoalDragging.value = false
    navGoalStartWorld = null
  }

  dragType = null
  if (canvasRef.value) canvasRef.value.style.cursor = 'crosshair'
}

function resizeCanvas() {
  const canvas = canvasRef.value
  const container = containerRef.value
  if (!canvas || !container) return
  canvas.width = container.clientWidth
  canvas.height = container.clientHeight
}

function buildMapImage() {
  const map = mapData.value
  if (!map || !map.image) {
    mapImage = null
    return
  }

  const img = new Image()
  img.onload = () => { mapImage = img }
  img.src = `data:image/png;base64,${map.image}`
}

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height

  ctx.fillStyle = '#0f1117'
  ctx.fillRect(0, 0, w, h)

  const map = mapData.value
  if (!map || !mapImage) {
    ctx.fillStyle = '#8b90a5'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Waiting for map ...', w / 2, h / 2)
    animationId = requestAnimationFrame(draw)
    return
  }

  const { width, height, resolution, origin } = map
  const baseScale = Math.min(w / width, h / height)
  const scale = mapZoom.value * baseScale

  ctx.save()
  ctx.translate(w / 2 + panX.value, h / 2 + panY.value)
  ctx.rotate(rotation.value)
  ctx.scale(scale, -scale)
  ctx.translate(-width / 2, -height / 2)

  // Map image (PNG, already flipped by backend)
  ctx.save()
  ctx.scale(1, -1)
  ctx.drawImage(mapImage, 0, -height)
  ctx.restore()

  // Global path
  const path = globalPath.value
  if (path.length > 1) {
    ctx.strokeStyle = '#4e8cff'
    ctx.lineWidth = 1 / scale
    ctx.beginPath()
    for (let i = 0; i < path.length; i++) {
      const mx = (path[i].x - origin.position.x) / resolution
      const my = (path[i].y - origin.position.y) / resolution
      if (i === 0) ctx.moveTo(mx, my)
      else ctx.lineTo(mx, my)
    }
    ctx.stroke()
  }

  // Goal marker
  const ns = navStatus.value
  const showGoal = (ns.status === 'navigating' || ns.status === 'succeeded') && ns.goalX != null
  if (showGoal) {
    const gx = (ns.goalX - origin.position.x) / resolution
    const gy = (ns.goalY - origin.position.y) / resolution
    const gTheta = ns.goalTheta || 0
    const markerSize = 8 / scale

    ctx.save()
    ctx.translate(gx, gy)

    // Cross
    ctx.strokeStyle = '#22c55e'
    ctx.lineWidth = 2 / scale
    ctx.beginPath()
    ctx.moveTo(-markerSize, 0)
    ctx.lineTo(markerSize, 0)
    ctx.moveTo(0, -markerSize)
    ctx.lineTo(0, markerSize)
    ctx.stroke()

    // Direction arrow
    ctx.rotate(gTheta)
    ctx.fillStyle = 'rgba(34, 197, 94, 0.7)'
    ctx.beginPath()
    ctx.moveTo(markerSize * 1.2, 0)
    ctx.lineTo(markerSize * 0.4, -markerSize * 0.5)
    ctx.lineTo(markerSize * 0.4, markerSize * 0.5)
    ctx.closePath()
    ctx.fill()

    ctx.restore()
  }

  // Nav goal drag preview (while Shift+dragging)
  if (navGoalDragging.value && navGoalStartWorld) {
    const pgx = (navGoalStartWorld.x - origin.position.x) / resolution
    const pgy = (navGoalStartWorld.y - origin.position.y) / resolution
    const previewSize = 8 / scale

    ctx.save()
    ctx.translate(pgx, pgy)

    // Preview cross
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)'
    ctx.lineWidth = 2 / scale
    ctx.beginPath()
    ctx.moveTo(-previewSize, 0)
    ctx.lineTo(previewSize, 0)
    ctx.moveTo(0, -previewSize)
    ctx.lineTo(0, previewSize)
    ctx.stroke()

    // Preview direction arrow
    ctx.rotate(navGoalTheta)
    ctx.fillStyle = 'rgba(34, 197, 94, 0.4)'
    ctx.beginPath()
    ctx.moveTo(previewSize * 1.2, 0)
    ctx.lineTo(previewSize * 0.4, -previewSize * 0.5)
    ctx.lineTo(previewSize * 0.4, previewSize * 0.5)
    ctx.closePath()
    ctx.fill()

    ctx.restore()
  }

  // Robot position (prefer TF-based map_pose, fallback to odom)
  const useMap = mapPoseValid.value
  const posX = useMap ? mapPosition.value.x : position.value.x
  const posY = useMap ? mapPosition.value.y : position.value.y
  const posYaw = useMap ? mapOrientation.value : orientation.value

  const rx = (posX - origin.position.x) / resolution
  const ry = (posY - origin.position.y) / resolution

  // LiDAR overlay
  if (showScan.value && scanPoints.value.length > 0) {
    const cosYaw = Math.cos(posYaw)
    const sinYaw = Math.sin(posYaw)
    ctx.fillStyle = 'rgba(255, 60, 60, 0.8)'
    const dotSize = 1.5 / scale
    for (const pt of scanPoints.value) {
      // base_link → map frame rotation
      const mx = posX + pt.x * cosYaw - pt.y * sinYaw
      const my = posY + pt.x * sinYaw + pt.y * cosYaw
      // map → pixel
      const px = (mx - origin.position.x) / resolution
      const py = (my - origin.position.y) / resolution
      ctx.fillRect(px - dotSize / 2, py - dotSize / 2, dotSize, dotSize)
    }
  }

  // Robot arrow
  ctx.save()
  ctx.translate(rx, ry)
  ctx.rotate(posYaw)

  const robotSize = 6 / scale
  ctx.fillStyle = '#f87171'
  ctx.beginPath()
  ctx.moveTo(robotSize, 0)
  ctx.lineTo(-robotSize * 0.7, -robotSize * 0.7)
  ctx.lineTo(-robotSize * 0.7, robotSize * 0.7)
  ctx.closePath()
  ctx.fill()

  ctx.restore()
  ctx.restore()

  animationId = requestAnimationFrame(draw)
}

function screenToWorld(e) {
  const map = mapData.value
  if (!map || !mapImage) return null

  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  const { width, height, resolution, origin } = map
  const baseScale = Math.min(canvas.width / width, canvas.height / height)
  const scale = mapZoom.value * baseScale

  // Reverse: screen → rotated map coords
  let sx = e.clientX - rect.left - canvas.width / 2 - panX.value
  let sy = e.clientY - rect.top - canvas.height / 2 - panY.value

  // Undo rotation
  const cos = Math.cos(-rotation.value)
  const sin = Math.sin(-rotation.value)
  const rx = sx * cos - sy * sin
  const ry = sx * sin + sy * cos

  // Undo scale + flip
  const px = rx / scale + width / 2
  const py = -(ry / scale) + height / 2

  return {
    x: px * resolution + origin.position.x,
    y: py * resolution + origin.position.y
  }
}

function onWheel(e) {
  e.preventDefault()
  mapZoom.value = Math.max(0.2, Math.min(10, mapZoom.value * (1 - e.deltaY * 0.001)))
}

watch(mapData, buildMapImage)

onMounted(() => {
  resizeCanvas()
  resizeObserver = new ResizeObserver(resizeCanvas)
  resizeObserver.observe(containerRef.value)
  if (mapData.value) buildMapImage()
  animationId = requestAnimationFrame(draw)
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  if (resizeObserver) resizeObserver.disconnect()
})
</script>

<style scoped>
.map-container {
  flex: 1;
  position: relative;
  min-height: 200px;
  overflow: hidden;
}

canvas {
  width: 100%;
  height: 100%;
  display: block;
  cursor: crosshair;
}

.nav-overlay {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(78, 140, 255, 0.9);
  color: #fff;
  font-size: 13px;
  font-family: var(--font-mono);
  padding: 6px 14px;
  border-radius: 6px;
}

.nav-overlay.nav-done {
  background: rgba(52, 211, 153, 0.9);
}

.nav-overlay.nav-err {
  background: rgba(248, 113, 113, 0.9);
}

.nav-cancel-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: #fff;
  padding: 2px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-family: var(--font-mono);
}

.nav-cancel-btn:hover {
  background: rgba(255, 255, 255, 0.35);
}

.lidar-toggle {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(15, 17, 23, 0.7);
  border: 1px solid rgba(255, 60, 60, 0.4);
  color: #8b90a5;
  font-size: 11px;
  font-family: var(--font-mono);
  padding: 3px 10px;
  border-radius: 4px;
  cursor: pointer;
}

.lidar-toggle.active {
  background: rgba(255, 60, 60, 0.25);
  color: #f87171;
  border-color: #f87171;
}

.nav-hint {
  position: absolute;
  bottom: 36px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  color: rgba(34, 197, 94, 0.9);
  font-family: var(--font-mono);
  background: rgba(15, 17, 23, 0.8);
  padding: 2px 10px;
  border-radius: 4px;
  pointer-events: none;
}

.map-info {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: var(--color-text-dim);
  font-family: var(--font-mono);
  background: rgba(15, 17, 23, 0.8);
  padding: 2px 8px;
  border-radius: 4px;
}
</style>
