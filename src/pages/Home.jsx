import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { live, kick, snap } from '../lib/live'
import { load, save } from '../lib/persist'
import { revealPage, useGo } from '../lib/nav'
import { profile } from '../data/profile'
import Nav from './home/Nav'
import Hero from './home/Hero'
import Preloader from './home/Preloader'

const Below = lazy(() => import('./home/Below'))

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * HOME (route "/") — single page: mosaic-portrait hero, About, Skills,
 * Work, Contact. Leaving for the Hall / a project saves the scroll
 * position; coming back (Back button or "Return") restores it and skips
 * the intro.
 */
export default function Home() {
  const location = useLocation()
  const navType = useNavigationType()
  const go = useGo()
  const sections = useRef({})
  const pending = useRef(null) // scroll position waiting for the lazy sections
  const belowReady = useRef(false)
  const [phase, setPhase] = useState('wait') // hero DOM: wait → in → done
  const [intro, setIntro] = useState(false)
  const [active, setActive] = useState('home')
  const [scrolled, setScrolled] = useState(false)

  /* ---- mount / re-entry ---- */
  useLayoutEffect(() => {
    const saved = load('home')
    const resume = !!saved && (location.state?.resume || navType === 'POP')
    const H = live.hero
    if (resume || H.t >= 1) {
      // returning: everything already assembled
      H.requested = true; H.start = H.start || 1; H.t = 1
      setPhase('done'); setIntro(false)
      if (!resume) window.scrollTo(0, 0)
      else if (belowReady.current) restoreTo(saved.y) // sections already mounted (cached chunk)
      else pending.current = saved.y
    } else {
      window.scrollTo(0, 0)
      const first = !load('introSeen') && !reduced()
      setIntro(first)
      if (!first) startHero()
    }
    revealPage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key])

  const startHero = useCallback(() => {
    live.hero.requested = true
    kick(4500)
    setPhase('in')
  }, [])

  const introDone = useCallback(() => {
    save('introSeen', true)
    setIntro(false)
    startHero()
  }, [startHero])

  const restoreTo = useCallback((y) => {
    window.scrollTo(0, y)
    snap(200)
    document.fonts?.ready.then(() => window.scrollTo(0, y))
  }, [])

  // lazy sections mounted → apply any pending scroll restore
  const onBelowReady = useCallback(() => {
    belowReady.current = true
    if (pending.current == null) return
    const y = pending.current
    pending.current = null
    restoreTo(y)
  }, [restoreTo])

  /* ---- scroll: hero scatter, nav state, save position ---- */
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const y = window.scrollY, vh = window.innerHeight
      const p = Math.min(1.2, y / vh)
      live.hero.scatter = Math.min(1, Math.max(0, (p - 0.08) * 1.25))
      live.idleFps = p > 1.05 ? 0 : 30 // nothing to animate in the canvas once the hero is gone
      const heroEl = sections.current.home
      heroEl?.style.setProperty('--hp', p.toFixed(4))
      setScrolled(y > 24)
      if (live.route === 'story') save('home', { y }) // ignore scrolls caused by the next page
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    window.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll) }
  }, [])

  // active nav link = section crossing the middle of the viewport
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id) })
    }, { rootMargin: '-45% 0px -50% 0px' })
    const observe = () => Object.values(sections.current).forEach((el) => el && io.observe(el))
    observe()
    const t = setTimeout(observe, 600) // after the lazy sections arrive
    return () => { clearTimeout(t); io.disconnect() }
  }, [])

  // prefetch the Hall while the visitor reads
  useEffect(() => {
    const t = setTimeout(() => { import('./Hall'); import('../three/HallWorld') }, 4000)
    return () => clearTimeout(t)
  }, [])

  const sectionRef = useCallback((id) => (el) => { if (el) sections.current[id] = el }, [])
  const jump = useCallback((id) => {
    const el = sections.current[id] ?? document.getElementById(id)
    if (!el) return
    window.scrollTo({ top: id === 'home' ? 0 : el.offsetTop, behavior: reduced() ? 'auto' : 'smooth' })
  }, [])
  const leave = useCallback((to) => {
    save('home', { y: window.scrollY })
    go(to, { state: { from: 'home' } })
  }, [go])

  return (
    <main className="home">
      <Nav active={active} onJump={jump} onHall={() => leave('/hall')} scrolled={scrolled} hidden={phase === 'wait'} />
      <Hero ref={sectionRef('home')} phase={phase} onDown={() => jump('about')} onContact={() => jump('contact')} />
      <Suspense fallback={<div className="h-below-fallback" />}>
        <Below go={leave} onReady={onBelowReady} sectionRef={sectionRef} />
      </Suspense>
      {intro && <Preloader name={profile.name.toUpperCase()} onDone={introDone} />}
    </main>
  )
}
