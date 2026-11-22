import { useEffect, useMemo, useRef, useState } from 'react'
import { profile } from '../../data/profile'
import { mulberry32 } from '../../lib/random'

/** CHAPTER 1 — ORIGIN: the name is part of the architecture, lit selectively. */
export default function Origin({ ref }) {
  const [assembled, setAssembled] = useState(false)
  const stage = useRef()

  useEffect(() => {
    const t = setTimeout(() => setAssembled(true), 450)
    // selective illumination follows the pointer (CSS vars, no re-render)
    let raf = 0
    const onMove = (e) => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        stage.current?.style.setProperty('--lx', `${(e.clientX / window.innerWidth) * 100}%`)
        stage.current?.style.setProperty('--ly', `${(e.clientY / window.innerHeight) * 100}%`)
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    // fit the name to the viewport whatever the font metrics: widest word ≤ 92% of width,
    // two lines ≤ ~72% of height
    const fit = () => {
      const root = stage.current
      if (!root) return
      const words = [...root.querySelectorAll('.nm')]
      if (!words.length) return
      words.forEach((w) => { w.style.fontSize = '100px' })
      const widest = Math.max(...words.map((w) => w.offsetWidth))
      const byWidth = (100 * window.innerWidth * 0.86) / Math.max(1, widest)
      const byHeight = window.innerHeight * 0.36 / 0.8
      const size = Math.min(byWidth, byHeight)
      words.forEach((w) => { w.style.fontSize = `${size}px` })
    }
    fit()
    document.fonts?.ready.then(fit)
    window.addEventListener('resize', fit)
    return () => { clearTimeout(t); cancelAnimationFrame(raf); window.removeEventListener('pointermove', onMove); window.removeEventListener('resize', fit) }
  }, [])

  return (
    <section ref={ref} className="ch ch-origin" id="origin" aria-labelledby="origin-title">
      <div className="sticky" ref={stage}>
        <h1 id="origin-title" className="sr-only">{profile.name}</h1>
        <div className={`origin-name ${assembled ? 'is-in' : ''}`} aria-hidden="true">
          <Fragmented word={profile.first} className="nm nm-first" seed={3} />
          <Fragmented word={profile.last} className="nm nm-last" seed={11} />
        </div>
        <div className="origin-meta">
          <p className="kicker"><span className="mono">01</span> Origin</p>
          <p className="lede">{profile.tagline}</p>
        </div>
        <div className="origin-coords mono" aria-hidden="true">
          <span>12.9716° N</span><span>77.5946° E</span><span>ISME · BLR</span>
        </div>
        <div className="scroll-cue" aria-hidden="true"><span className="mono">scroll</span><i /></div>
      </div>
    </section>
  )
}

function Fragmented({ word, className, seed }) {
  const letters = useMemo(() => {
    const r = mulberry32(seed)
    return word.split('').map((ch) => ({ ch, dx: (r() - 0.5) * 60, dy: (r() - 0.5) * 50, rot: (r() - 0.5) * 30, d: r() * 0.6 }))
  }, [word, seed])
  return (
    <span className={className}>
      {letters.map((l, i) => (
        <span key={i} className="frag" style={{ '--dx': `${l.dx}vw`, '--dy': `${l.dy}vh`, '--rot': `${l.rot}deg`, '--d': `${l.d}s` }}>
          {l.ch}
        </span>
      ))}
    </span>
  )
}
