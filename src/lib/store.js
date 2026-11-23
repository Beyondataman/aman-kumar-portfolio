import { create } from 'zustand'
import { initialTier } from './quality'

/** React-visible app state (low frequency). */
export const useStore = create((set) => ({
  route: 'story',
  setRoute: (route) => set({ route }),

  // quality tier — `envCount` is fixed at start so instanced meshes are never rebuilt
  tier: initialTier(),
  baseTier: initialTier(),
  setTier: (tier) => set({ tier }),

  // which 3D worlds have been loaded (kept mounted afterwards → no re-creation on re-entry)
  worlds: { hall: false, workspace: false },
  loadWorld: (name) => set((s) => (s.worlds[name] ? s : { worlds: { ...s.worlds, [name]: true } })),

  // story chapter for the indicator
  chapter: 0,
  setChapter: (chapter) => set({ chapter }),

  // workspace backdrop: the company's revenue columns
  wsBars: [],
  setWsBars: (wsBars) => set({ wsBars }),

  // transition veil
  veil: false,
  setVeil: (veil) => set({ veil }),
}))
