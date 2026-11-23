import { useEffect, useRef } from 'react'
import { animate, createTimeline, stagger } from 'animejs'

/**
 * First-visit intro: the name's letters drop in and settle with a bounce,
 * a short line sweeps under them, then everything lifts away to reveal the
 * hero. Click / any key skips it. Shown once per browser session.
 */
export default function Preloader({ name, onDone }) {
  const root = useRef(null)
  const done = useRef(false)

  useEffect(() => {
    const el = root.current
    const letters = el.querySelectorAll('.pl-l')
    const line = el.querySelector('.pl-line i')
    const finish = () => {
      if (done.current) return
      done.current = true
      animate(el, { opacity: [1, 0], duration: 520, ease: 'out(2)', onComplete: () => onDone() })
    }
    const tl = createTimeline({ defaults: { ease: 'outBounce' }, onComplete: finish })
    tl.add(letters, {
      y: ['-110vh', '0vh'],
      rotate: { from: () => (Math.random() - 0.5) * 70, to: 0 },
      duration: 1100,
      delay: stagger(70, { from: 'random' }),
    })
      .add(line, { scaleX: [0, 1], duration: 650, ease: 'inOut(3)' }, '-=350')
      .add(letters, { y: ['0%', '-115%'], opacity: [1, 0], duration: 520, ease: 'in(3)', delay: stagger(28) }, '+=380')
      .add(line, { scaleX: [1, 0], duration: 380, ease: 'in(2)' }, '<<')

    const skip = () => { tl.pause(); finish() }
    window.addEventListener('keydown', skip)
    el.addEventListener('pointerdown', skip)
    return () => {
      tl.pause()
      window.removeEventListener('keydown', skip)
      el.removeEventListener('pointerdown', skip)
    }
  }, [onDone])

  return (
    <div ref={root} className="preloader" aria-hidden="true">
      <div className="pl-name">
        {name.split('').map((ch, i) => (
          <span key={i} className={`pl-l ${ch === ' ' ? 'pl-sp' : ''}`}>{ch === ' ' ? ' ' : ch}</span>
        ))}
      </div>
      <span className="pl-line"><i /></span>
      <span className="pl-skip mono">click to skip</span>
    </div>
  )
}
