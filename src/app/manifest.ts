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
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
