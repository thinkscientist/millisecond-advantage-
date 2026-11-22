<script setup lang="ts">
/** Slide 14 — the world before: copies and pipelines, each a little staler. */
import FlowDiagram from './FlowDiagram.vue'
import { useBeats } from './useBeats'
import type { FlowNode, FlowWire, Pt } from './flow'

const { b } = useBeats()
const C = [0, 360, 740, 1120, 1460] // column x
const nw = [240, 260, 260, 260, 220]
const box = (id: string, col: number, cy: number, label: string, beat: number, tone?: FlowNode['tone']): FlowNode =>
  ({ id, x: C[col], y: cy - 45, w: nw[col], h: 90, label, beat, tone })

const nodes: FlowNode[] = [
  box('oms', 0, 110, 'Orders', 1), box('mkt', 0, 330, 'Prices', 1), box('fx', 0, 550, 'FX', 1),
  box('etl', 1, 110, 'Nightly ETL', 2, 'ghost'), box('cdc', 1, 330, 'CDC job', 2, 'ghost'), box('drop', 1, 550, 'File drop', 2, 'ghost'),
  box('wh', 2, 220, 'Warehouse', 2), box('mart', 2, 440, 'Risk mart', 2),
  box('ext', 3, 110, 'Hourly extract', 2, 'ghost'), box('cache', 3, 330, 'Dash cache', 2), box('xls', 3, 550, 'Spreadsheet', 2),
  box('desk', 4, 330, 'The desk', 1, 'strong'),
]
const right = (col: number) => C[col] + nw[col]
const link = (id: string, c1: number, y1: number, c2: number, y2: number): FlowWire => {
  const mx = (right(c1) + C[c2]) / 2
  const pts: Pt[] = y1 === y2 ? [[right(c1), y1], [C[c2], y2]] : [[right(c1), y1], [mx, y1], [mx, y2], [C[c2], y2]]
  return { id, pts, beat: 2, dashed: true }
}
const wires: FlowWire[] = [
  link('a', 0, 110, 1, 110), link('b', 0, 330, 1, 330), link('c', 0, 550, 1, 550),
  link('d', 1, 110, 2, 205), link('e', 1, 330, 2, 235), link('f', 1, 345, 2, 425), link('g', 1, 550, 2, 455),
  link('h', 2, 205, 3, 110), link('i', 2, 235, 3, 320), link('j', 2, 425, 3, 340), link('k', 2, 455, 3, 550),
  link('l', 3, 110, 4, 315), link('m', 3, 330, 4, 330), link('n', 3, 550, 4, 345),
]
const STALE = [
  { x: C[1], y: 110, t: 'nightly' }, { x: C[1], y: 330, t: '+5 min' }, { x: C[1], y: 550, t: '+1 h' },
  { x: C[2], y: 220, t: '+12 h' }, { x: C[2], y: 440, t: '+1 h' },
  { x: C[3], y: 110, t: '+1 h' }, { x: C[3], y: 330, t: '+15 min' }, { x: C[3], y: 550, t: 'manual' },
]
</script>

<template>
  <FlowDiagram :nodes="nodes" :wires="wires">
    <template #html>
      <div
        v-for="(s, i) in STALE" :key="i" class="stale display" :class="b(3, 'lift')"
        :style="{ left: `${s.x}px`, top: `${s.y - 78}px` }"
      >{{ s.t }}</div>
    </template>
  </FlowDiagram>
</template>

<style scoped>
.stale {
  position: absolute; font-size: 20px; color: var(--accent); white-space: nowrap;
}
</style>
