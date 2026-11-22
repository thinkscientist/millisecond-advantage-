<script setup lang="ts">
/**
 * Slide 14 — the world before: every reader built its own path, and each
 * path ends at a different number for the same client.
 *
 * Beat 1  the sources
 * Beat 2  the copies and hops draw in; "pipelines you own" counts them;
 *         records crawl along the dashed hops
 * Beat 3  every hop shows its lag; three readers show three numbers
 * Beat 4  takeaway (PillarSlide)
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import Flap from './Flap.vue'
import FlowDiagram from './FlowDiagram.vue'
import WirePulse from './WirePulse.vue'
import { wirePath, type FlowNode, type FlowWire, type Pt } from './flow'
import { useBeats } from './useBeats'

const { b, at, live, isStatic, clicks, epoch } = useBeats()

const C = [0, 280, 560, 840] // column x
const NW = [200, 220, 220, 220]
const RX = 1200 // readers
const box = (id: string, col: number, cy: number, label: string, beat: number, tone?: FlowNode['tone']): FlowNode =>
  ({ id, x: C[col], y: cy - 40, w: NW[col], h: 80, label, beat, tone })

const nodes: FlowNode[] = [
  box('oms', 0, 110, 'Orders', 1), box('mkt', 0, 330, 'Prices', 1), box('fx', 0, 550, 'FX', 1),
  box('etl', 1, 110, 'Nightly ETL', 2, 'ghost'), box('cdc', 1, 330, 'CDC job', 2, 'ghost'), box('drop', 1, 550, 'File drop', 2, 'ghost'),
  box('wh', 2, 220, 'Warehouse', 2), box('mart', 2, 440, 'Risk mart', 2),
  box('ext', 3, 110, 'Extract', 2, 'ghost'), box('cache', 3, 330, 'Cache', 2, 'ghost'), box('lake', 3, 550, 'Lake ETL', 2, 'ghost'),
]
const right = (col: number) => C[col] + NW[col]
const hop = (c1: number, y1: number, x2: number, y2: number): Pt[] => {
  const mx = (right(c1) + x2) / 2
  return y1 === y2 ? [[right(c1), y1], [x2, y2]] : [[right(c1), y1], [mx, y1], [mx, y2], [x2, y2]]
}
const HOPS: Pt[][] = [
  hop(0, 110, C[1], 110), hop(0, 330, C[1], 330), hop(0, 550, C[1], 550),
  hop(1, 110, C[2], 205), hop(1, 330, C[2], 235), hop(1, 345, C[2], 425), hop(1, 550, C[2], 455),
  hop(2, 205, C[3], 110), hop(2, 440, C[3], 330), hop(2, 235, C[3], 550),
  hop(3, 110, RX, 110), hop(3, 330, RX, 330), hop(3, 550, RX, 550),
]
const wires: FlowWire[] = HOPS.map((pts, i) => ({ id: `h${i}`, pts, beat: 2, dashed: true }))

// Each reader's path through the hops, for the crawling records.
const PATHS = [[0, 3, 7, 10], [1, 5, 8, 11], [2, 6, 4, 9, 12]]

const STALE = [
  { x: C[1], y: 110, t: 'nightly' }, { x: C[1], y: 330, t: '+5 min' }, { x: C[1], y: 550, t: '+1 h' },
  { x: C[2], y: 220, t: '+12 h' }, { x: C[2], y: 440, t: '+1 h' },
  { x: C[3], y: 110, t: '+1 h' }, { x: C[3], y: 330, t: '+15 min' }, { x: C[3], y: 550, t: 'nightly' },
]
const READERS = [
  { name: 'Trading desk', path: 'a service someone wrote', val: '12,341,800', at: 'today 12:33' },
  { name: 'Risk officer', path: 'a database, fed overnight', val: '11,902,000', at: 'yesterday 19:00' },
  { name: 'Lakehouse', path: 'its own ETL', val: '11,410,500', at: 'yesterday 17:30' },
]

// "Pipelines you own" counts up as the hops draw in.
const owned = ref(0)
let countT: ReturnType<typeof setInterval> | undefined
watch([() => at(2), live, epoch], ([on]) => {
  clearInterval(countT)
  if (!on) { owned.value = 0; return }
  if (!live.value || clicks.value !== 2) { owned.value = HOPS.length; return }
  owned.value = 0
  countT = setInterval(() => {
    owned.value++
    if (owned.value >= HOPS.length) clearInterval(countT)
  }, 70)
}, { immediate: true })
watch(isStatic, (s) => { if (s) owned.value = at(2) ? HOPS.length : 0 }, { immediate: true })

// Records crawl slowly along each reader's path, hop by hop.
const pulses = ref<(InstanceType<typeof WirePulse> | null)[]>([])
let crawlT: ReturnType<typeof setInterval> | undefined
let k = 0
async function crawl(p: number[]) {
  for (const h of p) {
    if (!(await pulses.value[h]?.fire({ speed: 260 }))) return
  }
}
const crawling = computed(() => live.value && at(2))
watch(crawling, (v) => {
  clearInterval(crawlT)
  if (v) { k = 0; crawl(PATHS[k++ % 3]); crawlT = setInterval(() => crawl(PATHS[k++ % 3]), 2200) }
}, { immediate: true })
onBeforeUnmount(() => { clearInterval(crawlT); clearInterval(countT) })

const shown = computed(() => READERS.map(r => (at(3) ? r.val : '—'.padStart(r.val.length, ' '))))
</script>

<template>
  <FlowDiagram :nodes="nodes" :wires="wires">
    <WirePulse
      v-for="(pts, i) in HOPS" :key="i" :ref="(el: any) => (pulses[i] = el)"
      :d="wirePath(pts)" color="var(--muted)" :seg="40"
    />
    <template #html>
      <div
        v-for="(s, i) in STALE" :key="i" class="stale mono" :class="b(3, 'lift')"
        :style="{ left: `${s.x}px`, top: `${s.y - 70}px` }"
      >{{ s.t }}</div>

      <div class="whose label" :class="b(3, 'fade')">same client · whose number is right?</div>
      <div
        v-for="(r, i) in READERS" :key="r.name" class="reader panel" :class="b(2, 'lift')"
        :style="{ top: `${[110, 330, 550][i] - 72}px` }"
      >
        <div class="r-top"><span class="r-name">{{ r.name }}</span><span class="label r-path">{{ r.path }}</span></div>
        <div class="r-num">
          <Flap :value="shown[i]" :size="40"  />
          <span class="label r-at" :class="b(3, 'fade')">as of {{ r.at }}</span>
        </div>
      </div>

      <div class="owned" :class="b(2, 'fade')">
        <span class="label">pipelines you own</span>
        <span class="mono own-n">{{ owned }}</span>
      </div>
    </template>
  </FlowDiagram>
</template>

<style scoped>
.stale { position: absolute; font-size: 17px; color: var(--accent); white-space: nowrap; }
.reader { position: absolute; left: 1200px; width: 480px; height: 144px; box-sizing: border-box; padding: 14px 20px; border-left: 3px solid var(--text); }
.r-top { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
.r-name { font-size: 24px; font-weight: 700; white-space: nowrap; }
.r-path { font-size: 13px; white-space: nowrap; }
.r-num { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; margin-top: 12px; }
.r-at { font-size: 14px; color: var(--accent); white-space: nowrap; }
.whose { position: absolute; left: 1200px; top: -2px; font-size: 15px; color: var(--accent); white-space: nowrap; }
.owned { position: absolute; left: 0; top: 618px; display: flex; gap: 16px; align-items: baseline; }
.owned .label { font-size: 15px; }
.own-n { font-size: 30px; color: var(--hit); }
</style>
