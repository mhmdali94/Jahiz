import { defineConfig } from 'vite';

// Static, no-backend build: everything is bundled at build time so dist/
// can be dropped into a CyberPanel public_html folder as plain files.
export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    // Ed25519 tokens live in the URL hash, never sent to a server anyway —
    // no proxy/backend needed even in dev.
    port: 5173,
  },
});
