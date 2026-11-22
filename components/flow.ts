import type { Fx } from './useBeats'

export type Pt = readonly [number, number]

export interface FlowNode {
  id: string
  x: number
  y: number
  w: number
  h: number
  label: string
  sub?: string
  beat?: number
  fx?: Fx
  tone?: 'default' | 'strong' | 'accent' | 'ghost'
  /** label alignment inside the box */
  align?: 'center' | 'left'
}

export interface FlowWire {
  id: string
  pts: readonly Pt[]
  beat?: number
  dashed?: boolean
  arrow?: boolean
  hot?: boolean
  /** a wire that only lights up later, e.g. "written back" */
  hotAt?: number
}

/** Polyline through points with softly rounded corners. */
export function wirePath(input: readonly Pt[], r = 14): string {
  // drop repeated points so corners never divide by zero
  const pts = input.filter((p, i) => i === 0 || p[0] !== input[i - 1][0] || p[1] !== input[i - 1][1])
  if (pts.length < 2) return ''
  let d = `M${pts[0][0]} ${pts[0][1]}`
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1]
    const [x, y] = pts[i]
    const [nx, ny] = pts[i + 1]
    const l1 = Math.hypot(x - px, y - py)
    const l2 = Math.hypot(nx - x, ny - y)
    const rr = Math.min(r, l1 / 2, l2 / 2)
    const ax = x - ((x - px) / l1) * rr
    const ay = y - ((y - py) / l1) * rr
    const bx = x + ((nx - x) / l2) * rr
    const by = y + ((ny - y) / l2) * rr
    d += ` L${ax} ${ay} Q${x} ${y} ${bx} ${by}`
  }
  const [lx, ly] = pts[pts.length - 1]
  d += ` L${lx} ${ly}`
  return d
}

/** Small filled arrowhead at the end of the last segment. */
export function arrowHead(pts: readonly Pt[], size = 12): string {
  const [ax, ay] = pts[pts.length - 2]
  const [bx, by] = pts[pts.length - 1]
  const a = Math.atan2(by - ay, bx - ax)
  const p = (ang: number, l: number) => `${bx - Math.cos(ang) * l} ${by - Math.sin(ang) * l}`
  return `M${bx} ${by} L${p(a - 0.45, size)} L${p(a + 0.45, size)} Z`
}

/** Points ending `gap` px before a target edge, so arrowheads don't touch boxes. */
export function trim(pts: readonly Pt[], gap = 4): Pt[] {
  const out = pts.map(p => [p[0], p[1]] as [number, number])
  const n = out.length
  const [ax, ay] = out[n - 2]
  const [bx, by] = out[n - 1]
  const l = Math.hypot(bx - ax, by - ay)
  out[n - 1] = [bx - ((bx - ax) / l) * gap, by - ((by - ay) / l) * gap]
  return out
}
