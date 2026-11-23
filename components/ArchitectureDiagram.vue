<script setup lang="ts">
/**
 * Slide 6 — sources → five pillars → consumers, with Govern underneath.
 * Records pulse in from the sources; each arrival makes the node it lands
 * on glow. Process is the live (blue) pillar; results loop back to Stream.
 * Consumers show an "as of" clock and an answered counter that keeps rising.
 * Static: no pulses, clock and counter frozen.
 */
import { computed, ref } from 'vue'
import Clock from './Clock.vue'
import FlowDiagram from './FlowDiagram.vue'
import LiveNumber from './LiveNumber.vue'
import PulseLoop from './PulseLoop.vue'
import { wirePath, type FlowNode, type FlowWire, type Pt } from './flow'
import { useBeats } from './useBeats'

const { isStatic } = useBeats()

const ROWS = [150, 265, 380, 495]
const SOURCES = ['Order system', 'Market data', 'Treasury FX', 'Client CRM']
const CONSUMERS = ['Desk app', 'Risk agent', 'Client portal', 'Regulator']
const PILLARS = [
  { id: 'Connect', sub: '01 · capture' },
  { id: 'Stream', sub: '02 · keep' },
  { id: 'Process', sub: '03 · compute' },
  { id: 'Query', sub: '05 · serve' },
]
const PX = [330, 580, 830, 1080] // pillar x
const PW = 190
const MID = 320

const nodes: FlowNode[] = [
  ...SOURCES.map((label, i) => ({ id: `s${i}`, x: 0, y: ROWS[i] - 40, w: 250, h: 80, label })),
  ...PILLARS.map((p, i) => ({ id: p.id, x: PX[i], y: MID - 60, w: PW, h: 120, label: p.id, sub: p.sub, tone: (p.id === 'Process' ? 'live' : 'strong') as FlowNode['tone'] })),
  { id: 'govern', x: PX[0], y: 470, w: PX[3] + PW - PX[0], h: 100, label: 'Govern', sub: '04 · schemas · lineage · access · audit', tone: 'strong' },
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
const chainPaths = chainW.map(p => wirePath(p))
const outPaths = outW.map(p => wirePath(p))
const backPath = [wirePath(backW)]

const flow = ref<InstanceType<typeof FlowDiagram>>()
const answered = ref(1_284)
const shownAnswered = computed(() => (isStatic.value ? 1_284 : answered.value))
const glow = (id: string, s = 0.9) => flow.value?.flash(id, s)
function onOut(i: number) {
  glow(`c${i}`)
  answered.value++
}
</script>

<template>
  <FlowDiagram ref="flow" :nodes="nodes" :wires="wires">
    <text style="font-size: 18px" class="svg-body" :x="(PX[1] + PX[2] + PW) / 2" y="158" text-anchor="middle">results written back as streams</text>
    <text style="font-size: 18px; letter-spacing: 2px" class="svg-mono" x="0" y="70" fill="var(--muted)">SOURCES</text>
    <PulseLoop :paths="inPaths" :every="520" @land="() => glow('Connect', 0.7)" />
    <PulseLoop :paths="chainPaths" :every="460" :speed="1300" @land="i => glow(PILLARS[i + 1].id)" />
    <PulseLoop :paths="outPaths" :every="380" :speed="1400" @land="onOut" />
    <PulseLoop :paths="backPath" :every="1900" :speed="900" @land="() => glow('Stream', 0.6)" />
    <template #html>
      <div class="cons-head">
        <span class="label">consumers</span>
        <span class="label">as of <span class="hit"><Clock mode="wall" start="14:02:07.4" :frozen="0" /></span></span>
      </div>
      <div class="answered">
        <span class="label">answered from Query</span>
        <LiveNumber :value="shownAnswered.toLocaleString('en-US')" :size="26" :still="isStatic" />
      </div>
    </template>
  </FlowDiagram>
</template>

<style scoped>
.cons-head { position: absolute; left: 1400px; top: 50px; width: 280px; display: flex; justify-content: space-between; }
.cons-head .label { font-size: 15px; }
.answered { position: absolute; left: 1400px; top: 560px; width: 280px; display: flex; justify-content: space-between; align-items: baseline; }
.answered .label { font-size: 15px; }
</style>
