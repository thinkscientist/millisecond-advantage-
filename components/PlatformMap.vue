<script setup lang="ts">
/**
 * Slides 16–17 — map a left column (pillars, or the streamhouse) onto a
 * right column of products. Left appears at beat 1, right + wires at beat 2.
 * Names decode in as they appear; pulses run left to right and each box
 * glows as one lands.
 */
import { computed, ref } from 'vue'
import Decode from './Decode.vue'
import FlowDiagram from './FlowDiagram.vue'
import PulseLoop from './PulseLoop.vue'
import { wirePath, type FlowNode, type FlowWire, type Pt } from './flow'
import { useBeats } from './useBeats'

const props = defineProps<{
  left: { label: string, sub?: string }[]
  right: { label: string, sub?: string }[]
  /** 'pairs': row i → row i. 'fan': single left node fans out to every row */
  mode?: 'pairs' | 'fan'
}>()

const { b, at } = useBeats()
const H = 660
const LW = 340
const RX = 640
const rowsOf = (n: number) => Array.from({ length: n }, (_, i) => (H / n) * (i + 0.5))

const layout = computed(() => {
  const ry = rowsOf(props.right.length)
  const rh = Math.min(108, H / props.right.length - 22)
  const ly = props.mode === 'fan' ? [H / 2] : ry
  const lh = props.mode === 'fan' ? 220 : rh
  const nodes: FlowNode[] = [
    ...props.left.map((_, i) => ({ id: `l${i}`, x: 0, y: ly[i] - lh / 2, w: LW, h: lh, label: '', beat: 1, tone: 'strong' as const })),
    ...props.right.map((_, i) => ({ id: `r${i}`, x: RX, y: ry[i] - rh / 2, w: 1680 - RX, h: rh, label: '', beat: 2 })),
  ]
  const W: Pt[][] = props.right.map((_, i) => {
    const y0 = props.mode === 'fan' ? H / 2 : ry[i]
    return y0 === ry[i] ? [[LW, y0], [RX, ry[i]]] : [[LW, y0], [(LW + RX) / 2, y0], [(LW + RX) / 2, ry[i]], [RX, ry[i]]]
  })
  const wires: FlowWire[] = W.map((pts, i) => ({ id: `w${i}`, pts, beat: 2 }))
  return { nodes, wires, paths: W.map(p => wirePath(p)), ly, lh, ry, rh }
})

const flow = ref<InstanceType<typeof FlowDiagram>>()
const lands = ref<number[]>(props.right.map(() => 0))
function landed(i: number) {
  flow.value?.flash(`r${i}`, 0.85)
  if (props.mode === 'fan') flow.value?.flash('l0', 0.35)
  lands.value[i]++
}
</script>

<template>
  <FlowDiagram ref="flow" :nodes="layout.nodes" :wires="layout.wires">
    <PulseLoop :paths="layout.paths" :from="2" :every="520" @land="landed" />
    <template #html>
      <div
        v-for="(n, i) in left" :key="`l${i}`" class="cell left" :class="b(1, 'fade')"
        :style="{ top: `${layout.ly[i] - layout.lh / 2}px`, height: `${layout.lh}px`, width: `${LW}px` }"
      >
        <Decode :key="`l${i}-${at(1)}`" class="name" :text="n.label" />
        <span v-if="n.sub" class="label sub">{{ n.sub }}</span>
        <span v-if="mode === 'fan'" class="live label"><span class="dot breathe" />live</span>
      </div>
      <div
        v-for="(n, i) in right" :key="`r${i}`" class="cell right" :class="b(2, 'fade')"
        :style="{ top: `${layout.ry[i] - layout.rh / 2}px`, height: `${layout.rh}px`, left: `${RX}px`, width: `${1680 - RX}px` }"
      >
        <Decode :key="`r${i}-${at(2)}`" class="name" :text="n.label" :delay="i * 90" />
        <span v-if="n.sub" class="label sub">{{ n.sub }}</span>
        <span :key="lands[i]" class="tick" :class="{ go: lands[i] > 0 }" />
      </div>
    </template>
  </FlowDiagram>
</template>

<style scoped>
.cell { position: absolute; left: 0; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; padding: 0 28px; }
.cell.left { align-items: center; text-align: center; }
.name { font-size: 30px; font-weight: 700; letter-spacing: 0; white-space: nowrap; }
.sub { font-size: 15px; margin-top: 6px; white-space: nowrap; }
.live { position: absolute; top: 14px; right: 16px; font-size: 13px; display: flex; gap: 8px; align-items: center; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: var(--hit); }
.tick { position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--hit); opacity: 0; }
.tick.go { animation: tick-go 780ms var(--ease-out); }
@keyframes tick-go { 0% { opacity: 0 } 10% { opacity: 1 } 100% { opacity: 0 } }
</style>
