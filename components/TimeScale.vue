<script setup lang="ts">
/**
 * Log-scale time axis from 1 ms to 1 day, with markers that glide to their
 * value. Markers can carry a label above and a tone (text / hit / accent).
 */
import { useBeats } from './useBeats'

export interface Mark { ms: number, label?: string, sub?: string, tone?: 'text' | 'hit' | 'accent' | 'muted', at?: number }

const props = withDefaults(defineProps<{
  marks?: Mark[]
  width?: number
  /** fill the bar from 0 to this mark index */
  fill?: number
}>(), { marks: () => [], width: 1680, fill: -1 })

const { at } = useBeats()
const MAX = Math.log10(86_400_000)
const x = (ms: number) => (Math.log10(Math.max(1, ms)) / MAX) * props.width
const TICKS = [
  { ms: 1, t: '1 MS' }, { ms: 1000, t: '1 S' }, { ms: 60_000, t: '1 MIN' }, { ms: 3_600_000, t: '1 HR' }, { ms: 86_400_000, t: '1 DAY' },
]
</script>

<template>
  <div class="ts" :style="{ width: `${width}px` }">
    <div class="ts-marks">
      <div
        v-for="(m, i) in marks" :key="i"
        class="ts-mark" :class="[m.tone ?? 'text', { off: m.at !== undefined && !at(m.at) }]"
        :style="{ transform: `translateX(${x(m.ms)}px)` }"
      >
        <div class="ts-text">
          <div v-if="m.label" class="ts-label mono">{{ m.label }}</div>
          <div v-if="m.sub" class="ts-sub label">{{ m.sub }}</div>
        </div>
        <div class="ts-pin" />
      </div>
    </div>
    <div class="ts-axis">
      <div
        v-if="fill >= 0 && marks[fill]" class="ts-fill"
        :class="marks[fill].tone ?? 'text'"
        :style="{ width: `${x(marks[fill].ms)}px` }"
      />
    </div>
    <div class="ts-ticks">
      <span v-for="t in TICKS" :key="t.t" class="label" :style="{ left: `${x(t.ms)}px` }">{{ t.t }}</span>
    </div>
  </div>
</template>

<style scoped>
.ts { position: relative; height: 150px; }
.ts-marks { position: absolute; left: 0; right: 0; top: 0; height: 100px; }
.ts-mark {
  position: absolute; left: 0; bottom: 0; width: 0;
  transition: transform 900ms var(--ease), opacity 400ms ease;
}
.ts-mark.off { opacity: 0; }
.ts-text { position: absolute; bottom: 30px; left: 0; transform: translateX(-50%); text-align: center; white-space: nowrap; }
.ts-mark:first-child .ts-text { }
.ts-label { font-size: 28px; }
.ts-sub { font-size: 16px; margin-top: 4px; }
.ts-pin { position: absolute; bottom: 0; left: -1px; width: 3px; height: 26px; border-radius: 2px; }
.text .ts-pin { background: var(--text); }
.hit .ts-pin { background: var(--hit); box-shadow: 0 0 14px rgba(var(--hit-rgb), .7); }
.hit .ts-label { color: var(--hit); }
.accent .ts-pin { background: var(--accent); }
.accent .ts-label { color: var(--accent); }
.muted .ts-pin { background: var(--muted); }
.muted .ts-label { color: var(--muted); }
.ts-axis { position: absolute; left: 0; right: 0; top: 104px; height: 4px; background: var(--rule); border-radius: 2px; }
.ts-fill { height: 100%; border-radius: 2px; transition: width 900ms var(--ease); }
.ts-fill.text { background: var(--text); }
.ts-fill.hit { background: var(--hit); }
.ts-fill.accent { background: var(--accent); }
.ts-ticks { position: absolute; left: 0; right: 0; top: 120px; }
.ts-ticks span { position: absolute; transform: translateX(-50%); font-size: 16px; white-space: nowrap; }
.ts-ticks span:first-child { transform: none; }
.ts-ticks span:last-child { transform: translateX(-100%); }
</style>
