<script setup lang="ts">
/** Slide 12 — Query (tables): the full table Process keeps current, read by many. */
import { computed, reactive, watch } from 'vue'
import FlowDiagram from './FlowDiagram.vue'
import LiveNumber from './LiveNumber.vue'
import PulseLoop from './PulseLoop.vue'
import { wirePath, type FlowNode, type FlowWire, type Pt } from './flow'
import { useTickFeed, usd } from './TickFeed'
import { useBeats } from './useBeats'

const { b, live, clicks, isStatic } = useBeats()

interface Row { acct: string, sym: string, qty: number, px: number }
const START: Row[] = [
  { acct: 'ACCT-2231', sym: 'XYZ', qty: 250_000, px: 41.12 },
  { acct: 'ACCT-2231', sym: 'ABC', qty: 120_000, px: 18.40 },
  { acct: 'ACCT-4410', sym: 'XYZ', qty: 80_000, px: 41.12 },
  { acct: 'ACCT-4410', sym: 'DEF', qty: 40_000, px: 72.05 },
  { acct: 'ACCT-7782', sym: 'ABC', qty: 300_000, px: 18.40 },
  { acct: 'ACCT-7782', sym: 'DEF', qty: 15_000, px: 72.05 },
]
const rows = reactive<Row[]>(START.map(r => ({ ...r })))
const reset = () => START.forEach((r, i) => Object.assign(rows[i], r))

// Price ticks hit every row holding the symbol; fills hit one row.
const SCRIPT = [
  { gap: 1400, sym: 'XYZ', cents: +2 },
  { gap: 1600, row: 4, qty: +5_000 },
  { gap: 1300, sym: 'DEF', cents: -4 },
  { gap: 1500, sym: 'ABC', cents: +1 },
  { gap: 1700, row: 1, qty: -20_000 },
  { gap: 1400, sym: 'XYZ', cents: -2 },
  { gap: 1500, sym: 'DEF', cents: +4 },
  { gap: 1300, sym: 'ABC', cents: -1 },
  { gap: 1600, row: 4, qty: -5_000 },
  { gap: 1500, row: 1, qty: +20_000 },
] as const

const feedOn = computed(() => live.value && clicks.value >= 2)
watch(feedOn, v => v && reset())
useTickFeed(SCRIPT, feedOn, (t) => {
  if ('row' in t) rows[t.row].qty += t.qty
  else rows.forEach((r) => { if (r.sym === t.sym) r.px = Math.round(r.px * 100 + t.cents) / 100 })
})

const total = computed(() => rows.reduce((s, r) => s + r.qty * r.px, 0))

const READ = [140, 330, 520]
const readers: FlowNode[] = [
  { id: 'sql', x: 1260, y: READ[0] - 55, w: 420, h: 110, label: 'Analyst SQL', sub: 'ad hoc, interactive', beat: 3 },
  { id: 'tool', x: 1260, y: READ[1] - 55, w: 420, h: 110, label: 'Agent tool call', sub: 'get_exposure(account)', beat: 3 },
  { id: 'bi', x: 1260, y: READ[2] - 55, w: 420, h: 110, label: 'BI dashboard', sub: 'refreshes on change', beat: 3 },
]
const W: Pt[][] = READ.map(cy => [[1060, 330], [1150, 330], [1150, cy], [1260, cy]])
const wires: FlowWire[] = W.map((pts, i) => ({ id: `r${i}`, pts, beat: 3 }))
const fmtQty = (n: number) => n.toLocaleString('en-US')
</script>

<template>
  <FlowDiagram :nodes="readers" :wires="wires">
    <PulseLoop :paths="W.map(p => wirePath(p))" :from="3" :every="600" />
    <template #html>
      <div class="table" :class="b(1, 'rise')">
        <div class="caption display">exposure_by_position <span class="muted">· maintained by Process</span></div>
        <table>
          <thead>
            <tr><th>account</th><th>symbol</th><th class="r">qty</th><th class="r">price</th><th class="r">exposure</th></tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in rows" :key="i">
              <td>{{ r.acct }}</td>
              <td>{{ r.sym }}</td>
              <td class="r"><LiveNumber :value="fmtQty(r.qty)" :size="24" :still="isStatic" /></td>
              <td class="r"><LiveNumber :value="r.px.toFixed(2)" :size="24" :still="isStatic" /></td>
              <td class="r"><LiveNumber :value="usd(r.qty * r.px)" :size="24" :still="isStatic" /></td>
            </tr>
          </tbody>
          <tfoot>
            <tr><td colspan="4">total</td><td class="r"><LiveNumber :value="usd(total)" :size="26" :still="isStatic" /></td></tr>
          </tfoot>
        </table>
      </div>
    </template>
  </FlowDiagram>
</template>

<style scoped>
.table {
  position: absolute; left: 0; top: 30px; width: 1060px;
  border: 1px solid var(--rule); border-radius: var(--radius); background: var(--panel);
  padding: 26px 30px; box-sizing: border-box;
}
.caption { font-size: 22px; margin-bottom: 16px; }
table { width: 100%; border-collapse: collapse; font-family: var(--font-display); font-size: 24px; }
th { font-family: var(--font-body); font-weight: 400; color: var(--muted); font-size: 20px; text-align: left; padding: 0 0 12px; border-bottom: 1px solid var(--rule); }
td { padding: 12px 0; border-bottom: 1px solid var(--rule); }
tfoot td { border-bottom: none; padding-top: 16px; color: var(--muted); }
.r { text-align: right; }
</style>
