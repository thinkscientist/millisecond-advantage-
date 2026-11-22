<script setup lang="ts">
/** Slide 2 — a timeline of one question, and the clock running beside it. */
import { computed } from 'vue'
import LiveNumber from './LiveNumber.vue'
import { useBeats } from './useBeats'

const { b, clicks, isStatic } = useBeats()

const EVENTS = [
  { t: '14:02', text: 'A client calls the desk: “What is my exposure, across everything, right now?”' },
  { t: '14:02', text: 'The risk dashboard shows 13:00. It refreshes once an hour.' },
  { t: '14:04', text: 'Positions sit in the order system. Prices in the market-data feed. FX in treasury.' },
  { t: '14:09', text: 'An analyst exports all three and joins them in a spreadsheet.' },
  { t: '14:17', text: 'The answer goes out. The market has moved twice since.' },
]
const ELAPSED = ['0:00', '0:00', '0:00', '2:00', '7:00', '15:00', '15:00']
const elapsed = computed(() => ELAPSED[Math.min(clicks.value, 6)].padStart(5, ' '))
</script>

<template>
  <div class="brokerage">
    <ol class="timeline">
      <li v-for="(e, i) in EVENTS" :key="i" :class="b(i + 1, 'rise')">
        <span class="t display" :class="{ accent: clicks === i + 1 }">{{ e.t }}</span>
        <span class="txt">{{ e.text }}</span>
      </li>
    </ol>
    <div class="clock" :class="b(1, 'fade')">
      <div class="label display muted">TIME TO ANSWER</div>
      <LiveNumber :value="elapsed" :size="136" :still="isStatic" />
      <div class="label display muted">MIN</div>
    </div>
  </div>
</template>

<style scoped>
.brokerage { position: relative; width: 1680px; height: 660px; }
.timeline { list-style: none; margin: 0; padding: 0; width: 1120px; }
.timeline li {
  display: flex; gap: 40px; align-items: baseline;
  padding: 22px 0; border-top: 1px solid var(--rule);
  font-size: 34px; line-height: 1.3;
}
.t { font-size: 30px; width: 110px; flex: none; color: var(--muted); }
.t.accent { color: var(--accent); }
.clock { position: absolute; right: 0; top: 120px; width: 440px; text-align: right; }
.label { font-size: 20px; letter-spacing: 0.14em; margin: 14px 0; }
</style>
