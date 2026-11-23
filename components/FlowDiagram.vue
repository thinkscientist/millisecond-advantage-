<script setup lang="ts">
/**
 * SVG nodes and wires from an explicit coordinate map. No auto-layout:
 * every slide passes its own coordinates on a fixed canvas (default 1680x660).
 *
 * Slots:
 *   default  extra SVG drawn on top (pulses, labels)
 *   html     absolutely positioned HTML on top (live numbers, cards)
 */
import { onBeforeUnmount } from 'vue'
import { arrowHead, trim, wirePath, type FlowNode, type FlowWire } from './flow'
import { useBeats } from './useBeats'

const props = withDefaults(defineProps<{
  nodes?: FlowNode[]
  wires?: FlowWire[]
  width?: number
  height?: number
}>(), { nodes: () => [], wires: () => [], width: 1680, height: 660 })

const { b, at, live } = useBeats()

// Node glow when something lands: rise 80 ms, decay 700 ms (reference timings).
const glows = new Map<string, SVGRectElement>()
const glowAnims = new Set<Animation>()
function flash(id: string, strength = 1) {
  const el = glows.get(id)
  if (!el || !live.value) return
  const a = el.animate(
    [{ opacity: 0 }, { opacity: strength, offset: 80 / 780, easing: 'cubic-bezier(0, 0, 0.2, 1)' }, { opacity: 0 }],
    { duration: 780 },
  )
  glowAnims.add(a)
  a.finished.finally(() => glowAnims.delete(a))
}
onBeforeUnmount(() => glowAnims.forEach(a => a.cancel()))
defineExpose({ flash })

function wireClass(w: FlowWire) {
  return [
    'wire',
    b(w.beat ?? 0, w.dashed ? 'fade' : 'stroke'),
    { dashed: w.dashed, hot: w.hot || (w.hotAt !== undefined && at(w.hotAt)) },
  ]
}
function arrowClass(w: FlowWire) {
  return ['arrow', b(w.beat ?? 0, 'fade'), { hot: w.hot || (w.hotAt !== undefined && at(w.hotAt)) }]
}
function labelX(n: FlowNode) {
  return n.align === 'left' ? n.x + 28 : n.x + n.w / 2
}
</script>

<template>
  <div class="flow" :style="{ width: `${props.width}px`, height: `${props.height}px` }">
    <svg :width="props.width" :height="props.height" :viewBox="`0 0 ${props.width} ${props.height}`" overflow="visible">
      <g class="wires">
        <template v-for="w in props.wires" :key="w.id">
          <path
            :d="wirePath(w.arrow === false ? w.pts : trim(w.pts, 3))"
            :class="wireClass(w)"
            :pathLength="w.dashed ? undefined : 1"
            :data-wire="w.id"
          />
          <path
            v-if="w.arrow !== false"
            :d="arrowHead(trim(w.pts, 2))"
            :class="arrowClass(w)"
            style="animation-delay: 650ms"
          />
        </template>
      </g>
      <g class="nodes">
        <g v-for="n in props.nodes" :key="n.id" :class="[b(n.beat ?? 0, n.fx ?? 'lift'), { 'on-live': n.tone === 'live' }]" :data-node="n.id">
          <rect
            :x="n.x" :y="n.y" :width="n.w" :height="n.h" rx="6"
            class="node-box" :class="n.tone && n.tone !== 'default' ? n.tone : ''"
          />
          <rect
            :ref="(el: any) => el && glows.set(n.id, el)"
            :x="n.x" :y="n.y" :width="n.w" :height="n.h" rx="6" class="node-glow"
          />
          <text
            class="node-label"
            :x="labelX(n)"
            :y="n.y + n.h / 2 + (n.sub ? -6 : 10)"
            :text-anchor="n.align === 'left' ? 'start' : 'middle'"
          >{{ n.label }}</text>
          <text
            v-if="n.sub"
            class="node-sub"
            :x="labelX(n)"
            :y="n.y + n.h / 2 + 28"
            :text-anchor="n.align === 'left' ? 'start' : 'middle'"
          >{{ n.sub }}</text>
        </g>
      </g>
      <slot />
    </svg>
    <div class="flow-html">
      <slot name="html" />
    </div>
  </div>
</template>

<style scoped>
.flow {
  position: relative;
}
.flow svg {
  position: absolute;
  inset: 0;
  overflow: visible;
}
.flow-html {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
</style>
