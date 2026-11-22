<script setup lang="ts">
/**
 * Slide 12 — Query (tables): the whole table Process keeps, one row per account.
 *
 * Beat 1  the table appears, sorted by how much of its limit each account uses
 * Beat 2  updates upsert by account; rows re-sort as they cross each other
 * Beat 3  an agent asks a question about the whole book; the answer counts itself
 * Beat 4  takeaway (PillarSlide)
 */
import { computed, reactive, ref, watch } from 'vue'
import Clock from './Clock.vue'
import Flap from './Flap.vue'
import FlowDiagram from './FlowDiagram.vue'
import WirePulse from './WirePulse.vue'
import { wirePath, type FlowWire, type Pt } from './flow'
import { useTickFeed } from './TickFeed'
import { useBeats } from './useBeats'

const { b, at, live, isStatic, clicks } = useBeats()

interface Row { acct: string, exp: number, limit: number, hit: number }
const START: Row[] = [
  { acct: '1187', exp: 22_900_000, limit: 25_000_000, hit: 0 },
  { acct: '3316', exp: 9_450_000, limit: 11_000_000, hit: 0 },
  { acct: '2231', exp: 12_488_000, limit: 15_000_000, hit: 0 },
  { acct: '9034', exp: 15_700_000, limit: 20_000_000, hit: 0 },
  { acct: '4410', exp: 6_171_000, limit: 8_000_000, hit: 0 },
  { acct: '7782', exp: 6_600_000, limit: 9_000_000, hit: 0 },
  { acct: '5520', exp: 3_180_000, limit: 5_000_000, hit: 0 },
]
const rows = reactive<Row[]>(START.map(r => ({ ...r })))
const reset = () => START.forEach((r, i) => Object.assign(rows[i], r))

// Upserts by account. The loop nets to zero so the picture stays stable.
const SCRIPT = [
  { gap: 1500, acct: '9034', d: +600_000 },
  { gap: 1700, acct: '2231', d: -700_000 },
  { gap: 1400, acct: '4410', d: +300_000 },
  { gap: 1600, acct: '1187', d: -1_200_000 },
  { gap: 1500, acct: '7782', d: +900_000 },
  { gap: 1700, acct: '9034', d: -600_000 },
  { gap: 1400, acct: '2231', d: +700_000 },
  { gap: 1600, acct: '4410', d: -300_000 },
  { gap: 1500, acct: '1187', d: +1_200_000 },
  { gap: 1600, acct: '7782', d: -900_000 },
]
const used = (r: Row) => r.exp / r.limit
const sorted = computed(() => [...rows].sort((a, z) => used(z) - used(a)))
const over = computed(() => rows.filter(r => used(r) > 0.8))
const updates = ref(0)
const lastUpdate = ref(performance.now())

const pIn = ref<InstanceType<typeof WirePulse>>()
const pOut = ref<InstanceType<typeof WirePulse>>()
const flow = ref<InstanceType<typeof FlowDiagram>>()

const feedOn = computed(() => live.value && clicks.value >= 2)
watch(feedOn, (v) => { if (v) { reset(); updates.value = 0 } })
useTickFeed(SCRIPT, feedOn, async (t) => {
  if (!(await pIn.value?.fire({ speed: 1500 }))) return
  const r = rows.find(x => x.acct === t.acct)!
  r.exp += t.d
  r.hit++
  updates.value++
  lastUpdate.value = performance.now()
  if (at(3) && await pOut.value?.fire({ speed: 1500 })) flow.value?.flash('agent', 0.8)
})

watch([isStatic, clicks], () => { if (isStatic.value) reset() }, { immediate: true })

// An update sweeps along the table's top edge as it upserts.
const W_IN: Pt[] = [[10, 1], [1050, 1]]
const W_OUT: Pt[] = [[1060, 260], [1160, 260]]
const wires: FlowWire[] = [{ id: 'out', pts: W_OUT, beat: 3 }]

const fmt = (n: number) => Math.round(n).toLocaleString('en-US')
const pct = (r: Row) => `${(used(r) * 100).toFixed(1)}%`
const mil = (n: number) => `${(n / 1e6).toFixed(1)}M`
</script>

<template>
  <FlowDiagram
    ref="flow"
    :nodes="[{ id: 'agent', x: 1160, y: 0, w: 520, h: 520, label: '', beat: 3, tone: 'strong' }]"
    :wires="wires"
  >
    <WirePulse ref="pIn" :d="wirePath(W_IN)" />
    <WirePulse ref="pOut" :d="wirePath(W_OUT)" />
    <template #html>
      <div class="table panel" :class="b(1, 'rise')">
        <div class="head">
          <div>
            <div class="mono title">book_exposure</div>
            <div class="label sub">one row per account · upsert by account</div>
          </div>
          <div class="label right">
            <div>{{ updates }} updates</div>
            <div>last <Clock mode="age" :since="lastUpdate" :frozen="1200" :running="at(2)" /> ago</div>
          </div>
        </div>
        <div class="grid label hdr"><span>account</span><span>exposure</span><span>limit</span><span>used</span></div>
        <TransitionGroup name="resort" tag="div" class="rows">
          <div v-for="r in sorted" :key="r.acct" class="grid row mono" :class="{ over: used(r) > 0.8 }">
            <span>{{ r.acct }}</span>
            <span :key="r.hit" :class="{ cool: r.hit > 0 }">{{ fmt(r.exp) }}</span>
            <span class="muted">{{ mil(r.limit) }}</span>
            <span class="used">
              <span class="bar"><span class="fill" :style="{ width: `${Math.min(100, used(r) * 100)}%` }" /></span>
              <span :key="`p${r.hit}`" :class="{ cool: r.hit > 0 }">{{ pct(r) }}</span>
            </span>
          </div>
        </TransitionGroup>
        <div class="label more">+ 3,993 more rows, one per account</div>
      </div>

      <div class="agent" :class="b(3, 'rise')">
        <div class="ag-head"><span class="ag-name">Agent</span><span class="label">asks about the whole book</span></div>
        <pre class="sql mono"><span class="kw">SELECT</span> account, exposure, used
<span class="kw">FROM</span>   book_exposure
<span class="kw">WHERE</span>  used &gt; 0.80
<span class="kw">ORDER BY</span> used <span class="kw">DESC</span>;</pre>
        <div class="result">
          <Flap :value="String(over.length)" :size="88" tone="hit" />
          <div>
            <div class="res-t">accounts above 80% of their limit</div>
            <div class="label">{{ over.map(r => r.acct).join(' · ') }}</div>
          </div>
        </div>
        <div class="label ag-foot">answered in under a second · from the same rows</div>
      </div>
    </template>
  </FlowDiagram>
</template>

<style scoped>
.table { position: absolute; left: 0; top: 0; width: 1060px; box-sizing: border-box; padding: 22px 26px; }
.head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; }
.title { font-size: 26px; }
.sub { font-size: 15px; margin-top: 4px; }
.right { text-align: right; font-size: 15px; line-height: 1.5; }
.grid { display: grid; grid-template-columns: 160px 260px 160px 1fr; align-items: center; gap: 12px; }
.grid span:nth-child(2), .grid span:nth-child(3) { text-align: right; }
.hdr { font-size: 15px; padding-bottom: 8px; border-bottom: 1px solid var(--rule); }
.rows { position: relative; }
.row { height: 52px; font-size: 22px; border-bottom: 1px solid var(--rule); }
.row.over span:first-child { color: var(--hit); }
.used { display: flex; align-items: center; gap: 14px; justify-content: flex-end; }
.bar { flex: 1; height: 8px; background: rgba(198, 198, 198, .16); border-radius: 4px; overflow: hidden; }
.fill { display: block; height: 100%; background: var(--muted); transition: width 600ms var(--ease); }
.over .fill { background: var(--hit); }
.used > span:last-child { width: 90px; text-align: right; }
.resort-move { transition: transform 520ms var(--ease); }
.more { font-size: 14px; margin-top: 12px; }

.agent { position: absolute; left: 1160px; top: 0; width: 520px; height: 520px; box-sizing: border-box; padding: 24px 26px; }
.ag-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px; }
.ag-name { font-size: 28px; font-weight: 700; }
.ag-head .label { font-size: 14px; }
.sql { margin: 0; font-size: 18px; line-height: 1.55; padding: 14px 16px; border-radius: var(--radius); background: var(--bg); border: 1px solid var(--panel-line); white-space: pre; }
.kw { color: var(--hit); }
.result { display: flex; gap: 22px; align-items: center; margin-top: 28px; }
.res-t { font-size: 24px; font-weight: 600; line-height: 1.25; margin-bottom: 8px; }
.result .label { font-size: 16px; }
.ag-foot { position: absolute; left: 26px; bottom: 22px; font-size: 14px; }
</style>
