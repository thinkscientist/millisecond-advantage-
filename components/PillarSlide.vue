<script setup lang="ts">
/**
 * Pillar slide frame: title top-left, a fixed 1680x660 diagram slot, and a
 * one-line takeaway pinned to the bottom that rises in at `takeawayAt`.
 */
import { useBeats } from './useBeats'

withDefaults(defineProps<{
  title: string
  kicker?: string
  takeaway?: string
  takeawayAt?: number
}>(), { takeawayAt: 0 })

const { b } = useBeats()
</script>

<template>
  <div class="pillar">
    <header class="pillar-head">
      <h1 class="display">{{ title }}</h1>
      <p v-if="kicker" class="kicker muted">{{ kicker }}</p>
    </header>
    <section class="pillar-diagram">
      <slot />
    </section>
    <footer v-if="takeaway" class="pillar-takeaway" :class="b(takeawayAt, 'rise')">
      <span class="bar" />
      <span>{{ takeaway }}</span>
    </footer>
  </div>
</template>

<style scoped>
.pillar {
  position: absolute;
  inset: 0;
}
.pillar-head {
  position: absolute;
  left: 120px;
  top: 104px;
  right: 120px;
  display: flex;
  align-items: baseline;
  gap: 40px;
}
.pillar-head h1 {
  font-size: 72px;
  line-height: 1;
  margin: 0;
  font-weight: 400;
  white-space: nowrap;
}
.kicker {
  font-size: 28px;
  margin: 0;
}
.pillar-diagram {
  position: absolute;
  left: 120px;
  top: 236px;
  width: 1680px;
  height: 660px;
}
.pillar-takeaway {
  position: absolute;
  left: 120px;
  right: 120px;
  bottom: 64px;
  padding-top: 28px;
  border-top: 1px solid var(--rule);
  font-size: 36px;
  display: flex;
  align-items: center;
  gap: 22px;
  white-space: nowrap;
}
.bar {
  width: 28px;
  height: 4px;
  background: var(--accent);
  flex: none;
}
</style>
