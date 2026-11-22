<script setup lang="ts">
/** Slide 6 — sources → five pillars → consumers, with Govern underneath. */
import FlowDiagram from './FlowDiagram.vue'
import PulseLoop from './PulseLoop.vue'
import { wirePath, type FlowNode, type FlowWire, type Pt } from './flow'

const ROWS = [140, 260, 380, 500]
const SOURCES = ['Order system', 'Market data', 'Treasury FX', 'Client CRM']
const CONSUMERS = ['Desk app', 'Risk agent', 'Client portal', 'Regulator']
const PILLARS = ['Connect', 'Stream', 'Process', 'Query']
const PX = [330, 580, 830, 1080] // pillar x
const PW = 190
const MID = 320

const nodes: FlowNode[] = [
  ...SOURCES.map((label, i) => ({ id: `s${i}`, x: 0, y: ROWS[i] - 40, w: 250, h: 80, label })),
  ...PILLARS.map((label, i) => ({ id: label, x: PX[i], y: MID - 60, w: PW, h: 120, label, tone: 'strong' as const })),
  { id: 'govern', x: PX[0], y: 470, w: PX[3] + PW - PX[0], h: 100, label: 'Govern', sub: 'schemas · lineage · access · audit', tone: 'strong' },
  ...CONSUMERS.map((label, i) => ({ id: `c${i}`, x: 1400, y: ROWS[i] - 40, w: 280, h: 80, label })),
]

const srcW: Pt[][] = ROWS.map(cy => [[250, cy], [290, cy], [290, MID], [PX[0], MID]])
const chainW: Pt[][] = [0, 1, 2].map(i => [[PX[i] + PW, MID], [PX[i + 1], MID]])
const outW: Pt[][] = ROWS.map(cy => [[PX[3] + PW, MID], [1340, MID], [1340, cy], [1400, cy]])
const backW: Pt[] = [[PX[2] + PW / 2, MID - 60], [PX[2] + PW / 2, 170], [PX[1] + PW / 2, 170], [PX[1] + PW / 2, MID - 60]]
const govW: Pt[][] = PX.map(x => [[x + PW / 2, 470], [x + PW / 2, MID + 60]])

const wires: FlowWire[] = [
  ...srcW.map((pts, i) => ({ id: `sw${i}`, pts })),
  ...chainW.map((pts, i) => ({ id: `cw${i}`, pts })),
  ...outW.map((pts, i) => ({ id: `ow${i}`, pts })),
  { id: 'back', pts: backW, dashed: true },
  ...govW.map((pts, i) => ({ id: `gw${i}`, pts, dashed: true, arrow: false })),
]
const inPaths = srcW.map(p => wirePath(p))
const flowPaths = [...chainW, ...outW].map(p => wirePath(p))
</script>

<template>
  <FlowDiagram :nodes="nodes" :wires="wires">
    <text style="font-size: 20px" class="svg-body" :x="(PX[1] + PX[2] + PW) / 2" y="154" text-anchor="middle">results written back as streams</text>
    <text style="font-size: 20px; letter-spacing: 2px" class="svg-body" x="125" y="60" text-anchor="middle">SOURCES</text>
    <text style="font-size: 20px; letter-spacing: 2px" class="svg-body" x="1540" y="60" text-anchor="middle">CONSUMERS</text>
    <PulseLoop :paths="inPaths" :every="520" />
    <PulseLoop :paths="flowPaths" :every="380" :speed="1300" />
  </FlowDiagram>
</template>
