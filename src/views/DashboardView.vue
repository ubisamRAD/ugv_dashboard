<template>
  <div class="dashboard">
    <ConnectionBar />
    <div class="dashboard-grid">
      <div class="panel left-panel">
        <StatusPanel />
        <DriveControl />
        <ArmControl />
      </div>
      <div class="panel right-panel">
        <div class="viz-tabs">
          <button
            :class="['tab-btn', { active: activeViz === 'lidar' }]"
            @click="activeViz = 'lidar'"
          >LiDAR</button>
          <button
            :class="['tab-btn', { active: activeViz === 'map' }]"
            @click="activeViz = 'map'"
          >Map</button>
        </div>
        <LidarView v-if="activeViz === 'lidar'" />
        <MapView v-if="activeViz === 'map'" />
      </div>
    </div>
    <LogPanel />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ConnectionBar from '@/components/ConnectionBar.vue'
import StatusPanel from '@/components/StatusPanel.vue'
import DriveControl from '@/components/DriveControl.vue'
import ArmControl from '@/components/ArmControl.vue'
import LidarView from '@/components/LidarView.vue'
import MapView from '@/components/MapView.vue'
import LogPanel from '@/components/LogPanel.vue'

const activeViz = ref('lidar')
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 8px;
  padding: 8px;
  flex: 1;
  min-height: 0;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  overflow-y: auto;
}

.right-panel {
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.viz-tabs {
  display: flex;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.tab-btn {
  flex: 1;
  padding: 8px;
  background: transparent;
  color: var(--color-text-dim);
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.tab-btn.active {
  color: var(--color-accent);
  background: var(--color-surface-alt);
  box-shadow: inset 0 -2px 0 var(--color-accent);
}

@media (max-width: 900px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }
}
</style>
