<template>
  <div class="dashboard-layout">
    <div class="dashboard-grid" :style="gridStyle">
      <div class="left-panel">
        <StatusPanel />
        <DriveControl />
        <ArmControl />
      </div>
      <v-card class="center-panel">
        <v-tabs v-model="activeViz" density="compact" color="primary">
          <v-tab value="lidar">LiDAR</v-tab>
          <v-tab value="map">Map</v-tab>
          <v-tab value="3d">3D Robot</v-tab>
        </v-tabs>
        <v-divider />
        <LidarView v-if="activeViz === 'lidar'" />
        <MapView v-if="activeViz === 'map'" />
        <RobotViewer3D v-if="activeViz === '3d'" />
      </v-card>
      <div
        class="resize-handle"
        @mousedown="startResize"
      />
      <LogPanel class="right-log" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineAsyncComponent } from 'vue'
import StatusPanel from '@/components/StatusPanel.vue'
import DriveControl from '@/components/DriveControl.vue'
import ArmControl from '@/components/ArmControl.vue'
import LidarView from '@/components/LidarView.vue'
import MapView from '@/components/MapView.vue'
const RobotViewer3D = defineAsyncComponent(() => import('@/components/RobotViewer3D.vue'))
import LogPanel from '@/components/LogPanel.vue'

const activeViz = ref('lidar')
const logWidth = ref(250)

const gridStyle = computed(() => ({
  gridTemplateColumns: `280px 1fr 6px ${logWidth.value}px`,
}))

function startResize(e) {
  e.preventDefault()
  const startX = e.clientX
  const startWidth = logWidth.value

  function onMouseMove(ev) {
    const delta = startX - ev.clientX
    logWidth.value = Math.max(150, Math.min(600, startWidth + delta))
  }

  function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 48px);
  overflow: hidden;
}
.dashboard-grid {
  display: grid;
  gap: 0 8px;
  padding: 8px;
  flex: 1;
  min-height: 0;
}
.left-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  overflow-y: auto;
}
.center-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.resize-handle {
  width: 6px;
  cursor: col-resize;
  background: transparent;
  transition: background 0.15s;
  border-radius: 3px;
}
.resize-handle:hover,
.resize-handle:active {
  background: rgba(var(--v-theme-primary), 0.3);
}
.right-log {
  max-height: none;
  height: 100%;
}
@media (max-width: 900px) {
  .dashboard-layout {
    height: auto;
    min-height: 100vh;
    overflow: auto;
  }
  .dashboard-grid {
    grid-template-columns: 1fr !important;
    overflow-y: visible;
    flex: none;
  }
  .center-panel {
    min-height: 300px;
  }
  .right-log {
    height: auto;
    max-height: 200px;
  }
  .resize-handle {
    display: none;
  }
}
</style>
