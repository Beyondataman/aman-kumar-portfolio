import { useEffect, useRef } from 'react'
import { animate, stagger } from 'animejs'

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const SEED = 'A' // the letter every slot starts as

/**
 * First-visit intro:
 *  1. a single "A" appears in the centre
 *  2. it duplicates outwards until every slot of the name holds an "A"
 *  3. one slot at a time, in random order, each letter flickers through a few
 *     random characters and lands on its real letter
 *  4. a line sweeps under the name, then everything lifts away
 * Click / any key skips it. Shown once per browser session.
 */
export default function Preloader({ name, onDone }) {
  const root = useRef(null)
  const done = useRef(false)

  useEffect(() => {
    const el = root.current
    const slots = [...el.querySelectorAll('.pl-l:not(.pl-sp)')]
    const glyphs = slots.map((s) => s.querySelector('.pl-g'))
    const line = el.querySelector('.pl-line i')
    const timers = []
    const anims = []
    const later = (fn, ms) => timers.push(setTimeout(fn, ms))

    const finish = () => {
      if (done.current) return
      done.current = true
      timers.forEach(clearTimeout)
      cancelAnimationFrame(raf)
      glyphs.forEach((g, i) => { g.textContent = slots[i].dataset.final })
      anims.push(animate(el, { opacity: [1, 0], duration: 520, ease: 'out(2)', onComplete: () => onDone() }))
    }

    // 1 + 2 — every slot starts stacked on the centre of the name, then spreads out
    const nameBox = el.querySelector('.pl-name').getBoundingClientRect()
    const cx = nameBox.left + nameBox.width / 2
    const offsets = slots.map((s) => { const r = s.getBoundingClientRect(); return cx - (r.left + r.width / 2) })
    const centre = offsets.reduce((best, o, i) => (Math.abs(o) < Math.abs(offsets[best]) ? i : best), 0)
    slots.forEach((s, i) => { s.style.transform = `translateX(${offsets[i]}px)`; s.style.opacity = '0' })

    anims.push(animate(slots[centre], { opacity: [0, 1], scale: [0.4, 1], duration: 650, ease: 'outBack(2)' }))
    later(() => {
      slots.forEach((s, i) => { if (i !== centre) s.style.opacity = '1' })
      anims.push(animate(slots, {
        translateX: (_, i) => [offsets[i], 0],
        duration: 900, ease: 'outExpo', delay: stagger(40, { from: centre }),
      }))
    }, 750)

    // 3 — resolve one letter at a time, in random order (one rAF clock, so slow
    //     devices only stretch the sequence — they never skip or overlap steps)
    const order = slots.map((_, i) => i).sort(() => Math.random() - 0.5)
    const START = 1750, STEP = 240, FLICKER_MS = 300, TICK = 55
    let raf = 0, t0 = 0, landed = 0
    const state = slots.map(() => ({ last: -1, set: false }))
    const resolve = (now) => {
      if (done.current) return
      if (!t0) t0 = now
      const el2 = now - t0
      order.forEach((i, k) => {
        const st = state[i]
        if (st.set) return
        const local = el2 - k * STEP
        if (local < 0) return
        if (local >= FLICKER_MS) {
          st.set = true; landed++
          glyphs[i].textContent = slots[i].dataset.final
          slots[i].classList.add('is-set')
          anims.push(animate(slots[i], { scale: [1.18, 1], duration: 420, ease: 'outBack(3)' }))
          return
        }
        const tick = Math.floor(local / TICK)
        if (tick !== st.last) {
          st.last = tick
          let ch
          do { ch = GLYPHS[Math.floor(Math.random() * GLYPHS.length)] } while (ch === glyphs[i].textContent)
          glyphs[i].textContent = ch
        }
      })
      if (landed < slots.length) { raf = requestAnimationFrame(resolve); return }
      // 4 — line sweep, hold, lift away (timed from when the last letter actually landed)
      later(() => anims.push(animate(line, { scaleX: [0, 1], duration: 650, ease: 'inOut(3)' })), 250)
      later(() => {
        anims.push(animate(slots, { y: ['0%', '-115%'], opacity: [1, 0], duration: 520, ease: 'in(3)', delay: stagger(28) }))
        anims.push(animate(line, { scaleX: [1, 0], duration: 380, ease: 'in(2)' }))
      }, 1250)
      later(finish, 1850)
    }
    later(() => { raf = requestAnimationFrame(resolve) }, START)

    const skip = () => finish()
    window.addEventListener('keydown', skip)
    el.addEventListener('pointerdown', skip)
    return () => {
      timers.forEach(clearTimeout)
      cancelAnimationFrame(raf)
      anims.forEach((a) => a.pause?.())
      window.removeEventListener('keydown', skip)
      el.removeEventListener('pointerdown', skip)
    }
  }, [onDone])

  return (
    <div ref={root} className="preloader" aria-hidden="true">
      <div className="pl-name">
        {name.split('').map((ch, i) => (ch === ' '
          ? <span key={i} className="pl-l pl-sp">{' '}</span>
          : (
            <span key={i} className="pl-l" data-final={ch}>
              <span className="pl-sizer">{ch}</span>
              <span className="pl-g">{SEED}</span>
            </span>
          )))}
      </div>
      <span className="pl-line"><i /></span>
      <span className="pl-skip mono">click to skip</span>
    </div>
  )
}
