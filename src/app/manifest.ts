import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DokaniAI',
    short_name: 'DokaniAI',
    description: 'আপনার ব্যবসার বিশ্বস্ত AI সহকারী',
    start_url: '/login',
    display: 'standalone',
    background_color: '#f8faf6',
    theme_color: '#003727',
    orientation: 'portrait-primary',
    categories: ['business', 'finance', 'productivity'],
    icons: [
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      // PNG icons - generate from SVG using: npx pwa-asset-generator public/icons/icon.svg public/icons
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
