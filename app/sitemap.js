const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://dracnoir.com'

const ANIME_SLUGS = [
  'naruto',
  'jujutsu-kaisen',
  'attack-on-titan',
  'demon-slayer',
  'dragon-ball',
  'one-piece',
]

export default async function sitemap() {
  const staticRoutes = [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/category/plushes`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/category/t-shirts`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/category/action-figures`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },

    ...ANIME_SLUGS.map((slug) => ({
      url: `${SITE_URL}/anime/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.75,
    })),
  ]

  try {
    const res = await fetch(`${SITE_URL}/api/products?limit=1000`, {
      next: { revalidate: 3600 },
      cache: 'no-store',
    })

    if (!res.ok) return staticRoutes

    const data = await res.json()
    const products = data?.items || []

    const productRoutes = products.map((p) => ({
      url: `${SITE_URL}/product/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    return [...staticRoutes, ...productRoutes]
  } catch {
    return staticRoutes
  }
}
