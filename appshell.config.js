import { defineAppShellConfig } from 'fzl-fund-appshell--lit/config'

export default defineAppShellConfig({
  title: 'Leitor da LDB',
  storagePrefix: 'leitordaldb',
  accessibility: {
    fonts: ['atkinson', 'opendyslexic'],
    themes: ['light', 'dark', 'high-contrast-light', 'high-contrast-dark'],
    textScale: { min: 1, max: 2 },
    defaults: { font: 'system', theme: 'system', textScale: 1 },
  },
  analytics: {
    requireConsent: true,
  },
  base: '/leitordaldb/',
  includeAssets: ['favicon.svg', 'gepis-logo.png'],
  manifest: {
    name: 'Leitor da LDB — Lei de Diretrizes e Bases da Educação Nacional',
    short_name: 'Leitor da LDB',
    description: 'Ambiente acessível de leitura, busca, estudo e referência da LDB (Lei nº 9.394/1996) — GEPIS/Unesp',
    lang: 'pt-BR',
    start_url: '.',
    display: 'standalone',
    background_color: '#fffbfe',
    theme_color: '#1f3a5f',
    icons: [
      { src: 'icons/icon-48.png', sizes: '48x48', type: 'image/png' },
      { src: 'icons/icon-72.png', sizes: '72x72', type: 'image/png' },
      { src: 'icons/icon-96.png', sizes: '96x96', type: 'image/png' },
      { src: 'icons/icon-128.png', sizes: '128x128', type: 'image/png' },
      { src: 'icons/icon-144.png', sizes: '144x144', type: 'image/png' },
      { src: 'icons/icon-152.png', sizes: '152x152', type: 'image/png' },
      { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icons/icon-384.png', sizes: '384x384', type: 'image/png' },
      { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,svg,png,ico,json,webmanifest,woff2}'],
    maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
  },
})
