import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { readFileSync } from 'node:fs';

const contentDir = fileURLToPath(new URL('../content', import.meta.url));

// Escapes text for safe injection into an HTML attribute / element.
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Replaces %SEO_*% placeholders in index.html from content/site.json at build
// time (and on each dev request), so SEO/OG come from content — no runtime DOM.
function seoFromContent() {
  return {
    name: 'seo-from-content',
    transformIndexHtml(html) {
      let site = {};
      try {
        site = JSON.parse(readFileSync(`${contentDir}/site.json`, 'utf-8'));
      } catch {
        // missing/invalid content → leave placeholders; build must not break
      }
      return html
        .replaceAll('%SEO_TITLE%', esc(site.seoTitle))
        .replaceAll('%SEO_DESCRIPTION%', esc(site.seoDescription));
    },
  };
}

export default defineConfig({
  plugins: [react(), seoFromContent()],
  resolve: {
    alias: {
      '@content': contentDir,
    },
  },
  server: {
    port: 5173,
    fs: {
      // allow importing content/*.json from the repo root (one level up)
      allow: ['..'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
