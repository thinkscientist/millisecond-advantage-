<script setup lang="ts">
/** Reveal wrapper: visible from beat `at`, plays `fx` only on the step it appears. */
import { useBeats, type Fx } from './useBeats'

withDefaults(defineProps<{ at: number, fx?: Fx, tag?: string }>(), { fx: 'rise', tag: 'div' })
const { b } = useBeats()
</script>

<template>
  <component :is="tag" :class="b(at, fx)"><slot /></component>
</template>
