<script setup lang="ts">
/**
 * Slide 7 — Connect: four systems, four formats, one shape out.
 *
 * Beat 0  sources tick in their own raw formats
 * Beat 1  Connect is wired in: raw records pulse in and Connect glows
 * Beat 2  each record leaves as a cream chip and lands as a row
 *         (KEY / VALUE / TIME / AGE), newest first, ages ticking
 * Beat 3  the shared shape is called out: every row has a key and a time
 * Beat 4  takeaway (PillarSlide)
 */
import { computed, reactive, ref, watch } from 'vue'
import Clock from './Clock.vue'
import FlowDiagram from './FlowDiagram.vue'
import WirePulse from './WirePulse.vue'
import { wirePath, type FlowNode, type FlowWire, type Pt } from './flow'
import { useTickFeed } from './TickFeed'
import { useBeats } from './useBeats'

const { b, at, live, isStatic, clicks } = useBeats()

// ── Coordinate map ─────────────────────────────────────────────────────
const SRC_W = 500
const SRC_H = 118
const SRC_Y = [20, 175, 330, 485]
const CX = 600
const CW = 250
const CY = 330
const TX = 1000 // records table
const SOURCES = [
  { name: 'Order system', fmt: 'FIX tags' },
  { name: 'Market data', fmt: 'pipe-delimited' },
  { name: 'Treasury', fmt: 'CSV file' },
  { name: 'Core ledger', fmt: 'fixed width / CDC' },
]
const srcW: Pt[][] = SRC_Y.map(y => [[SRC_W, y + SRC_H / 2], [550, y + SRC_H / 2], [550, CY], [CX, CY]])
const outW: Pt[] = [[CX + CW, CY], [TX, CY]]

const nodes: FlowNode[] = [
  { id: 'connect', x: CX, y: CY - 100, w: CW, h: 200, label: 'Connect', sub: 'capture · key · stamp', beat: 1, tone: 'strong' },
]
const wires: FlowWire[] = [
  ...srcW.map((pts, i) => ({ id: `w${i}`, pts, beat: 1 })),
  { id: 'out', pts: outW, beat: 2 },
]

// ── The record script: what each system emits, and what Connect makes of it
interface Rec { gap: number, src: number, raw: string, key: string, value: string, time: string }
const SCRIPT: Rec[] = [
  { gap: 1500, src: 0, raw: '35=8|1=2231|55=XYZ|38=2000|31=41.14', key: 'ACCT 2231', value: '+2,000 XYZ @ 41.14', time: '14:02:07.412' },
  { gap: 1100, src: 1, raw: 'Q|XYZ|41.13|41.15|140207431', key: 'XYZ', value: 'bid 41.13 / ask 41.15', time: '14:02:07.431' },
  { gap: 1300, src: 3, raw: '0002231USD000012400000', key: 'ACCT 2231', value: 'cash 12,400,000', time: '14:02:07.488' },
  { gap: 1200, src: 2, raw: 'EURUSD,1.0842,14:02:07.502', key: 'EUR/USD', value: 'rate 1.0842', time: '14:02:07.502' },
  { gap: 1400, src: 1, raw: 'Q|ABC|18.41|18.43|140207588', key: 'ABC', value: 'bid 18.41 / ask 18.43', time: '14:02:07.588' },
  { gap: 1300, src: 0, raw: '35=8|1=4410|55=DEF|38=-2500|31=72.05', key: 'ACCT 4410', value: '−2,500 DEF @ 72.05', time: '14:02:08.017' },
  { gap: 1500, src: 3, raw: '0004410USD000003150000', key: 'ACCT 4410', value: 'cash 3,150,000', time: '14:02:08.240' },
  { gap: 1200, src: 2, raw: 'GBPUSD,1.2671,14:02:08.311', key: 'GBP/USD', value: 'rate 1.2671', time: '14:02:08.311' },
]
const START_RAW = [
  '35=8|1=2231|55=ABC|38=500|31=18.40',
  'Q|XYZ|41.12|41.14|140206950',
  'EURUSD,1.0840,14:02:06.120',
  '0002231USD000012150000',
]

interface Row { k: number, key: string, value: string, time: string, born: number, frozen: number }
const raw = reactive<{ text: string, k: number }[]>(START_RAW.map(text => ({ text, k: 0 })))
const rows = ref<Row[]>([])
let rowKey = 0

function reset() {
  START_RAW.forEach((t, i) => { raw[i].text = t; raw[i].k = 0 })
  rows.value = []
}

/** Settled picture for print / reduced motion: the first five records landed. */
function prime() {
  reset()
  const ages = [300, 1700, 2900, 4100, 5600]
  SCRIPT.slice(0, 5).forEach((r, i) => {
    raw[r.src].text = r.raw
    if (clicks.value >= 2)
      rows.value.unshift({ k: rowKey++, key: r.key, value: r.value, time: r.time, born: 0, frozen: ages[4 - i] })
  })
  rows.value = rows.value.slice(0, 6)
}

// ── Motion ─────────────────────────────────────────────────────────────
const flow = ref<InstanceType<typeof FlowDiagram>>()
const pulses = ref<(InstanceType<typeof WirePulse> | null)[]>([])
const chipHost = ref<HTMLDivElement>()
const running = new Set<Animation>()

/** A cream chip that rides the out-wire from Connect to the table. */
function travel(r: Rec): Promise<boolean> {
  const host = chipHost.value
  if (!host || !live.value) return Promise.resolve(false)
  const chip = document.createElement('div')
  chip.className = 'cx-chip mono'
  chip.innerHTML = `<div>${r.key}</div><div>${r.time.slice(0, 8)}</div>`
  host.appendChild(chip)
  const a = chip.animate([
    { transform: `translate(${CX + CW - 10}px, ${CY - 30}px)`, opacity: 0 },
    { opacity: 1, offset: 0.12 },
    { opacity: 1, offset: 0.85 },
    { transform: `translate(${TX - 125}px, ${CY - 30}px)`, opacity: 0 },
  ], { duration: 520, easing: 'linear' })
  running.add(a)
  return a.finished.then(() => true, () => false).finally(() => { running.delete(a); chip.remove() })
}

const feedOn = computed(() => live.value)
watch(feedOn, (v) => {
  if (v) reset()
  else { running.forEach(a => a.cancel()); running.clear() }
})
useTickFeed(SCRIPT, feedOn, async (r) => {
  raw[r.src].text = r.raw
  raw[r.src].k++
  if (!at(1)) return
  if (!(await pulses.value[r.src]?.fire({ speed: 1300 }))) return
  flow.value?.flash('connect')
  if (!at(2)) return
  if (!(await travel(r))) return
  rows.value = [{ k: rowKey++, key: r.key, value: r.value, time: r.time, born: performance.now(), frozen: 0 }, ...rows.value].slice(0, 6)
})

// stepping back below beat 2 empties the table
watch(() => at(2), (v) => { if (!v && live.value) rows.value = [] })
watch([isStatic, clicks], () => { if (isStatic.value) prime() }, { immediate: true })
</script>

<template>
  <FlowDiagram ref="flow" :nodes="nodes" :wires="wires">
    <WirePulse v-for="(pts, i) in srcW" :key="i" :ref="(el: any) => (pulses[i] = el)" :d="wirePath(pts)" />
    <template #html>
      <!-- sources, each in its own format -->
      <div
        v-for="(s, i) in SOURCES" :key="s.name" class="src panel"
        :style="{ top: `${SRC_Y[i]}px` }"
      >
        <div class="src-head">
          <span class="src-name">{{ s.name }}</span>
          <span class="label">{{ s.fmt }}</span>
        </div>
        <div :key="raw[i].k" class="src-raw mono" :class="{ cool: raw[i].k > 0 }">{{ raw[i].text }}</div>
      </div>

      <div ref="chipHost" class="chips" />

      <!-- the uniform records -->
      <div class="tbl" :class="b(2, 'rise')">
        <div class="tbl-title label">topic / records · one shape for every source</div>
        <div class="tbl-head label">
          <span :class="{ mark: at(3) }">key</span><span>value</span><span :class="{ mark: at(3) }">time</span><span>age</span>
        </div>
        <TransitionGroup name="shove" tag="div" class="tbl-rows">
          <div v-for="(r, i) in rows" :key="r.k" class="tbl-row mono" :class="{ first: i === 0 }">
            <span :class="{ mark: at(3) }">{{ r.key }}</span>
            <span>{{ r.value }}</span>
            <span :class="{ mark: at(3) }">{{ r.time }}</span>
            <span class="age"><Clock mode="age" :since="r.born" :frozen="r.frozen" /></span>
          </div>
        </TransitionGroup>
      </div>

      <div class="callout" :class="b(3, 'rise')">
        <span class="hit mono">KEY + TIME</span>
        <span>on every record, from any system</span>
      </div>
    </template>
  </FlowDiagram>
</template>

<style scoped>
.src { position: absolute; left: 0; width: 500px; height: 118px; box-sizing: border-box; padding: 16px 20px; }
.src-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 14px; }
.src-name { font-size: 26px; font-weight: 700; }
.src-head .label { font-size: 15px; }
.src-raw { font-size: 19px; white-space: nowrap; overflow: hidden; color: rgba(var(--text-rgb), .85); }

.chips { position: absolute; inset: 0; pointer-events: none; }
.chips :deep(.cx-chip) {
  position: absolute; left: 0; top: 0; width: 120px; box-sizing: border-box;
  padding: 6px 8px; border-radius: var(--radius); background: var(--hit); color: var(--ink);
  font-size: 14px; line-height: 1.35; box-shadow: 0 0 18px rgba(var(--hit-rgb), .45);
}

.tbl { position: absolute; left: 1000px; top: 60px; width: 680px; box-sizing: border-box; padding: 18px 20px; background: var(--panel); border: 1px solid var(--panel-line); border-radius: var(--radius); }
.tbl-title { font-size: 15px; margin-bottom: 14px; }
.tbl-head, .tbl-row { display: grid; grid-template-columns: 130px 1fr 150px 70px; gap: 10px; white-space: nowrap; }
.tbl-head { font-size: 15px; padding-bottom: 8px; border-bottom: 1px solid var(--rule); }
.tbl-head span:last-child, .tbl-row span:last-child { text-align: right; }
.tbl-rows { position: relative; height: 264px; overflow: hidden; }
.tbl-row { font-size: 18px; height: 44px; line-height: 44px; border-bottom: 1px solid var(--rule); color: rgba(var(--text-rgb), .8); }
.tbl-row.first { color: var(--text); }
.age { color: var(--muted); }
.mark { color: var(--hit); transition: color 400ms var(--ease); }
.tbl-head .mark { color: var(--hit); }
.shove-move { transition: transform 360ms var(--ease); }
.shove-enter-active { transition: transform 360ms var(--ease), opacity 360ms var(--ease); }
.shove-enter-from { transform: translateY(-44px); opacity: 0; }
.shove-enter-active span { animation: ss-hit 900ms var(--ease-out); }
.shove-leave-active { display: none; }

.callout { position: absolute; left: 1000px; top: 470px; width: 680px; display: flex; gap: 16px; align-items: baseline; font-size: 24px; }
.callout .hit { font-size: 22px; padding: 4px 10px; border: 1px solid var(--hit); border-radius: var(--radius); white-space: nowrap; }
</style>
