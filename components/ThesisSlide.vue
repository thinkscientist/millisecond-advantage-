<script setup lang="ts">
/**
 * Slide 4 — the thesis. The statement decodes in, then two readers of the
 * same number: a person who asked a handful of times and waited, and an
 * agent whose ask counter never stops.
 * Static: counters frozen at fixed values.
 */
import { computed } from 'vue'
import Decode from './Decode.vue'
import LiveNumber from './LiveNumber.vue'
import { useNow } from './A_useNow'
import { useBeats } from './useBeats'

const { live, isStatic } = useBeats()
const now = useNow(live)
const t0 = performance.now()
// ~40 asks a second, starting mid-afternoon
const agent = computed(() => (isStatic.value || !live.value ? 14_400 : 14_400 + Math.floor((now.value - t0) / 25)))
</script>

<template>
  <div class="thesis" :class="{ moving: !isStatic }">
    <h1 class="display">
      <Decode tag="span" text="Agents need a new" /><br>
      <Decode tag="span" class="accent" text="real-time" :delay="130" />
      <Decode tag="span" text=" architecture." :delay="200" />
    </h1>
    <div class="pair">
      <div class="who panel">
        <div class="label">a person</div>
        <div class="big"><span class="display">6</span><span class="unit mono">asks</span></div>
        <p>Waits fifteen minutes for each answer, and complains.</p>
      </div>
      <div class="who panel agent">
        <div class="label">an agent <span class="dot breathe" /></div>
        <div class="big"><LiveNumber :value="agent.toLocaleString('en-US')" :size="72" :still="isStatic" /><span class="unit mono">asks</span></div>
        <p>Acts on whatever number it is given, thousands of times a second.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.thesis { position: absolute; left: 120px; right: 120px; top: 200px; }
h1 { font-size: 112px; line-height: 1.08; margin: 0 0 72px; letter-spacing: 0; }
.pair { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.moving .pair { animation: ss-enter 700ms var(--ease-out) 700ms both; }
.who { padding: 26px 30px; }
.who p { font-size: 28px; line-height: 1.35; margin: 12px 0 0; color: var(--muted); }
.big { font-size: 72px; line-height: 1; margin-top: 16px; display: flex; align-items: baseline; gap: 16px; }
.unit { font-size: 20px; color: var(--muted); letter-spacing: 0.05em; text-transform: uppercase; }
.agent { border-color: rgba(120, 169, 255, .45); }
.agent .label { display: flex; align-items: center; gap: 10px; color: var(--hit); }
.dot { width: 8px; height: 8px; border-radius: 50%; background: var(--hit); }
</style>
