<script setup lang="ts">
/**
 * Slide 9 — Process. Two input wires into a Process box that keeps a
 * client's exposure current, one record at a time. Results fan out to four
 * consumers (beat 3) and are written back as a topic (beat 4).
 */
import { reactive, ref, watch } from 'vue'
import FlowDiagram from './FlowDiagram.vue'
import LiveNumber from './LiveNumber.vue'
import WirePulse from './WirePulse.vue'
import { wirePath, type FlowNode, type FlowWire, type Pt } from './flow'
import {
  applyTick, EXPOSURE_TICKS, exposureOf, START_POSITIONS, START_PRICES,
  type Tick, useTickFeed, usd,
} from './TickFeed'
import { useBeats } from './useBeats'
import { computed } from 'vue'

const { b, at, live, isStatic, clicks } = useBeats()

// ── Coordinate map (diagram space 1680 x 660) ──────────────────────────
const PROC = { x: 520, y: 230, w: 340, h: 200 }
const BUS_X = 1060
const CONS_X = 1200
const CONS_Y = [200, 330, 460, 590]
const CONSUMERS = ['Desk dashboard', 'Risk agent', 'Client portal', 'Margin check']

const W_MKT: Pt[] = [[280, 200], [400, 200], [400, 290], [PROC.x, 290]]
const W_TRD: Pt[] = [[280, 460], [400, 460], [400, 370], [PROC.x, 370]]
const W_TOPIC: Pt[] = [[690, PROC.y], [690, 44], [960, 44]]
const W_CONS: Pt[][] = CONS_Y.map(cy => [[PROC.x + PROC.w, 330], [BUS_X, 330], [BUS_X, cy], [CONS_X, cy]])

const procHot = ref(false)

const nodes = computed<FlowNode[]>(() => [
  { id: 'mkt', x: 0, y: 150, w: 280, h: 100, label: 'Market data', sub: 'price ticks', beat: 1 },
  { id: 'trd', x: 0, y: 410, w: 280, h: 100, label: 'Trades', sub: 'fills', beat: 1 },
  { id: 'proc', ...PROC, label: 'Process', sub: 'Σ qty × price, per account', beat: 1, tone: procHot.value ? 'accent' : 'strong' },
  { id: 'topic', x: 960, y: 0, w: 320, h: 88, label: 'exposure', sub: 'topic · every change', beat: 4, tone: 'accent' },
  ...CONSUMERS.map((label, i) => ({
    id: `c${i}`, x: CONS_X, y: CONS_Y[i] - 50, w: 480, h: 100, label, sub: '\u00a0', beat: 3, align: 'left' as const,
  })),
])

const wires: FlowWire[] = [
  { id: 'mkt', pts: W_MKT, beat: 1 },
  { id: 'trd', pts: W_TRD, beat: 1 },
  { id: 'topic', pts: W_TOPIC, beat: 4, hotAt: 4 },
  ...W_CONS.map((pts, i) => ({ id: `c${i}`, pts, beat: 3 })),
]

// ── Live state ──────────────────────────────────────────────────────────
const prices = reactive<Record<string, number>>({ ...START_PRICES })
const positions = reactive<Record<string, number>>({ ...START_POSITIONS })
const exposure = ref(exposureOf(prices, positions))
const received = ref<string[]>(CONSUMERS.map(() => usd(exposure.value)))
const lastIn = reactive({ mkt: 'XYZ 41.12 · ABC 18.40', trd: 'waiting…' })

function reset() {
  Object.assign(prices, START_PRICES)
  Object.assign(positions, START_POSITIONS)
  exposure.value = exposureOf(prices, positions)
  received.value = CONSUMERS.map(() => usd(exposure.value))
  lastIn.mkt = 'XYZ 41.12 · ABC 18.40'
  lastIn.trd = 'waiting…'
}

const pMkt = ref<InstanceType<typeof WirePulse>>()
const pTrd = ref<InstanceType<typeof WirePulse>>()
const pTopic = ref<InstanceType<typeof WirePulse>>()
const pCons = ref<(InstanceType<typeof WirePulse> | null)[]>([])

const signed = (n: number, f: (x: number) => string) => `${n > 0 ? '+' : '−'}${f(Math.abs(n))}`

async function onTick(t: Tick) {
  const isPrice = t.cents !== undefined
  if (isPrice) {
    const next = (prices[t.sym] * 100 + t.cents!) / 100
    lastIn.mkt = `${t.sym} ${next.toFixed(2)} (${signed(t.cents!, x => (x / 100).toFixed(2))})`
  }
  else {
    lastIn.trd = `${t.sym} ${signed(t.qty!, x => x.toLocaleString('en-US'))}`
  }
  const landed = await (isPrice ? pMkt : pTrd).value?.fire()
  if (!landed) return

  applyTick(t, prices, positions)
  exposure.value = exposureOf(prices, positions)
  procHot.value = true
  setTimeout(() => (procHot.value = false), 260)

  const value = usd(exposure.value)
  if (at(3)) {
    pCons.value.forEach((p, i) => p?.fire().then((ok) => {
      if (ok) received.value[i] = value
    }))
  }
  if (at(4)) pTopic.value?.fire()
}

const feedOn = computed(() => live.value && clicks.value >= 1)
watch(feedOn, v => v && reset())
useTickFeed(EXPOSURE_TICKS, feedOn, onTick)

// Consumers come online at beat 3 with the current value.
watch(() => at(3), (v) => { if (v) received.value = CONSUMERS.map(() => usd(exposure.value)) })
</script>

<template>
  <FlowDiagram :nodes="nodes" :wires="wires">
    <WirePulse ref="pMkt" :d="wirePath(W_MKT)" />
    <WirePulse ref="pTrd" :d="wirePath(W_TRD)" />
    <WirePulse ref="pTopic" :d="wirePath(W_TOPIC)" />
    <WirePulse
      v-for="(pts, i) in W_CONS" :key="i"
      :ref="(el: any) => (pCons[i] = el)"
      :d="wirePath(pts)" :speed="1400"
    />
    <template #html>
      <!-- last record seen on each input -->
      <div class="rec display" :class="b(1, 'fade')" style="left: 0; top: 262px">{{ lastIn.mkt }}</div>
      <div class="rec display" :class="b(1, 'fade')" style="left: 0; top: 522px">{{ lastIn.trd }}</div>

      <!-- running value under the Process box -->
      <div class="value" :class="b(2, 'rise')">
        <div class="value-label display">EXPOSURE · ACCT-2231</div>
        <LiveNumber :value="usd(exposure, 2)" :size="58" :still="isStatic" />
      </div>

      <!-- what each consumer last received -->
      <div
        v-for="(cy, i) in CONS_Y" :key="i"
        class="recv" :class="b(3, 'fade')"
        :style="{ top: `${cy + 6}px` }"
      >
        <LiveNumber :value="received[i]" :size="24" :still="isStatic" />
      </div>
    </template>
  </FlowDiagram>
</template>

<style scoped>
.rec {
  position: absolute;
  width: 360px;
  font-size: 20px;
  color: var(--muted);
  white-space: nowrap;
}
.value {
  position: absolute;
  left: 470px;
  top: 468px;
  width: 440px;
  text-align: center;
}
.value-label {
  font-size: 18px;
  letter-spacing: 0.12em;
  color: var(--muted);
  margin-bottom: 14px;
}
.recv {
  position: absolute;
  left: 1228px;
  color: var(--muted);
}
</style>
