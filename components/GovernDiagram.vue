<script setup lang="ts">
/** Slide 10 — Govern: lineage from a number back to its sources, schemas, and who may read it. */
import FlowDiagram from './FlowDiagram.vue'
import PulseLoop from './PulseLoop.vue'
import { wirePath, type FlowNode, type FlowWire, type Pt } from './flow'
import { useBeats } from './useBeats'

const { b } = useBeats()
const R = [120, 360]
const PROC_Y = 240

const nodes: FlowNode[] = [
  { id: 'oms', x: 0, y: R[0] - 45, w: 250, h: 90, label: 'Order system', beat: 2 },
  { id: 'mkt', x: 0, y: R[1] - 45, w: 250, h: 90, label: 'Market data', beat: 2 },
  { id: 't1', x: 340, y: R[0] - 45, w: 280, h: 90, label: 'fills', sub: 'topic', beat: 2 },
  { id: 't2', x: 340, y: R[1] - 45, w: 280, h: 90, label: 'prices', sub: 'topic', beat: 2 },
  { id: 'proc', x: 760, y: PROC_Y - 70, w: 280, h: 140, label: 'exposure job', sub: 'version 12 · deployed 09:14', beat: 2, tone: 'strong' },
  { id: 'exp', x: 1180, y: PROC_Y - 70, w: 500, h: 140, label: '$12,488,000.00', sub: 'exposure · ACCT-2231 · 14:02:07.412', beat: 1, tone: 'accent' },
  { id: 'client', x: 760, y: 520, w: 420, h: 110, label: 'Client portal', sub: 'ACCT-2231 only', beat: 4 },
  { id: 'reg', x: 1260, y: 520, w: 420, h: 110, label: 'Regulator', sub: 'all accounts · every read logged', beat: 4 },
]
const lineage: Pt[][] = [
  [[250, R[0]], [340, R[0]]],
  [[250, R[1]], [340, R[1]]],
  [[620, R[0]], [690, R[0]], [690, PROC_Y - 30], [760, PROC_Y - 30]],
  [[620, R[1]], [690, R[1]], [690, PROC_Y + 30], [760, PROC_Y + 30]],
  [[1040, PROC_Y], [1180, PROC_Y]],
]
const access: Pt[][] = [
  [[1390, PROC_Y + 70], [1390, 450], [1130, 450], [1130, 520]],
  [[1470, PROC_Y + 70], [1470, 520]],
]
const wires: FlowWire[] = [
  ...lineage.map((pts, i) => ({ id: `l${i}`, pts, beat: 2, hotAt: 2 })),
  ...access.map((pts, i) => ({ id: `a${i}`, pts, beat: 4 })),
]
// Pulses run backwards along the lineage: from the number to its sources.
const back = (pts: Pt[]) => wirePath([...pts].reverse())
const tracePaths = [
  back([...lineage[4], [760, PROC_Y]]),
  back([...lineage[2]]),
  back([...lineage[3]]),
  back(lineage[0]),
  back(lineage[1]),
]
</script>

<template>
  <FlowDiagram :nodes="nodes" :wires="wires">
    <text style="font-size: 20px; letter-spacing: 2px" class="svg-body" :class="b(2, 'fade')" x="0" y="30">LINEAGE · WHERE THIS NUMBER CAME FROM</text>
    <text style="font-size: 20px; letter-spacing: 2px" class="svg-body" :class="b(4, 'fade')" x="760" y="490">ACCESS · WHO MAY READ IT</text>
    <PulseLoop :paths="tracePaths" :from="2" :every="420" :speed="900" />
    <template #html>
      <div class="pill display" :class="b(3, 'lift')" :style="{ left: '340px', top: `${R[0] + 58}px` }">schema fill.v4 · enforced</div>
      <div class="pill display" :class="b(3, 'lift')" :style="{ left: '340px', top: `${R[1] + 58}px` }">schema quote.v2 · enforced</div>
      <div class="pill display" :class="b(3, 'lift')" :style="{ left: '760px', top: `${PROC_Y + 84}px` }">rejects bad records at write</div>
    </template>
  </FlowDiagram>
</template>

<style scoped>
.pill {
  position: absolute;
  padding: 6px 12px;
  font-size: 18px;
  color: var(--text);
  border: 1px solid var(--accent);
  border-radius: var(--radius);
  white-space: nowrap;
}
</style>
