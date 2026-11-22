<script setup lang="ts">
/**
 * Slide 2 — one question, asked all afternoon, answered fifteen minutes late.
 *
 * Beat 1  the question decodes in; a timer starts running "since the question"
 * Beat 2  the people who ask it, and how often (counters tick up now and then)
 * Beat 3  the risk agent asks constantly (counter climbs fast)
 * Beat 4  a time scale: what an agent can wait vs. how long this answer is taking
 * Beat 5  the answer lands at 15:00; the market has already moved
 * Beat 6  takeaway (PillarSlide)
 *
 * The afternoon runs 30x real time so fifteen minutes passes in thirty seconds.
 * Static (print / reduced motion): each beat settles to a fixed moment.
 */
import { computed, ref, watch } from 'vue'
import Decode from './Decode.vue'
import Flap from './Flap.vue'
import LiveNumber from './LiveNumber.vue'
import TimeScale from './TimeScale.vue'
import { fmtTimer, useNow } from './A_useNow'
import { useBeats } from './useBeats'

const { b, at, live, isStatic, clicks } = useBeats()

const SPEED = 30
const ANSWER = 15 * 60_000
const now = useNow(live)

// Simulated afternoon: starts when the question is asked (beat 1).
const qStart = ref<number | null>(null)
const skip = ref(0) // fast-forward applied when the answer lands early
watch([live, () => at(1)], ([l, a]) => {
  if (l && a && qStart.value === null) { qStart.value = performance.now(); skip.value = 0 }
  if (!a || !l) qStart.value = null
}, { immediate: true })

const STATIC_SIM = [0, 40_000, 40_000, 130_000, 7 * 60_000, ANSWER, ANSWER]
const sim = computed(() => {
  if (isStatic.value || !live.value) return STATIC_SIM[Math.min(clicks.value, 6)]
  if (qStart.value === null) return 0
  const t = (now.value - qStart.value) * SPEED + skip.value
  return at(5) ? ANSWER : Math.min(t, ANSWER - 1000)
})
// The answer lands at beat 5: fast-forward the clock to 15:00.
watch(() => at(5), (v) => {
  if (v && qStart.value !== null) skip.value = Math.max(0, ANSWER - (now.value - qStart.value) * SPEED)
})

// People who ask: base count plus asks at fixed simulated minutes.
const ASKERS = [
  { who: 'Trading desk', why: 'before adding risk', base: 6, more: [3, 9, 13] },
  { who: 'Risk officer', why: 'when a name moves', base: 4, more: [6, 12] },
  { who: 'Advisor', why: 'when the client calls', base: 3, more: [10] },
]
const asked = (a: typeof ASKERS[number]) => a.base + a.more.filter(m => sim.value >= m * 60_000).length

// The agent asks ~8 times a simulated second once it appears.
const agentStart = ref<number | null>(null)
watch(() => at(3), (v) => { agentStart.value = v ? sim.value : null }, { immediate: true })
const STATIC_AGENT = [0, 0, 0, 1_284, 9_610, 14_400, 14_400]
const agentAsked = computed(() => {
  if (isStatic.value || !live.value) return STATIC_AGENT[Math.min(clicks.value, 6)]
  if (agentStart.value === null) return 0
  return 1_284 + Math.floor((sim.value - agentStart.value) / 1000 * 8)
})

const timer = computed(() => fmtTimer(sim.value))
const answered = computed(() => at(5))
const marks = computed(() => [
  { ms: 5, label: '5 MS', sub: 'what an agent can wait', tone: 'hit' as const },
  { ms: Math.max(1, sim.value), label: timer.value, sub: answered.value ? 'answered' : 'still assembling', tone: 'accent' as const },
])
</script>

<template>
  <div class="brokerage">
    <!-- the question -->
    <div class="q" :class="b(1, 'fade')">
      <div class="label">ACCT 2231 · a client on the phone · 14:02</div>
      <Decode v-if="at(1)" tag="div" class="q-text display" text="“What is my exposure, across everything, right now?”" />
    </div>

    <!-- the clock since the question -->
    <div class="since panel" :class="b(1, 'rise')">
      <div class="label">since the question</div>
      <div v-if="!answered" class="since-num mono">{{ timer }}</div>
      <Flap v-else :value="timer" :size="88" tone="hit" />
      <div class="label since-state" :class="{ done: answered }">
        <span v-if="!answered" class="dot breathe" />{{ answered ? 'answered · the market moved twice' : 'pulling exports, joining sheets' }}
      </div>
    </div>

    <!-- who asks -->
    <div class="askers">
      <div class="row head label" :class="b(2, 'fade')"><span>who asks</span><span>when</span><span>times asked today</span></div>
      <div v-for="(a, i) in ASKERS" :key="a.who" class="row" :class="b(2, 'rise')" :style="{ animationDelay: `${i * 70}ms` }">
        <span class="who">{{ a.who }}</span>
        <span class="why">{{ a.why }}</span>
        <span class="n"><LiveNumber :value="String(asked(a))" :size="30" :still="isStatic" /></span>
      </div>
      <div class="row agent" :class="b(3, 'rise')">
        <span class="who">Risk agent</span>
        <span class="why">constantly, before every action</span>
        <span class="n"><LiveNumber :value="agentAsked.toLocaleString('en-US')" :size="30" :still="isStatic" /></span>
      </div>
    </div>

    <!-- time scale -->
    <div class="scale" :class="b(4, 'rise')">
      <TimeScale :marks="marks" :fill="1" />
    </div>
  </div>
</template>

<style scoped>
.brokerage { position: relative; width: 1680px; height: 660px; }
.q { position: absolute; left: 0; top: 0; width: 1060px; }
.q-text { font-size: 54px; line-height: 62px; margin-top: 12px; letter-spacing: -0.02em; }
.since { position: absolute; right: 0; top: 0; width: 500px; box-sizing: border-box; padding: 20px 26px; }
.since-num { font-size: 88px; line-height: 1; margin: 14px 0 12px; font-variant-numeric: tabular-nums; }
.since :deep(.flap) { margin: 14px 0 12px; }
.since-state { font-size: 15px; display: flex; gap: 10px; align-items: center; }
.since-state.done { color: var(--accent); }
.dot { width: 8px; height: 8px; border-radius: 50%; background: var(--hit); }

.askers { position: absolute; left: 0; top: 222px; width: 1680px; }
.row { display: grid; grid-template-columns: 360px 1fr 300px; align-items: center; height: 54px; border-top: 1px solid var(--rule); font-size: 28px; }
.row.head { height: 36px; border-top: none; font-size: 15px; }
.row .n, .row.head span:last-child { text-align: right; }
.who { font-weight: 600; }
.why { color: var(--muted); font-size: 24px; }
.row.agent .who { color: var(--hit); }

.scale { position: absolute; left: 0; top: 500px; }
</style>
