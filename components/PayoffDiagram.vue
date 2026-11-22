<script setup lang="ts">
/** Slide 13 — one record serving three readers on three timescales. */
import FlowDiagram from './FlowDiagram.vue'
import PulseLoop from './PulseLoop.vue'
import { wirePath, type FlowNode, type FlowWire, type Pt } from './flow'
import { useBeats } from './useBeats'

const { b } = useBeats()
const R = [110, 330, 550]
const READERS = [
  { label: 'Risk agent', sub: 'acts on it: tightens a limit', when: '≈ 5 ms', beat: 2 },
  { label: 'Desk dashboard', sub: 'a person sees the new exposure', when: '≈ 1 s', beat: 3 },
  { label: 'Regulator', sub: 'replays the day, record by record', when: '+ 6 months', beat: 4 },
]
const nodes: FlowNode[] = [
  { id: 'rec', x: 0, y: 260, w: 520, h: 140, label: 'fill · XYZ +10,000', sub: 'ACCT-2231 · 14:02:07.412', beat: 1, tone: 'accent' },
  ...READERS.map((r, i) => ({ id: `r${i}`, x: 980, y: R[i] - 60, w: 700, h: 120, label: r.label, sub: r.sub, beat: r.beat, align: 'left' as const })),
]
const W: Pt[][] = R.map(cy => [[520, 330], [760, 330], [760, cy], [980, cy]])
const wires: FlowWire[] = W.map((pts, i) => ({ id: `w${i}`, pts, beat: READERS[i].beat, dashed: i === 2 }))
</script>

<template>
  <FlowDiagram :nodes="nodes" :wires="wires">
    <PulseLoop :paths="[wirePath(W[0])]" :from="2" :every="500" :speed="2200" />
    <PulseLoop :paths="[wirePath(W[1])]" :from="3" :every="1400" :speed="900" />
    <PulseLoop :paths="[wirePath(W[2])]" :from="4" :every="3200" :speed="500" />
    <template #html>
      <div
        v-for="(r, i) in READERS" :key="i" class="when display" :class="b(r.beat, 'fade')"
        :style="{ top: `${R[i] - 22}px` }"
      >{{ r.when }}</div>
    </template>
  </FlowDiagram>
</template>

<style scoped>
.when {
  position: absolute; right: 30px; font-size: 36px; color: var(--accent); text-align: right;
}
</style>
