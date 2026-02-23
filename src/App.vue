<template>
  <router-view />
</template>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --color-bg: #0f1117;
  --color-surface: #1a1d27;
  --color-surface-alt: #232736;
  --color-border: #2e3348;
  --color-text: #e1e4ed;
  --color-text-dim: #8b90a5;
  --color-accent: #4e8cff;
  --color-accent-hover: #6ba0ff;
  --color-success: #34d399;
  --color-warning: #fbbf24;
  --color-danger: #f87171;
  --radius: 8px;
  --font-mono: 'Consolas', 'Monaco', monospace;
}

html, body {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--color-bg);
  color: var(--color-text);
  line-height: 1.5;
}

#app {
  height: 100%;
}

button {
  cursor: pointer;
  border: none;
  font-family: inherit;
}

input {
  font-family: inherit;
}
</style>
