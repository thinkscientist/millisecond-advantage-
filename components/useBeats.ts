import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useNav, useSlideContext } from '@slidev/client'

export type Fx = 'fade' | 'rise' | 'lift' | 'draw-x' | 'stroke'

/**
 * Beat state for the slide this component lives in.
 *
 * - `clicks`   the slide's click count (Slidev's `$clicks`)
 * - `active`   this slide is the one on screen
 * - `isStatic` print/export, reduced motion, or an overview/preview render:
 *              no pulses, no reveal motion, final state per beat
 * - `live`     active and not static: timers and pulses may run
 * - `b(n,fx)`  class list for an element that appears at beat n
 * - `epoch`    bumps on slide leave/enter and on step-back; anything running
 *              should cancel when it changes
 */
export function useBeats() {
  const { $clicks, $page, $nav, $renderContext } = useSlideContext()
  const { isPrintMode } = useNav()
  const mq = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : undefined
  const prefersReduced = ref(!!mq?.matches)
  const onMq = (e: MediaQueryListEvent) => (prefersReduced.value = e.matches)
  mq?.addEventListener('change', onMq)
  onBeforeUnmount(() => mq?.removeEventListener('change', onMq))

  const clicks = computed(() => $clicks.value)
  const active = computed(() => $page.value === $nav.value.currentSlideNo)
  const reduced = computed(() => prefersReduced.value)
  const isStatic = computed(
    () =>
      isPrintMode.value
      || reduced.value
      || !['slide', 'presenter'].includes($renderContext.value as string),
  )
  const live = computed(() => active.value && !isStatic.value)

  // The beat that was just stepped onto, going forward by one. Reveal
  // keyframes only play for elements at this beat.
  const fresh = ref(-1)
  const epoch = ref(0)

  watch(clicks, (n, o) => {
    fresh.value = o !== undefined && n === o + 1 ? n : -1
    if (o !== undefined && n < o)
      epoch.value++
  })
  watch(active, () => {
    fresh.value = -1
    epoch.value++
  })

  function b(n: number, fx: Fx = 'fade') {
    const on = clicks.value >= n
    return {
      'beat': true,
      [`fx-${fx}`]: true,
      'on': on,
      'play': on && n > 0 && fresh.value === n && !isStatic.value,
    }
  }

  const at = (n: number) => clicks.value >= n

  return { clicks, active, isStatic, live, reduced, epoch, b, at }
}
