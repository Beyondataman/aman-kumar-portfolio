import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `npm run dev`         -> local dev server (http://localhost:5173)
// `npm run build`       -> BrowserRouter build for a host with SPA fallback (Vercel/Netlify config included)
// `npm run build:hash`  -> HashRouter build with relative asset paths (any static host)
// `npm run build:file`  -> ONE self-contained HTML file (dist-file/index.html) that opens by
//                          double-click from Finder (file://). No code splitting in this mode.
// Every supported browser reads WOFF2, so drop the WOFF fallbacks from the self-hosted
// font CSS: they were never downloaded online, but the single-file build inlined both.
const woff2Only = () => ({
  name: 'woff2-only',
  enforce: 'pre',
  transform(code, id) {
    if (!id.includes('@fontsource') || !id.endsWith('.css')) return null
    return code.replace(/,\s*url\([^)]+\.woff\)\s*format\(['"]woff['"]\)/g, '')
  },
})

export default defineConfig(({ mode }) => {
  const file = mode === 'file'
  return {
    base: mode === 'hash' || file ? './' : '/',
    define: file ? { 'import.meta.env.MODE': JSON.stringify('hash') } : {},
    plugins: [woff2Only(), react(), ...(file ? [viteSingleFile()] : [])],
    build: {
      target: 'es2020',
      chunkSizeWarningLimit: 4000,
      // hosts that don't serve .glb (e.g. the claude.ai preview) get the models inlined
      ...(mode === 'hash' ? { assetsInlineLimit: (file) => (file.endsWith('.glb') ? true : undefined) } : {}),
      outDir: file ? 'dist-file' : mode === 'hash' ? 'dist-hash' : 'dist',
    },
  }
})
