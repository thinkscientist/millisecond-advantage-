<script setup lang="ts">
/**
 * Pillar slide frame: decoding title top-left, a fixed 1680x660 diagram
 * slot, and a one-line takeaway pinned above the scene nav that rises in at
 * `takeawayAt`.
 */
import Decode from './Decode.vue'
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
      <Decode tag="h1" class="display" :text="title" />
      <p v-if="kicker" class="kicker muted">{{ kicker }}</p>
    </header>
    <section class="pillar-diagram">
      <slot />
    </section>
    <footer v-if="takeaway" class="pillar-takeaway" :class="b(takeawayAt, 'rise')">
      {{ takeaway }}
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
  top: 52px;
  right: 120px;
}
.pillar-head :deep(h1) {
  font-size: 76px;
  line-height: 84px;
  margin: 0;
  white-space: nowrap;
}
.kicker {
  font-size: 30px;
  line-height: 38px;
  margin: 6px 0 0;
}
.pillar-diagram {
  position: absolute;
  left: 120px;
  top: 200px;
  width: 1680px;
  height: 660px;
}
.pillar-takeaway {
  position: absolute;
  left: 120px;
  right: 120px;
  bottom: 120px;
  font-size: 40px;
  line-height: 50px;
  font-weight: 600;
  letter-spacing: -0.015em;
  white-space: nowrap;
}
</style>
