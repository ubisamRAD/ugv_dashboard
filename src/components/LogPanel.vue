<template>
  <div class="log-panel">
    <div class="log-header">
      <span class="log-title">Log</span>
      <span class="log-count">{{ logs.length }}</span>
    </div>
    <div class="log-list" ref="listRef">
      <div
        v-for="(entry, i) in logs"
        :key="i"
        :class="['log-entry', entry.level]"
      >
        <span class="log-time">{{ entry.time }}</span>
        <span class="log-level">{{ entry.level.toUpperCase() }}</span>
        <span class="log-msg">{{ entry.message }}</span>
      </div>
      <div v-if="logs.length === 0" class="log-empty">No logs yet</div>
    </div>
  </div>
</template>

<script setup>
import { useRos } from '@/composables/useRos'

const { logs } = useRos()
</script>

<style scoped>
.log-panel {
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
  max-height: 140px;
  display: flex;
  flex-direction: column;
}

.log-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.log-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-dim);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.log-count {
  font-size: 10px;
  color: var(--color-text-dim);
  background: var(--color-surface-alt);
  padding: 0 6px;
  border-radius: 8px;
}

.log-list {
  overflow-y: auto;
  padding: 4px 14px;
  flex: 1;
}

.log-entry {
  display: flex;
  gap: 8px;
  padding: 2px 0;
  font-size: 11px;
  font-family: var(--font-mono);
  line-height: 1.4;
}

.log-time {
  color: var(--color-text-dim);
  flex-shrink: 0;
}

.log-level {
  flex-shrink: 0;
  width: 40px;
  font-weight: 600;
}

.log-entry.info .log-level { color: var(--color-accent); }
.log-entry.warn .log-level { color: var(--color-warning); }
.log-entry.error .log-level { color: var(--color-danger); }

.log-msg {
  color: var(--color-text);
  word-break: break-all;
}

.log-empty {
  color: var(--color-text-dim);
  font-size: 12px;
  text-align: center;
  padding: 12px;
}
</style>
