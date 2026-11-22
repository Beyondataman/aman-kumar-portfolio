/**
 * Mutable, non-React state read inside the render loop (useFrame).
 * High-frequency values (scroll, pointer, camera targets) live here so
 * scrolling never triggers React re-renders.
 */
export const live = {
  route: 'story',
  pointer: { x: 0, y: 0 },
  activeUntil: 0, // render at full rate until this timestamp
  idleFps: 30, // ambient frame rate when nothing is happening (0 = render only on demand)
  reducedMotion: false,
  snapUntil: 0, // until this timestamp damped values jump straight to their targets (used after restore)
  story: {
    c: 0, // continuous chapter position (chapter index + fraction)
    intro: 0, // 0..1 time-based emergence of the core on first load
    introStart: 0,
    attractor: null, // {x,y} NDC — skill cluster the core is drawn toward
    dive: 0, // 0..1 portal fly-through
    diveTarget: 0,
  },
  hall: {
    t: 0, // 0..1 gallery scroll position
    hovered: null,
    selected: null,
    entering: null, // id being entered (camera flight)
    enterStart: 0,
    card: null, // screen anchor of the hovered pillar
  },
  workspace: { enterStart: 0 },
}

export function kick(ms = 1200) {
  const t = performance.now() + ms
  if (t > live.activeUntil) live.activeUntil = t
}

/** Make every damped value jump to its target for a few frames (after restoring state). */
export function snap(ms = 160) {
  live.snapUntil = performance.now() + ms
  kick(ms + 400)
}
