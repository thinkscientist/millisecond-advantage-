<script setup lang="ts">
/**
 * Slide 10 — Govern.
 *
 * Beat 0  records reach the topic as bytes: the log stores whatever it is handed
 * Beat 1  a schema contract applies: the same bytes decode into typed fields
 * Beat 2  a rule catches a fat-finger quantity; that record is struck and
 *         routed to a dead-letter topic instead of the number
 * Beat 3  lineage: the number traces back, step by step, to its source
 * Beat 4  access: one reader holds the key and sees the account, another sees a token
 * Beat 5  takeaway (PillarSlide)
 */
import { computed, ref, watch } from 'vue'
import Flap from './Flap.vue'
import FlowDiagram from './FlowDiagram.vue'
import GovernScramble from './GovernScramble.vue'
import WirePulse from './WirePulse.vue'
import { wirePath, type FlowNode, type FlowWire, type Pt } from './flow'
import { useTickFeed } from './TickFeed'
import { useBeats } from './useBeats'

const { b, at, live, isStatic, clicks } = useBeats()

// ── Records ────────────────────────────────────────────────────────────
interface Rec { gap: number, acct: string, sym: string, qty: number, time: string, bad?: boolean }
const SCRIPT: Rec[] = [
  { gap: 1700, acct: '2231', sym: 'XYZ', qty: 252_000, time: '14:02:09.3' },
  { gap: 1600, acct: '4410', sym: 'DEF', qty: 37_500, time: '14:02:10.1' },
  { gap: 1700, acct: '2231', sym: 'ABC', qty: 130_000, time: '14:02:11.6' },
  { gap: 1500, acct: '2231', sym: 'XYZ', qty: 2_520_000, time: '14:02:12.2', bad: true },
  { gap: 1700, acct: '7782', sym: 'ABC', qty: 305_000, time: '14:02:13.0' },
  { gap: 1600, acct: '2231', sym: 'XYZ', qty: 250_000, time: '14:02:14.4' },
]
const hex = (s: string) => [...s].map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ')
const wire = (r: Rec) => `${r.acct}|${r.sym}|${r.qty}|${r.time}`
const fmt = (n: number) => n.toLocaleString('en-US')
const TOKENS: Record<string, string> = { 2231: 'k7Qm·x2', 4410: 'Rp0v·d9', 7782: 'Wz3a·f1' }

interface Row { k: number, r: Rec, struck: boolean }
const rows = ref<Row[]>([])
const dead = ref<Rec | null>(null)
const deadK = ref(0)
let rowKey = 0

/** the text a row shows: bytes until a contract applies, then typed fields */
function rowText(r: Rec) {
  if (!at(1)) return hex(wire(r)).slice(0, 62)
  return `ACCT ${r.acct}  ${r.sym.padEnd(4)} ${fmt(r.qty).padStart(9)}  ${r.time}`
}

function push(r: Rec) {
  const struck = !!r.bad && at(2)
  rows.value = [{ k: rowKey++, r, struck }, ...rows.value].slice(0, 4)
}

function reset() {
  rows.value = []
  dead.value = null
}

function prime() {
  reset()
  SCRIPT.slice(0, 4).forEach(push)
  if (at(2)) dead.value = SCRIPT[3]
}

// ── Lineage chain (beat 3) ─────────────────────────────────────────────
const LY = 380 // lineage row top
const LH = 104
const LIN = [
  { id: 'src', x: 0, w: 360, label: 'Book of record', sub: 'source · CDC at 14:02:14.4' },
  { id: 'topic', x: 440, w: 360, label: 'Positions topic', sub: 'schema v2 · rules passed' },
  { id: 'job', x: 880, w: 360, label: 'Exposure job', sub: 'statement version 12' },
  { id: 'num', x: 1320, w: 360, label: '', sub: '' },
]
const nodes: FlowNode[] = LIN.slice(0, 3).map(n => ({ id: n.id, x: n.x, y: LY, w: n.w, h: LH, label: n.label, sub: n.sub, beat: 3, align: 'left' as const }))
const linW: Pt[][] = [0, 1, 2].map(i => [[LIN[i].x + LIN[i].w, LY + LH / 2], [LIN[i + 1].x, LY + LH / 2]])
const wires: FlowWire[] = linW.map((pts, i) => ({ id: `l${i}`, pts, beat: 3, hotAt: 3 }))
// trace runs backwards: from the number to its source
const tracePaths = linW.slice().reverse().map(p => wirePath([...p].reverse()))
const traceIds = ['job', 'topic', 'src']

// ── Motion ─────────────────────────────────────────────────────────────
const flow = ref<InstanceType<typeof FlowDiagram>>()
const traces = ref<(InstanceType<typeof WirePulse> | null)[]>([])
const pDead = ref<InstanceType<typeof WirePulse>>()
const DEAD_PATH: Pt[] = [[1000, 150], [1040, 150], [1040, 262], [1080, 262]]

const feedOn = computed(() => live.value)
watch(feedOn, v => v && reset())
useTickFeed(SCRIPT, feedOn, async (r) => {
  if (r.bad && !at(2)) return // the rule isn't on yet: don't show the broken record pre-contract
  push(r)
  if (r.bad && at(2)) {
    await new Promise(res => setTimeout(res, 500))
    if (!live.value) return
    if (await pDead.value?.fire({ speed: 900 })) { dead.value = r; deadK.value++ }
  }
})

let traceTimer: ReturnType<typeof setInterval> | undefined
async function trace() {
  for (let k = 0; k < 3; k++) {
    if (!live.value || !at(3)) return
    if (!(await traces.value[k]?.fire({ speed: 1100 }))) return
    flow.value?.flash(traceIds[k])
  }
}
watch(() => live.value && at(3), (v) => {
  clearInterval(traceTimer)
  if (v) { setTimeout(trace, 500); traceTimer = setInterval(trace, 3200) }
}, { immediate: true })

watch([isStatic, clicks], () => { if (isStatic.value) prime() }, { immediate: true })
</script>

<template>
  <FlowDiagram ref="flow" :nodes="nodes" :wires="wires">
    <path :d="wirePath(DEAD_PATH)" class="wire hot" :class="b(2, 'fade')" />
    <WirePulse ref="pDead" :d="wirePath(DEAD_PATH)" color="var(--accent)" />
    <WirePulse v-for="(d, k) in tracePaths" :key="k" :ref="(el: any) => (traces[k] = el)" :d="d" />
    <template #html>
      <!-- the topic, as it sees records -->
      <div class="recs panel">
        <div class="recs-head label">
          <span>topic / positions</span>
          <span :class="at(1) ? 'hit' : 'muted'">{{ at(1) ? 'schema v2 · typed' : 'bytes · no schema' }}</span>
        </div>
        <TransitionGroup name="shove" tag="div" class="recs-rows">
          <div v-for="row in rows" :key="row.k" class="recs-row mono" :class="{ struck: row.struck, bytes: !at(1) }">
            <GovernScramble :text="rowText(row.r)" />
          </div>
        </TransitionGroup>
      </div>

      <!-- the contract -->
      <div class="contract panel" :class="b(1, 'rise')">
        <div class="label c-head">contract · schema v2</div>
        <div class="field mono"><span>account</span><span class="muted">string · encrypted</span></div>
        <div class="field mono"><span>symbol</span><span class="muted">string</span></div>
        <div class="field mono"><span>qty</span><span class="muted">long</span></div>
        <div class="field mono"><span>event_time</span><span class="muted">timestamp</span></div>
        <div class="field mono rule" :class="b(2, 'fade')"><span>rule</span><span class="accent">qty &lt; 1,000,000</span></div>
      </div>

      <!-- dead letters -->
      <div class="dead panel" :class="b(2, 'rise')">
        <div class="label d-head"><span class="accent">topic / dead letters</span><span>rejected at write</span></div>
        <div v-if="dead" :key="deadK" class="d-row mono" :class="{ cool: deadK > 0 }">
          ACCT {{ dead.acct }} · {{ dead.sym }} {{ fmt(dead.qty) }} · {{ dead.time }}
        </div>
        <div v-else class="d-row mono muted">—</div>
      </div>

      <!-- lineage caption + the number -->
      <div class="lin-q label" :class="b(3, 'fade')">“How did you get this number?” — traced back, step by step</div>
      <div class="num panel" :class="b(3, 'rise')" :style="{ left: `${LIN[3].x}px`, top: `${LY}px`, width: `${LIN[3].w}px`, height: `${LH}px` }">
        <div class="label">acct 2231 exposure</div>
        <Flap :value="'12,488,000'" :size="38" />
      </div>

      <!-- what each reader sees -->
      <div class="sees" :class="b(4, 'rise')">
        <div class="label s-head">what each reader sees of the same record</div>
        <div class="seer panel">
          <div><span class="s-name">Risk officer</span> <span class="label">holds the key</span></div>
          <div class="mono s-val">ACCT 2231 · XYZ 250,000</div>
        </div>
        <div class="seer panel">
          <div><span class="s-name">Agent</span> <span class="label">no key</span></div>
          <div class="mono s-val"><span class="hit">{{ TOKENS['2231'] }}</span> · XYZ 250,000</div>
        </div>
      </div>
    </template>
  </FlowDiagram>
</template>

<style scoped>
.recs { position: absolute; left: 0; top: 0; width: 1000px; height: 300px; box-sizing: border-box; padding: 16px 20px; }
.recs-head { display: flex; justify-content: space-between; font-size: 15px; margin-bottom: 12px; }
.recs-rows { position: relative; height: 232px; overflow: hidden; }
.recs-row { height: 58px; line-height: 58px; font-size: 22px; border-bottom: 1px solid rgba(255, 255, 255, .06); white-space: nowrap; overflow: hidden; transition: color 300ms; }
.recs-row.bytes { font-size: 17px; color: var(--muted); }
.recs-row.struck { color: var(--accent); text-decoration: line-through; text-decoration-thickness: 2px; }
.shove-move { transition: transform 360ms var(--ease); }
.shove-enter-active { transition: transform 360ms var(--ease), opacity 360ms var(--ease); }
.shove-enter-from { transform: translateY(-58px); opacity: 0; }
.shove-enter-active:not(.struck) { animation: ss-hit 900ms var(--ease-out); }
.shove-leave-active { display: none; }

.contract { position: absolute; left: 1080px; top: 0; width: 600px; height: 214px; box-sizing: border-box; padding: 14px 20px; }
.c-head { font-size: 15px; margin-bottom: 8px; color: var(--hit); }
.field { display: flex; justify-content: space-between; font-size: 18px; line-height: 31px; }

.dead { position: absolute; left: 1080px; top: 230px; width: 600px; height: 70px; box-sizing: border-box; padding: 10px 20px; border-color: rgba(255, 90, 78, .55); }
.d-head { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 4px; }
.d-row { font-size: 18px; white-space: nowrap; }
.d-row.cool { animation: d-hit 900ms var(--ease-out); }
@keyframes d-hit { 0%, 58% { color: var(--accent); } }

.lin-q { position: absolute; left: 0; top: 340px; font-size: 15px; }
.num { position: absolute; box-sizing: border-box; padding: 14px 20px; border-color: var(--hit); display: flex; flex-direction: column; justify-content: center; gap: 8px; }
.num .label { font-size: 14px; }

.sees { position: absolute; left: 0; top: 508px; width: 1680px; display: grid; grid-template-columns: 1fr 1fr; column-gap: 20px; }
.s-head { grid-column: 1 / -1; font-size: 15px; margin-bottom: 10px; }
.seer { padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; height: 68px; box-sizing: border-box; }
.s-name { font-size: 22px; font-weight: 700; }
.seer .label { font-size: 13px; margin-left: 8px; }
.s-val { font-size: 22px; }
</style>
