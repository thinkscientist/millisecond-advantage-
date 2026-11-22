<script setup lang="ts">
/** Slide 7 — Connect: events from systems become keyed, timestamped records. */
import { computed, ref, watch } from 'vue'
import FlowDiagram from './FlowDiagram.vue'
import WirePulse from './WirePulse.vue'
import { wirePath, type FlowNode, type FlowWire, type Pt } from './flow'
import { useTickFeed } from './TickFeed'
import { useBeats } from './useBeats'

const { b, at, live, clicks } = useBeats()

const ROWS = [168, 330, 492]
const SOURCES = [
  { label: 'Order system', sub: 'fills, amendments' },
  { label: 'Market data', sub: 'price ticks' },
  { label: 'Treasury', sub: 'FX rates' },
]
const CX = 520
const srcW: Pt[][] = ROWS.map(cy => [[300, cy], [410, cy], [410, 330], [CX, 330]])
const outW: Pt[] = [[CX + 300, 330], [1040, 330]]

const nodes: FlowNode[] = [
  ...SOURCES.map((s, i) => ({ id: `s${i}`, x: 0, y: ROWS[i] - 48, w: 300, h: 96, ...s, beat: 1 })),
  { id: 'connect', x: CX, y: 250, w: 300, h: 160, label: 'Connect', sub: 'capture · key · stamp', beat: 2, tone: 'strong' },
]
const wires: FlowWire[] = [
  ...srcW.map((pts, i) => ({ id: `w${i}`, pts, beat: 2 })),
  { id: 'out', pts: outW, beat: 3, hotAt: 3 },
]

interface Rec { src: number, key: string, ts: string, type: string, body: string, schema: string }
const RECORDS: (Rec & { gap: number })[] = [
  { gap: 1600, src: 0, key: 'ACCT-2231 / XYZ', ts: '14:02:07.412', type: 'fill', body: '{ qty: +10000, px: 41.14 }', schema: 'fill.v4' },
  { gap: 1400, src: 1, key: 'XYZ', ts: '14:02:07.431', type: 'price', body: '{ bid: 41.13, ask: 41.15 }', schema: 'quote.v2' },
  { gap: 1500, src: 2, key: 'EUR/USD', ts: '14:02:07.502', type: 'fx', body: '{ rate: 1.0842 }', schema: 'fxrate.v1' },
  { gap: 1300, src: 1, key: 'ABC', ts: '14:02:07.588', type: 'price', body: '{ bid: 18.42, ask: 18.43 }', schema: 'quote.v2' },
  { gap: 1700, src: 0, key: 'ACCT-4410 / DEF', ts: '14:02:08.017', type: 'fill', body: '{ qty: -2500, px: 72.05 }', schema: 'fill.v4' },
]
const shown = ref<Rec>(RECORDS[0])
const pulses = ref<(InstanceType<typeof WirePulse> | null)[]>([])
const pOut = ref<InstanceType<typeof WirePulse>>()

const feedOn = computed(() => live.value && clicks.value >= 2)
watch(feedOn, v => v && (shown.value = RECORDS[0]))
useTickFeed(RECORDS, feedOn, async (r) => {
  if (!(await pulses.value[r.src]?.fire())) return
  if (!at(3)) return
  if (await pOut.value?.fire({ speed: 1400 })) shown.value = r
})
</script>

<template>
  <FlowDiagram :nodes="nodes" :wires="wires">
    <WirePulse v-for="(pts, i) in srcW" :key="i" :ref="(el: any) => (pulses[i] = el)" :d="wirePath(pts)" />
    <WirePulse ref="pOut" :d="wirePath(outW)" />
    <template #html>
      <div class="card" :class="b(3, 'rise')">
        <div class="card-head display"><span>RECORD</span><span class="accent">{{ shown.type }}</span></div>
        <dl class="display">
          <dt>key</dt><dd>{{ shown.key }}</dd>
          <dt>time</dt><dd>{{ shown.ts }}Z</dd>
          <dt>value</dt><dd>{{ shown.body }}</dd>
          <dt>schema</dt><dd>{{ shown.schema }}</dd>
        </dl>
      </div>
    </template>
  </FlowDiagram>
</template>

<style scoped>
.card {
  position: absolute;
  left: 1040px;
  top: 170px;
  width: 640px;
  padding: 28px 34px;
  border: 2px solid var(--accent);
  border-radius: var(--radius);
  background: rgba(255, 90, 78, 0.05);
}
.card-head {
  display: flex;
  justify-content: space-between;
  font-size: 20px;
  letter-spacing: 0.14em;
  color: var(--muted);
  margin-bottom: 20px;
}
dl {
  display: grid;
  grid-template-columns: 120px 1fr;
  row-gap: 14px;
  margin: 0;
  font-size: 26px;
}
dt { color: var(--muted); }
dd { margin: 0; white-space: nowrap; }
</style>
