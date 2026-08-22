import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '岛屿人格测试',
    short_name: '岛屿',
    description: '你的选择会把你带到岛屿的不同角落——先遇见回答，再遇见人。',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0e1420',
    theme_color: '#0e1420',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  }
}
