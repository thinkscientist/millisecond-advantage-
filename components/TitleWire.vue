<script setup lang="ts">
/**
 * Title slide: one millisecond drawn across the canvas. Pulses run along it
 * and a wall clock ticks at its end. Static: wire and clock, no pulses.
 */
import Clock from './Clock.vue'
import PulseLoop from './PulseLoop.vue'

const D = 'M120 0 H1800'
const ticks = Array.from({ length: 11 }, (_, i) => 120 + i * 168)
</script>

<template>
  <div class="title-wire">
    <svg width="1920" height="60" viewBox="0 -30 1920 60">
      <path :d="D" class="wire" />
      <path v-for="x in ticks" :key="x" :d="`M${x} -8 V8`" class="wire" style="opacity: .5" />
      <PulseLoop :paths="[D]" :every="1400" :speed="1500" />
    </svg>
    <span class="l label">0 ms</span>
    <span class="m label">100 µs per tick</span>
    <span class="r label">1 ms · as of <span class="hit"><Clock mode="wall" start="14:02:07.4" :frozen="0" /></span></span>
  </div>
</template>

<style scoped>
.title-wire { position: absolute; left: 0; top: 820px; width: 1920px; height: 60px; }
svg { position: absolute; left: 0; top: 0; overflow: visible; }
.label { position: absolute; top: -22px; font-size: 16px; }
.l { left: 120px; }
.m { left: 50%; transform: translateX(-50%); }
.r { right: 120px; }
</style>
