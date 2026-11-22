<script setup lang="ts">
/** Title slide decoration: one wire across the canvas with a pulse running along it. */
import PulseLoop from './PulseLoop.vue'

const D = 'M120 0 H1800'
const ticks = Array.from({ length: 15 }, (_, i) => 120 + i * 120)
</script>

<template>
  <svg class="title-wire" width="1920" height="60" viewBox="0 -30 1920 60">
    <path :d="D" class="wire" />
    <path v-for="x in ticks" :key="x" :d="`M${x} -8 V8`" class="wire" style="opacity: .5" />
    <text style="font-size: 22px" class="svg-body" x="120" y="-14">0 ms</text>
    <text style="font-size: 22px" class="svg-body" x="1800" y="-14" text-anchor="end">1 ms</text>
    <PulseLoop :paths="[D]" :every="1800" :speed="1500" />
  </svg>
</template>

<style scoped>
.title-wire { position: absolute; left: 0; top: 900px; overflow: visible; }
</style>
