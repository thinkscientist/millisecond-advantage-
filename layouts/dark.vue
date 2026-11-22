<script setup lang="ts">
// Slidev passes unknown frontmatter keys to the layout as props.
defineProps<{ scene?: string }>()
</script>

<template>
  <div class="slidev-layout dark-layout">
    <div v-if="scene" class="scene-label display">{{ scene }}</div>
    <slot />
  </div>
</template>

<style>
.dark-layout {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--bg);
  color: var(--text);
  padding: 0;
}
.dark-layout .scene-label {
  position: absolute;
  top: 56px;
  left: 120px;
  font-size: 20px;
  letter-spacing: 0.14em;
  color: var(--muted);
}
.dark-layout .scene-label::before {
  content: '';
  display: inline-block;
  width: 10px;
  height: 10px;
  margin-right: 14px;
  background: var(--accent);
  vertical-align: 1px;
}
/* Slidev wraps markdown in <p>; keep our own spacing */
.dark-layout > p:empty { display: none; }
</style>
