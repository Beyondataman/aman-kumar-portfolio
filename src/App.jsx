import { Suspense, lazy, useEffect, useLayoutEffect, useMemo } from 'react'
import { BrowserRouter, HashRouter, Route, Routes, useLocation, Link } from 'react-router-dom'
import { useStore } from './lib/store'
import { live, kick } from './lib/live'
import { webglAvailable } from './lib/quality'
import Story from './pages/Story'

// Route-level code splitting: only the story ships in the first bundle.
const Stage = lazy(() => import('./three/Stage'))
const Hall = lazy(() => import('./pages/Hall'))
const Workspace = lazy(() => import('./pages/Workspace'))
const Project = lazy(() => import('./pages/Project'))
const Templates = lazy(() => import('./pages/Templates'))

const Router = import.meta.env.MODE === 'hash' ? HashRouter : BrowserRouter

export default function App() {
  return (
    <Router>
      <Shell />
    </Router>
  )
}

const IDLE_FPS = { story: 30, hall: 30, workspace: 0, project: 0, templates: 0, other: 0 }

function routeOf(path) {
  if (path === '/' || path === '') return 'story'
  if (path.startsWith('/hall')) return 'hall'
  if (path.startsWith('/workspace')) return 'workspace'
  if (path.startsWith('/projects')) return 'project'
  if (path.startsWith('/templates')) return 'templates'
  return 'other'
}

function Shell() {
  const location = useLocation()
  const route = routeOf(location.pathname)
  const setRoute = useStore((s) => s.setRoute)
  const loadWorld = useStore((s) => s.loadWorld)
  const webgl = useMemo(() => webglAvailable(), [])

  useLayoutEffect(() => {
    live.route = route
    live.idleFps = IDLE_FPS[route] ?? 0
    setRoute(route)
    if (route === 'hall') loadWorld('hall')
    if (route === 'workspace') loadWorld('workspace')
    document.body.dataset.route = route
    document.body.style.cursor = ''
    kick(1800)
  }, [route, setRoute, loadWorld])

  // global input → render activity + pointer for parallax
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const setRM = () => { live.reducedMotion = mq.matches }
    setRM()
    mq.addEventListener?.('change', setRM)
    const onMove = (e) => {
      live.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      live.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
      kick(700)
    }
    const onScroll = () => kick(900)
    const onResize = () => kick(1200)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      mq.removeEventListener?.('change', setRM)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <>
      {webgl ? (
        <Suspense fallback={null}>
          <Stage />
        </Suspense>
      ) : (
        <div className="stage stage-fallback" aria-hidden="true" />
      )}
      <div className="atmos" aria-hidden="true" />
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/" element={<Story />} />
          <Route path="/hall" element={<Hall />} />
          <Route path="/workspace/:companyId" element={<Workspace />} />
          <Route path="/projects/:projectId" element={<Project />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Veil />
    </>
  )
}

function Veil() {
  const veil = useStore((s) => s.veil)
  return <div className={`veil ${veil ? 'veil--on' : ''}`} aria-hidden="true" />
}

function RouteLoading() {
  return (
    <div className="route-loading" role="status">
      <span className="mono">loading…</span>
    </div>
  )
}

function NotFound() {
  useEffect(() => { useStore.getState().setVeil(false) }, [])
  return (
    <main className="page page--center">
      <p className="mono muted">404 — path not found</p>
      <h1 className="display-m">This room doesn’t exist.</h1>
      <Link className="btn" to="/" state={{ resume: true }}>Return to Story</Link>
    </main>
  )
}
