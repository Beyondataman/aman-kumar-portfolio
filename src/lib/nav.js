import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from './store'
import { kick } from './live'

/**
 * Cinematic navigation: fade a veil in, navigate, the destination fades it out
 * once it has restored its own state. Browser back/forward bypasses the veil
 * and still restores state (handled by each page).
 */
export function useGo() {
  const navigate = useNavigate()
  return useCallback(
    (to, opts = {}, delay = 320) => {
      useStore.getState().setVeil(true)
      kick(2000)
      window.setTimeout(() => navigate(to, opts), delay)
    },
    [navigate]
  )
}

/** history.back() with the same veil — used when the destination is the previous entry. */
export function useBack() {
  const navigate = useNavigate()
  return useCallback(
    (delay = 320) => {
      useStore.getState().setVeil(true)
      kick(2000)
      window.setTimeout(() => navigate(-1), delay)
    },
    [navigate]
  )
}

/** Call from a page once it has restored scroll/state. */
export function revealPage() {
  requestAnimationFrame(() => requestAnimationFrame(() => useStore.getState().setVeil(false)))
}
