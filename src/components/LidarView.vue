<template>
  <div class="lidar-container" ref="containerRef">
    <canvas ref="canvasRef" @wheel="onWheel"></canvas>
    <div class="lidar-info">
      <span>{{ scanPoints.length }} pts</span>
      <span>Zoom: {{ zoom.toFixed(1) }}x</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useLidar } from '@/composables/useLidar'

const { scanPoints } = useLidar()

const canvasRef = ref(null)
const containerRef = ref(null)
const zoom = ref(80)

let animationId = null
let resizeObserver = null

function resizeCanvas() {
  const canvas = canvasRef.value
  const container = containerRef.value
  if (!canvas || !container) return

  canvas.width = container.clientWidth
  canvas.height = container.clientHeight
}

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height
  const cx = w / 2
  const cy = h / 2

  ctx.fillStyle = '#0f1117'
  ctx.fillRect(0, 0, w, h)

  // Grid
  ctx.strokeStyle = '#1a1d27'
  ctx.lineWidth = 1
  const gridStep = zoom.value
  for (let r = gridStep; r < Math.max(w, h); r += gridStep) {
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Axes
  ctx.strokeStyle = '#2e3348'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, cy)
  ctx.lineTo(w, cy)
  ctx.moveTo(cx, 0)
  ctx.lineTo(cx, h)
  ctx.stroke()

  // Robot
  ctx.fillStyle = var_accent
  ctx.beginPath()
  ctx.moveTo(cx + 8, cy)
  ctx.lineTo(cx - 5, cy - 5)
  ctx.lineTo(cx - 5, cy + 5)
  ctx.closePath()
  ctx.fill()

  // Scan points
  const points = scanPoints.value
  ctx.fillStyle = '#34d399'
  for (const pt of points) {
    const px = cx + pt.x * zoom.value
    const py = cy - pt.y * zoom.value
    ctx.fillRect(px - 1, py - 1, 2, 2)
  }

  animationId = requestAnimationFrame(draw)
}

const var_accent = '#4e8cff'

function onWheel(e) {
  e.preventDefault()
  zoom.value = Math.max(10, Math.min(500, zoom.value - e.deltaY * 0.1))
}

onMounted(() => {
  resizeCanvas()
  resizeObserver = new ResizeObserver(resizeCanvas)
  resizeObserver.observe(containerRef.value)
  animationId = requestAnimationFrame(draw)
})

// draw loop is continuous via rAF, no need to watch scanPoints

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  if (resizeObserver) resizeObserver.disconnect()
})
</script>

<style scoped>
.lidar-container {
  flex: 1;
  position: relative;
  min-height: 200px;
  overflow: hidden;
}

canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.lidar-info {
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
