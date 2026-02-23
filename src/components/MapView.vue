<template>
  <div class="map-container" ref="containerRef">
    <canvas ref="canvasRef" @click="onCanvasClick" @wheel="onWheel"></canvas>
    <div class="map-info">
      <span v-if="mapData">{{ mapData.width }}x{{ mapData.height }} | {{ mapData.resolution }}m/px</span>
      <span v-else>No map data</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useMap } from '@/composables/useMap'
import { useRobotState } from '@/composables/useRobotState'

const { mapData, globalPath, publishNavGoal } = useMap()
const { position, orientation } = useRobotState()

const canvasRef = ref(null)
const containerRef = ref(null)
const mapZoom = ref(1)

let animationId = null
let resizeObserver = null
let mapImageData = null

function resizeCanvas() {
  const canvas = canvasRef.value
  const container = containerRef.value
  if (!canvas || !container) return
  canvas.width = container.clientWidth
  canvas.height = container.clientHeight
}

function buildMapImage() {
  const map = mapData.value
  if (!map) return

  const { width, height, data } = map
  const imageData = new ImageData(width, height)

  for (let i = 0; i < data.length; i++) {
    const val = data[i]
    let r, g, b
    if (val === -1) {
      r = 40; g = 43; b = 55
    } else if (val === 0) {
      r = 230; g = 233; b = 240
    } else {
      const shade = Math.max(0, 255 - Math.floor(val * 2.55))
      r = shade; g = shade; b = shade
    }
    const idx = i * 4
    imageData.data[idx] = r
    imageData.data[idx + 1] = g
    imageData.data[idx + 2] = b
    imageData.data[idx + 3] = 255
  }

  mapImageData = imageData
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
  if (!map || !mapImageData) {
    ctx.fillStyle = '#8b90a5'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Waiting for /map ...', w / 2, h / 2)
    animationId = requestAnimationFrame(draw)
    return
  }

  const { width, height, resolution, origin } = map
  const scale = mapZoom.value * Math.min(w / width, h / height)

  ctx.save()
  ctx.translate(w / 2, h / 2)
  ctx.scale(scale, -scale)
  ctx.translate(-width / 2, -height / 2)

  const offCanvas = new OffscreenCanvas(width, height)
  const offCtx = offCanvas.getContext('2d')
  offCtx.putImageData(mapImageData, 0, 0)
  ctx.drawImage(offCanvas, 0, 0)

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

  // Robot position
  const rx = (position.value.x - origin.position.x) / resolution
  const ry = (position.value.y - origin.position.y) / resolution

  ctx.save()
  ctx.translate(rx, ry)
  ctx.rotate(orientation.value)

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

function onWheel(e) {
  e.preventDefault()
  mapZoom.value = Math.max(0.2, Math.min(10, mapZoom.value * (1 - e.deltaY * 0.001)))
}

function onCanvasClick(e) {
  const map = mapData.value
  if (!map) return

  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  const { width, height, resolution, origin } = map

  const scale = mapZoom.value * Math.min(canvas.width / width, canvas.height / height)

  const px = (e.clientX - rect.left - canvas.width / 2) / scale + width / 2
  const py = -(e.clientY - rect.top - canvas.height / 2) / scale + height / 2

  const worldX = px * resolution + origin.position.x
  const worldY = py * resolution + origin.position.y

  publishNavGoal(worldX, worldY, 0)
}

watch(mapData, buildMapImage)

onMounted(() => {
  resizeCanvas()
  resizeObserver = new ResizeObserver(resizeCanvas)
  resizeObserver.observe(containerRef.value)
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

.map-info {
  position: absolute;
  bottom: 8px;
  right: 8px;
  font-size: 11px;
  color: var(--color-text-dim);
  font-family: var(--font-mono);
  background: rgba(15, 17, 23, 0.8);
  padding: 2px 8px;
  border-radius: 4px;
}
</style>
