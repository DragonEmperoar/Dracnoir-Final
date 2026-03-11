export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin-login',
          '/api/',
          '/checkout',
          '/profile',
          '/orders',
          '/*?*',
        ],
      },
    ],
    sitemap: 'https://dracnoir.com/sitemap.xml',
    host: 'https://dracnoir.com',
  }
}
