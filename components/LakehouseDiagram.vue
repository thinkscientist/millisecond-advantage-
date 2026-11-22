<script setup lang="ts">
/** Slide 15 — streamhouse for now and next, lakehouse for history; same data. */
import FlowDiagram from './FlowDiagram.vue'
import PulseLoop from './PulseLoop.vue'
import { wirePath, type FlowNode, type FlowWire, type Pt } from './flow'
import { useBeats } from './useBeats'

const { b } = useBeats()
const L = 0
const RX = 940
const PW = 740
const nodes: FlowNode[] = [
  { id: 'streams', x: L + 60, y: 160, w: 380, h: 110, label: 'Live streams', sub: 'every change, in order', beat: 1, tone: 'strong' },
  { id: 'apps', x: L + 60, y: 420, w: 380, h: 110, label: 'Agents & apps', sub: 'act in milliseconds', beat: 1 },
  { id: 'tables', x: RX + 300, y: 160, w: 380, h: 110, label: 'Open tables', sub: 'Iceberg · Delta', beat: 2, tone: 'strong' },
  { id: 'bi', x: RX + 300, y: 420, w: 380, h: 110, label: 'BI · ML · reports', sub: 'look back over years', beat: 2 },
]
const toApps: Pt[] = [[L + 250, 270], [L + 250, 420]]
const toBi: Pt[] = [[RX + 490, 270], [RX + 490, 420]]
const mat: Pt[] = [[L + 440, 200], [RX + 300, 200]]
const hist: Pt[] = [[RX + 300, 240], [L + 440, 240]]
const wires: FlowWire[] = [
  { id: 'apps', pts: toApps, beat: 1 },
  { id: 'bi', pts: toBi, beat: 2 },
  { id: 'mat', pts: mat, beat: 3, hotAt: 3 },
  { id: 'hist', pts: hist, beat: 3, dashed: true },
]
</script>

<template>
  <FlowDiagram :nodes="nodes" :wires="wires">
    <g :class="b(1, 'fade')">
      <rect :x="L" y="60" :width="PW" height="560" rx="6" class="node-box ghost" />
      <text style="font-size: 28px" class="svg-mono" :x="L + 30" y="110">Streamhouse</text>
      <text style="font-size: 22px" class="svg-body" :x="L + PW - 30" y="110" text-anchor="end">what is happening, what happens next</text>
    </g>
    <g :class="b(2, 'fade')">
      <rect :x="RX" y="60" :width="PW" height="560" rx="6" class="node-box ghost" />
      <text style="font-size: 28px" class="svg-mono" :x="RX + 30" y="110">Lakehouse</text>
      <text style="font-size: 22px" class="svg-body" :x="RX + PW - 30" y="110" text-anchor="end">what happened</text>
    </g>
    <g :class="b(3, 'fade')">
      <text style="font-size: 20px" class="svg-body" :x="(L + 440 + RX + 300) / 2" y="184" text-anchor="middle">materialized continuously</text>
      <text style="font-size: 20px" class="svg-body" :x="(L + 440 + RX + 300) / 2" y="276" text-anchor="middle">history for replay &amp; backfill</text>
    </g>
    <PulseLoop :paths="[wirePath(toApps)]" :from="1" :every="700" />
    <PulseLoop :paths="[wirePath(mat)]" :from="3" :every="700" />
  </FlowDiagram>
</template>
