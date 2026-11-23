import { create } from 'zustand'
import { initialTier } from './quality'

/** React-visible app state (low frequency). */
export const useStore = create((set) => ({
  route: 'story',
  setRoute: (route) => set({ route }),

  // quality tier (adaptive); baseTier is the device guess at start
  tier: initialTier(),
  baseTier: initialTier(),
  setTier: (tier) => set({ tier }),

  // which 3D worlds have been loaded (kept mounted afterwards → no re-creation on re-entry)
  worlds: { hall: false, workspace: false },
  loadWorld: (name) => set((s) => (s.worlds[name] ? s : { worlds: { ...s.worlds, [name]: true } })),

  // workspace backdrop: the company's revenue columns
  wsBars: [],
  setWsBars: (wsBars) => set({ wsBars }),

  // transition veil
  veil: false,
  setVeil: (veil) => set({ veil }),
}))
