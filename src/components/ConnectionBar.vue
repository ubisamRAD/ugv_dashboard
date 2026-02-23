<template>
  <div class="connection-bar">
    <div class="bar-left">
      <span class="logo">UGV Dashboard</span>
    </div>
    <div class="bar-center">
      <div class="url-group">
        <span :class="['dot', { connected: isConnected }]"></span>
        <input
          v-model="url"
          type="text"
          class="url-input"
          placeholder="ws://192.168.0.71:9090"
          :disabled="isConnected"
          @keyup.enter="handleConnect"
        />
        <button
          :class="['conn-btn', { disconnect: isConnected }]"
          @click="handleConnect"
        >
          {{ isConnected ? 'Disconnect' : 'Connect' }}
        </button>
      </div>
    </div>
    <div class="bar-right">
      <span class="status-text">{{ isConnected ? 'Connected' : 'Disconnected' }}</span>
    </div>
  </div>
</template>

<script setup>
import { useRos } from '@/composables/useRos'

const { url, isConnected, connect, disconnect } = useRos()

function handleConnect() {
  if (isConnected.value) {
    disconnect()
  } else {
    connect(url.value)
  }
}
</script>

<style scoped>
.connection-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
  gap: 16px;
}

.logo {
  font-weight: 700;
  font-size: 15px;
  color: var(--color-accent);
  white-space: nowrap;
}

.bar-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.url-group {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-surface-alt);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 4px 8px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-danger);
  flex-shrink: 0;
  transition: background 0.3s;
}

.dot.connected {
  background: var(--color-success);
  box-shadow: 0 0 6px var(--color-success);
}

.url-input {
  background: transparent;
  border: none;
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: 13px;
  width: 240px;
  outline: none;
}

.url-input:disabled {
  color: var(--color-text-dim);
}

.conn-btn {
  padding: 4px 14px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background: var(--color-accent);
  color: #fff;
  transition: background 0.2s;
  white-space: nowrap;
}

.conn-btn:hover {
  background: var(--color-accent-hover);
}

.conn-btn.disconnect {
  background: var(--color-danger);
}

.conn-btn.disconnect:hover {
  background: #ef4444;
}

.status-text {
  font-size: 12px;
  color: var(--color-text-dim);
  white-space: nowrap;
}
</style>
