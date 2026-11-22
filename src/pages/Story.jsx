import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { useStore } from '../lib/store'
import { live, kick, snap } from '../lib/live'
import { load, save } from '../lib/persist'
import { revealPage, useGo } from '../lib/nav'
import { chapters } from '../data/profile'
import Origin from './story/Origin'
import Foundation from './story/Foundation'
import Exploration from './story/Exploration'
import Building from './story/Building'
import Portal from './story/Portal'
import Continuation from './story/Continuation'
import DeveloperEngine from './story/DeveloperEngine'
import Ending from './story/Ending'
import ChapterIndicator from '../components/ChapterIndicator'

/**
 * EXPERIENCE A — the personal story (route "/").
 * The scroll position is converted to a continuous chapter value
 * (live.story.c) that drives the 3D world. Leaving for the Hall or a
 * project saves {chapter, fraction}; coming back restores it exactly.
 */
export default function Story() {
  const location = useLocation()
  const navType = useNavigationType()
  const go = useGo()
  const sections = useRef([])
  const metrics = useRef([])
  const setChapter = useStore((s) => s.setChapter)

  const measure = useCallback(() => {
    metrics.current = sections.current.map((el) => ({ top: el.offsetTop, h: el.offsetHeight }))
  }, [])

  const position = useCallback(() => {
    const y = window.scrollY, vh = window.innerHeight
    const line = y + vh * 0.5
    const M = metrics.current
    let i = 0
    while (i < M.length - 1 && line >= M[i + 1].top) i++
    const frac = Math.min(1, Math.max(0, (line - M[i].top) / M[i].h))
    return { i, frac, y, vh }
  }, [])

  const update = useCallback(() => {
    if (!metrics.current.length) return
    const { i, frac, y, vh } = position()
    live.story.c = i + frac
    // per-section sticky progress for CSS (--p: 0 → 1 while the section is pinned)
    sections.current.forEach((el, j) => {
      const m = metrics.current[j]
      const p = (y - m.top) / Math.max(1, m.h - vh)
      el.style.setProperty('--p', Math.min(1.2, Math.max(-0.2, p)).toFixed(4))
    })
    if (useStore.getState().chapter !== i) setChapter(i)
    save('story', { chapter: i, frac })
  }, [position, setChapter])

  const restore = useCallback((saved) => {
    measure()
    const m = metrics.current[saved.chapter]
    if (!m) return
    const y = m.top + saved.frac * m.h - window.innerHeight * 0.5
    window.scrollTo(0, Math.max(0, y))
  }, [measure])

  // mount / re-entry: restore exact position or start fresh
  useLayoutEffect(() => {
    measure()
    const saved = load('story')
    const resume = !!saved && (location.state?.resume || navType === 'POP')
    live.story.dive = 0
    live.story.diveTarget = 0
    if (resume) {
      live.story.intro = 1
      restore(saved)
      snap(200)
    } else {
      window.scrollTo(0, 0)
      if (live.story.intro >= 1) snap(200)
    }
    update()
    revealPage()
    // web fonts can shift layout: re-measure and re-apply once they are ready
    document.fonts?.ready.then(() => {
      if (resume) restore(saved)
      measure(); update(); snap(120)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key])

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => { raf = 0; update() })
    }
    const onResize = () => { measure(); update() }
    const ro = new ResizeObserver(onResize)
    sections.current.forEach((el) => ro.observe(el))
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [measure, update])

  const ref = (i) => (el) => { if (el) sections.current[i] = el }

  /* ---- navigation out of the story (state is saved first) ---- */
  const enterHall = useCallback((opts) => {
    update()
    if (opts?.dive) {
      // fly through the portal ring first
      live.story.diveTarget = 1
      kick(2200)
      window.setTimeout(() => go('/hall', { state: { from: 'story' } }), 520)
    } else {
      go('/hall', { state: { from: 'story' } })
    }
  }, [go, update])

  const openProject = useCallback((id) => {
    update()
    go(`/projects/${id}`, { state: { from: 'story' } })
  }, [go, update])

  const jumpTo = useCallback((i) => {
    measure()
    const m = metrics.current[i]
    if (m) window.scrollTo({ top: m.top + (i === 0 ? 0 : 2), behavior: live.reducedMotion ? 'auto' : 'smooth' })
  }, [measure])

  // prefetch the Hall code while the visitor reads chapter 4
  const chapter = useStore((s) => s.chapter)
  useEffect(() => {
    if (chapter >= 3) {
      import('./Hall')
      import('../three/HallWorld')
    }
  }, [chapter])

  return (
    <main className="story">
      <header className="topbar">
        <button className="monogram" onClick={() => jumpTo(0)} aria-label="Back to the beginning">AK</button>
        <nav className="topbar-nav">
          <button className="link-quiet" onClick={() => openProject('tedxisme')}>Projects</button>
          <button className="btn btn--ghost btn--sm" onClick={() => enterHall()}>Analytics Hall ↗</button>
        </nav>
      </header>

      <Origin ref={ref(0)} />
      <Foundation ref={ref(1)} />
      <Exploration ref={ref(2)} />
      <Building ref={ref(3)} openProject={openProject} />
      <Portal ref={ref(4)} enterHall={enterHall} />
      <Continuation ref={ref(5)} />
      <DeveloperEngine ref={ref(6)} />
      <Ending ref={ref(7)} enterHall={enterHall} toTop={() => jumpTo(0)} />

      <ChapterIndicator chapters={chapters} onJump={jumpTo} />
    </main>
  )
}
