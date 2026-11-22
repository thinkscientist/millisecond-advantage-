<script setup lang="ts">
/**
 * Slide 15 — streamhouse for now and next, lakehouse for history; same data.
 *
 * Beat 1  records ride the live stream; agents act on them as they pass
 * Beat 2  the lakehouse: an open table and the readers who look back
 * Beat 3  the bridge: every record also lands as a row in the open table;
 *         history flows back for replay and backfill
 * Beat 4  takeaway (PillarSlide)
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import FlowDiagram from './FlowDiagram.vue'
import WirePulse from './WirePulse.vue'
import { wirePath, type FlowNode, type FlowWire, type Pt } from './flow'
import { useBeats } from './useBeats'

const { b, at, live, isStatic, clicks, epoch } = useBeats()

const PW = 760
const RX = 920
const nodes: FlowNode[] = [
  { id: 'apps', x: 200, y: 430, w: 360, h: 110, label: 'Agents & apps', sub: 'act in milliseconds', beat: 1 },
  { id: 'bi', x: RX + 200, y: 470, w: 360, h: 100, label: 'BI · ML · reports', sub: 'look back over years', beat: 2 },
]
const TO_APPS: Pt[] = [[380, 266], [380, 430]]
const TO_BI: Pt[] = [[RX + 380, 410], [RX + 380, 470]]
const MAT: Pt[] = [[730, 190], [RX + 30, 190]]
const HIST: Pt[] = [[RX + 30, 236], [730, 236]]
const wires: FlowWire[] = [
  { id: 'apps', pts: TO_APPS, beat: 1 },
  { id: 'bi', pts: TO_BI, beat: 2 },
  { id: 'mat', pts: MAT, beat: 3, hotAt: 3 },
  { id: 'hist', pts: HIST, beat: 3, dashed: true },
]

const RECS = [
  '2231 XYZ +10,000', '4410 DEF −2,500', 'XYZ 41.15', '7782 ABC +5,000',
  'ABC 18.43', '2231 ABC −20,000', 'DEF 72.01', '9034 XYZ +3,000',
]
interface Row { k: number, rec: string, t: string }
const rows = ref<Row[]>([])
const acted = ref(0)
const snapshot = ref(1204)
let rk = 0
let n = 0

const flow = ref<InstanceType<typeof FlowDiagram>>()
const lane = ref<HTMLElement>()
const pApps = ref<InstanceType<typeof WirePulse>>()
const pBi = ref<InstanceType<typeof WirePulse>>()
const running = new Set<Animation>()

function clearLane() {
  running.forEach(a => a.cancel())
  running.clear()
  lane.value?.querySelectorAll('.chip').forEach(e => e.remove())
}
watch(epoch, clearLane)
onBeforeUnmount(clearLane)

const stamp = (i: number) => `14:02:${String(7 + Math.floor(i * 1.3) % 50).padStart(2, '0')}.${(i * 37) % 10}`

function spawn() {
  if (!lane.value || !live.value) return
  const i = n++
  const text = RECS[i % RECS.length]
  const el = document.createElement('div')
  el.className = 'chip mono'
  el.textContent = text
  lane.value.appendChild(el)
  // ride the stream across the streamhouse panel
  const ride = el.animate(
    [{ transform: 'translateX(0)', opacity: 0 }, { opacity: 1, offset: 0.08 }, { transform: 'translateX(450px)', opacity: 1 }],
    { duration: 2600, easing: 'linear', fill: 'forwards' },
  )
  running.add(ride)
  // agents act on it as it passes the middle
  setTimeout(() => {
    if (!live.value) return
    pApps.value?.fire({ speed: 900 }).then((ok) => { if (ok) { acted.value++; flow.value?.flash('apps', 0.8) } })
  }, 1150)
  ride.finished.then(() => {
    running.delete(ride)
    if (!at(3)) {
      const out = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' })
      running.add(out)
      out.finished.then(() => el.remove(), () => el.remove())
      return
    }
    // cross the bridge and land as a row
    const cross = el.animate(
      [{ transform: 'translateX(450px)' }, { transform: 'translateX(830px)', opacity: 1 }, { transform: 'translateX(860px)', opacity: 0 }],
      { duration: 700, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' },
    )
    running.add(cross)
    cross.finished.then(() => {
      running.delete(cross)
      el.remove()
      rows.value = [{ k: rk++, rec: text, t: stamp(i) }, ...rows.value].slice(0, 5)
      snapshot.value++
      if (i % 3 === 0) pBi.value?.fire({ speed: 600 })
    }, () => el.remove())
  }, () => el.remove())
}

let timer: ReturnType<typeof setInterval> | undefined
const on = computed(() => live.value && at(1))
watch(on, (v) => {
  clearInterval(timer)
  if (v) {
    rows.value = []
    acted.value = 0
    snapshot.value = 1204
    n = 0
    spawn()
    timer = setInterval(spawn, 1500)
  }
  else clearLane()
}, { immediate: true })
onBeforeUnmount(() => clearInterval(timer))

// Static: a settled picture per beat.
watch([isStatic, clicks], () => {
  if (!isStatic.value) return
  acted.value = clicks.value >= 1 ? 1204 : 0
  rows.value = clicks.value >= 3 ? RECS.slice(0, 5).map((rec, i) => ({ k: i, rec, t: stamp(5 - i) })) : []
  snapshot.value = clicks.value >= 3 ? 1209 : 1204
}, { immediate: true })

const STATIC_CHIPS = RECS.slice(0, 3)
</script>

<template>
  <FlowDiagram ref="flow" :nodes="nodes" :wires="wires">
    <g :class="b(1, 'fade')">
      <rect x="0" y="40" :width="PW" height="580" rx="6" class="node-box ghost" />
      <text class="svg-mono" x="30" y="92" style="font-size: 28px">Streamhouse</text>
      <text class="svg-body" :x="PW - 30" y="92" text-anchor="end" style="font-size: 20px">what is happening, what happens next</text>
    </g>
    <g :class="b(2, 'fade')">
      <rect :x="RX" y="40" :width="PW" height="580" rx="6" class="node-box ghost" />
      <text class="svg-mono" :x="RX + 30" y="92" style="font-size: 28px">Lakehouse</text>
      <text class="svg-body" :x="RX + PW - 30" y="92" text-anchor="end" style="font-size: 20px">what happened</text>
    </g>
    <g :class="b(3, 'fade')">
      <text class="svg-body" x="840" y="176" text-anchor="middle" style="font-size: 16px">materialized</text>
      <text class="svg-body" x="840" y="262" text-anchor="middle" style="font-size: 16px">history back</text>
    </g>
    <WirePulse ref="pApps" :d="wirePath(TO_APPS)" />
    <WirePulse ref="pBi" :d="wirePath(TO_BI)" />
    <template #html>
      <div class="stream" :class="b(1, 'fade')">
        <div class="label s-head"><span>topic / positions · live</span><span>{{ acted.toLocaleString('en-US') }} acted on</span></div>
        <div ref="lane" class="lane">
          <template v-if="isStatic">
            <div v-for="(c, i) in STATIC_CHIPS" :key="c" class="chip mono" :style="{ transform: `translateX(${40 + i * 230}px)` }">{{ c }}</div>
          </template>
        </div>
      </div>

      <div class="table panel" :class="b(2, 'rise')">
        <div class="label t-head"><span>open table · iceberg</span><span>snapshot {{ snapshot.toLocaleString('en-US') }}</span></div>
        <div class="label t-cols"><span>record</span><span>event time</span></div>
        <TransitionGroup name="shove" tag="div" class="t-rows">
          <div v-for="(r, i) in rows" :key="r.k" class="t-row mono" :class="{ first: i === 0 }">
            <span>{{ r.rec }}</span><span>{{ r.t }}</span>
          </div>
        </TransitionGroup>
        <div v-if="!rows.length" class="label t-empty">rows land here once the bridge is on</div>
      </div>
    </template>
  </FlowDiagram>
</template>

<style scoped>
.stream { position: absolute; left: 30px; top: 130px; width: 700px; }
.s-head { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 10px; }
.lane {
  position: relative; height: 110px; border-radius: var(--radius);
  background: repeating-linear-gradient(90deg, rgba(198, 198, 198, .08) 0 2px, transparent 2px 26px), var(--panel);
  border: 1px solid var(--panel-line);
}
.lane :deep(.chip), .lane .chip {
  position: absolute; left: 0; top: 33px; padding: 8px 12px; border-radius: 4px;
  background: var(--hit); color: var(--ink); font-size: 16px; white-space: nowrap;
}
.table { position: absolute; left: 950px; top: 130px; width: 700px; height: 280px; box-sizing: border-box; padding: 14px 18px; overflow: hidden; }
.t-head { display: flex; justify-content: space-between; font-size: 14px; }
.t-cols { display: flex; justify-content: space-between; font-size: 13px; margin: 12px 0 6px; padding-bottom: 6px; border-bottom: 1px solid var(--rule); }
.t-rows { position: relative; }
.t-row { display: flex; justify-content: space-between; height: 38px; line-height: 38px; font-size: 19px; color: rgba(244, 244, 244, .8); border-bottom: 1px solid var(--rule); }
.t-row.first { color: var(--text); }
.t-empty { font-size: 14px; margin-top: 18px; }
.shove-move { transition: transform 360ms var(--ease); }
.shove-enter-active { transition: transform 360ms var(--ease), opacity 360ms; }
.shove-enter-from { transform: translateY(-38px); opacity: 0; }
.shove-enter-active span { animation: ss-hit 900ms var(--ease-out); }
.shove-leave-active { display: none; }
</style>
