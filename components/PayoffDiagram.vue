<script setup lang="ts">
/**
 * Slide 13 — one record, written once, read on three timescales.
 *
 * Beat 1  records arrive, one at a time, as cream chips
 * Beat 2  the risk agent reads each one within milliseconds
 * Beat 3  the desk dashboard shows it within a second
 * Beat 4  the regulator replays the same records months later
 * Beat 5  takeaway (PillarSlide)
 * A time scale underneath places each reader as it comes online.
 */
import { computed, reactive, ref, watch } from 'vue'
import FlowDiagram from './FlowDiagram.vue'
import TimeScale from './TimeScale.vue'
import WirePulse from './WirePulse.vue'
import { wirePath, type FlowNode, type FlowWire, type Pt } from './flow'
import { useTickFeed } from './TickFeed'
import { useBeats } from './useBeats'

const { b, at, live, isStatic, clicks } = useBeats()

const R = [70, 205, 340]
const READERS = [
  { id: 'r0', label: 'Risk agent', sub: 'acts on it: tightens a limit', beat: 2, speed: 2600, dashed: false },
  { id: 'r1', label: 'Desk dashboard', sub: 'a person sees the new exposure', beat: 3, speed: 700, dashed: false },
  { id: 'r2', label: 'Regulator', sub: 'replays the day, record by record', beat: 4, speed: 380, dashed: true },
]
const nodes: FlowNode[] = READERS.map((r, i) => ({
  id: r.id, x: 900, y: R[i] - 55, w: 780, h: 110, label: r.label, sub: r.sub, beat: r.beat, align: 'left' as const,
}))
const W: Pt[][] = R.map(cy => [[440, 205], [680, 205], [680, cy], [900, cy]])
const wires: FlowWire[] = W.map((pts, i) => ({ id: `w${i}`, pts, beat: READERS[i].beat, dashed: READERS[i].dashed }))

const RECORDS = [
  { gap: 2600, kind: 'fill', what: 'XYZ +10,000', acct: 'ACCT 2231', t: '14:02:07.412' },
  { gap: 2600, kind: 'price', what: 'ABC 18.43', acct: 'ALL HOLDERS', t: '14:02:09.880' },
  { gap: 2600, kind: 'fill', what: 'DEF −2,500', acct: 'ACCT 4410', t: '14:02:12.105' },
  { gap: 2600, kind: 'price', what: 'XYZ 41.15', acct: 'ALL HOLDERS', t: '14:02:14.731' },
]
const rec = ref(RECORDS[0])
const recK = ref(0)
const seen = reactive<string[]>(['', '', ''])
const seenK = reactive([0, 0, 0])
const VERB = ['acted on', 'showing', 'replayed']
const LAG = ['+5 ms', '+0.8 s', '+6 months']

const flow = ref<InstanceType<typeof FlowDiagram>>()
const pulses = ref<(InstanceType<typeof WirePulse> | null)[]>([])

const feedOn = computed(() => live.value && clicks.value >= 1)
watch(feedOn, (v) => { if (v) { rec.value = RECORDS[0]; seen.fill('') } })
useTickFeed(RECORDS, feedOn, (r) => {
  rec.value = r
  recK.value++
  READERS.forEach((rd, i) => {
    if (!at(rd.beat)) return
    pulses.value[i]?.fire({ speed: rd.speed }).then((ok) => {
      if (!ok) return
      seen[i] = `${VERB[i]} ${r.kind} ${r.what}`
      seenK[i]++
      flow.value?.flash(rd.id, 0.9)
    })
  })
})

watch([isStatic, clicks], () => {
  if (!isStatic.value) return
  rec.value = RECORDS[0]
  READERS.forEach((rd, i) => { seen[i] = at(rd.beat) ? `${VERB[i]} fill XYZ +10,000` : '' })
}, { immediate: true })

const marks = [
  { ms: 5, label: '≈ 5 ms', sub: 'risk agent', tone: 'hit' as const, at: 2 },
  { ms: 800, label: '≈ 1 s', sub: 'desk', tone: 'text' as const, at: 3 },
  { ms: 86_400_000, label: '+6 mo', sub: 'regulator', tone: 'muted' as const, at: 4 },
]
const fillTo = computed(() => (at(4) ? 2 : at(3) ? 1 : at(2) ? 0 : -1))
</script>

<template>
  <FlowDiagram ref="flow" :nodes="nodes" :wires="wires">
    <WirePulse v-for="(pts, i) in W" :key="i" :ref="(el: any) => (pulses[i] = el)" :d="wirePath(pts)" />
    <template #html>
      <div class="rec" :class="b(1, 'rise')">
        <div class="label rec-head">one record · written once</div>
        <div :key="recK" class="chip mono" :class="{ pop: recK > 0 && !isStatic }">
          <div class="chip-top"><span>{{ rec.kind }}</span><span>{{ rec.t }}</span></div>
          <div class="chip-what">{{ rec.what }}</div>
          <div>{{ rec.acct }}</div>
        </div>
      </div>
      <div
        v-for="(rd, i) in READERS" :key="rd.id" class="seen" :class="b(rd.beat, 'fade')"
        :style="{ top: `${R[i] - 30}px` }"
      >
        <div class="lag mono">{{ LAG[i] }}</div>
        <div :key="seenK[i]" class="label what" :class="{ cool: seenK[i] > 0 }">{{ seen[i] || 'waiting' }}</div>
      </div>
      <div class="scale" :class="b(2, 'fade')">
        <TimeScale :marks="marks" :fill="fillTo" />
      </div>
    </template>
  </FlowDiagram>
</template>

<style scoped>
.rec { position: absolute; left: 0; top: 112px; width: 440px; }
.rec-head { font-size: 15px; margin-bottom: 10px; }
.chip { background: var(--hit); color: var(--ink); border-radius: var(--radius); padding: 16px 20px; font-size: 19px; line-height: 1.5; }
.chip-top { display: flex; justify-content: space-between; font-size: 16px; opacity: .75; text-transform: uppercase; }
.chip-what { font-size: 34px; line-height: 1.3; }
.chip.pop { animation: chip-in 480ms var(--ease); }
@keyframes chip-in { from { transform: translateY(-16px); opacity: 0 } }
.seen { position: absolute; right: 28px; text-align: right; width: 330px; }
.lag { font-size: 30px; color: var(--hit); }
.what { font-size: 14px; margin-top: 4px; white-space: nowrap; }
.scale { position: absolute; left: 0; top: 470px; width: 1680px; }
</style>
