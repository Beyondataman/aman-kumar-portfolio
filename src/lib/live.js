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
  hall: {
    slots: new Map(), // company id → the DOM element its 3D island sits behind
    hovered: null,
  },
  workspace: { enterStart: 0 },
  hero: {
    ready: false, // mosaic built
    requested: false, // the page asked for the assembly to start
    start: 0, // performance.now() when assembly began (0 = not yet)
    duration: 2600,
    t: 0, // 0..1 assembly progress
    scatter: 0, // 0..1 as the hero scrolls away
  },
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
