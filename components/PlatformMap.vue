<script setup lang="ts">
/**
 * Slides 16–17 — map a left column (pillars, or the streamhouse) onto a
 * right column of products. Left appears at beat 1, right + wires at beat 2.
 */
import { computed } from 'vue'
import FlowDiagram from './FlowDiagram.vue'
import PulseLoop from './PulseLoop.vue'
import { wirePath, type FlowNode, type FlowWire, type Pt } from './flow'

const props = defineProps<{
  left: { label: string, sub?: string }[]
  right: { label: string, sub?: string }[]
  /** 'pairs': row i → row i. 'fan': single left node fans out to every row */
  mode?: 'pairs' | 'fan'
}>()

const H = 660
const LW = 340
const RX = 640
const rowsOf = (n: number, h: number) => Array.from({ length: n }, (_, i) => (H / n) * (i + 0.5))

const layout = computed(() => {
  const ry = rowsOf(props.right.length, H)
  const rh = Math.min(108, H / props.right.length - 22)
  const ly = props.mode === 'fan' ? [H / 2] : ry
  const lh = props.mode === 'fan' ? 220 : rh
  const nodes: FlowNode[] = [
    ...props.left.map((n, i) => ({ id: `l${i}`, x: 0, y: ly[i] - lh / 2, w: LW, h: lh, ...n, beat: 1, tone: 'strong' as const })),
    ...props.right.map((n, i) => ({ id: `r${i}`, x: RX, y: ry[i] - rh / 2, w: 1680 - RX, h: rh, ...n, beat: 2, align: 'left' as const })),
  ]
  const W: Pt[][] = props.right.map((_, i) => {
    const y0 = props.mode === 'fan' ? H / 2 : ry[i]
    return y0 === ry[i] ? [[LW, y0], [RX, ry[i]]] : [[LW, y0], [(LW + RX) / 2, y0], [(LW + RX) / 2, ry[i]], [RX, ry[i]]]
  })
  const wires: FlowWire[] = W.map((pts, i) => ({ id: `w${i}`, pts, beat: 2 }))
  return { nodes, wires, paths: W.map(p => wirePath(p)) }
})
</script>

<template>
  <FlowDiagram :nodes="layout.nodes" :wires="layout.wires">
    <PulseLoop :paths="layout.paths" :from="2" :every="450" />
  </FlowDiagram>
</template>
