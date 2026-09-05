import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/api/'],
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: '/dashboard/',
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: '/dashboard/',
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: '/dashboard/',
      },
    ],
    sitemap: 'https://edukoo.africa/sitemap.xml',
  }
}
