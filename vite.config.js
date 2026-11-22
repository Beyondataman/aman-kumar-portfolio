import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `npm run dev`         -> local dev server (http://localhost:5173)
// `npm run build`       -> BrowserRouter build for a host with SPA fallback (Vercel/Netlify config included)
// `npm run build:hash`  -> HashRouter build with relative asset paths (any static host)
// `npm run build:file`  -> ONE self-contained HTML file (dist-file/index.html) that opens by
//                          double-click from Finder (file://). No code splitting in this mode.
export default defineConfig(({ mode }) => {
  const file = mode === 'file'
  return {
    base: mode === 'hash' || file ? './' : '/',
    define: file ? { 'import.meta.env.MODE': JSON.stringify('hash') } : {},
    plugins: [react(), ...(file ? [viteSingleFile()] : [])],
    build: {
      target: 'es2020',
      chunkSizeWarningLimit: 4000,
      // hosts that don't serve .glb (e.g. the claude.ai preview) get the models inlined
      ...(mode === 'hash' ? { assetsInlineLimit: (file) => (file.endsWith('.glb') ? true : undefined) } : {}),
      outDir: file ? 'dist-file' : mode === 'hash' ? 'dist-hash' : 'dist',
    },
  }
})
