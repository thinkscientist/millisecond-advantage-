<script setup lang="ts">
/** Slide 11 — Query: ask the table that is already current, instead of a copy. */
import FlowDiagram from './FlowDiagram.vue'
import PulseLoop from './PulseLoop.vue'
import { wirePath, type FlowNode, type FlowWire, type Pt } from './flow'
import { useBeats } from './useBeats'

const { b } = useBeats()

const nodes: FlowNode[] = [
  { id: 'agent', x: 0, y: 230, w: 300, h: 140, label: 'Risk agent', sub: 'needs an answer now', beat: 1, tone: 'strong' },
  { id: 'table', x: 760, y: 200, w: 460, h: 200, label: 'exposure_by_account', sub: 'streamhouse table · kept current by Process', beat: 2, tone: 'strong' },
  { id: 'wh', x: 760, y: 500, w: 460, h: 110, label: 'Warehouse copy', sub: 'loaded nightly · 14 h old', beat: 2, tone: 'ghost' },
]
const ask: Pt[] = [[300, 270], [760, 270]]
const answer: Pt[] = [[760, 330], [300, 330]]
const old: Pt[] = [[150, 370], [150, 555], [760, 555]]
const wires: FlowWire[] = [
  { id: 'ask', pts: ask, beat: 2 },
  { id: 'answer', pts: answer, beat: 3, hotAt: 3 },
  { id: 'old', pts: old, beat: 2, dashed: true },
]
</script>

<template>
  <FlowDiagram :nodes="nodes" :wires="wires">
    <PulseLoop :paths="[wirePath(ask)]" :from="2" :every="1600" />
    <PulseLoop :paths="[wirePath(answer)]" :from="3" :every="1600" :speed="1400" />
    <g :class="b(2, 'fade')">
      <path d="M440 535 l40 40 M480 535 l-40 40" stroke="var(--accent)" stroke-width="4" stroke-linecap="round" />
      <text style="font-size: 20px" class="svg-body" x="500" y="600">not needed</text>
    </g>
    <template #html>
      <div class="bubble" :class="b(1, 'rise')">“What is ACCT-2231's exposure, right now?”</div>
      <pre class="sql display" :class="b(2, 'rise')"><span class="muted">SELECT</span> exposure, as_of
<span class="muted">FROM</span>   exposure_by_account
<span class="muted">WHERE</span>  account = 'ACCT-2231';</pre>
      <div class="answer" :class="b(3, 'rise')">
        <span class="display big">$12,488,000.00</span>
        <span class="muted">as of 14:02:07.412 · answered in 38 ms</span>
      </div>
    </template>
  </FlowDiagram>
</template>

<style scoped>
.bubble {
  position: absolute; left: 0; top: 80px; width: 640px;
  font-size: 30px; line-height: 1.3;
}
.sql {
  position: absolute; left: 1250px; top: 200px; width: 430px; margin: 0; box-sizing: border-box;
  font-size: 20px; line-height: 1.6; padding: 22px 24px;
  border: 1px solid var(--rule); border-radius: var(--radius); background: var(--panel);
  white-space: pre;
}
.answer {
  position: absolute; left: 330px; top: 352px; width: 420px;
  display: flex; flex-direction: column; gap: 6px; font-size: 20px;
}
.big { font-size: 38px; color: var(--text); }
</style>
