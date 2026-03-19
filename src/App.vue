<template>
  <v-app>
    <ConnectionBar />
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
import ConnectionBar from '@/components/ConnectionBar.vue'
</script>
