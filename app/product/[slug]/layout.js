// Server component — exports generateMetadata for product pages
// The 'use client' page.js still works because this layout wraps it

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://dracnoir.com'
const CANONICAL_BASE = 'https://dracnoir.com'

export async function generateMetadata({ params }) {
  try {
    const res = await fetch(`${SITE_URL}/api/products/${params.slug}`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) throw new Error('not found')
    const product = await res.json()

    const title = `${product.title} | Dracnoir Anime Merch`
    const description =
      product.description ||
      `Buy ${product.title} – premium anime merchandise from Dracnoir.`
    const image = product.images?.[0] || ''

    return {
      title,
      description,
      alternates: {
        canonical: `${CANONICAL_BASE}/product/${product.slug}`,
      },
      openGraph: {
        title: product.title,
        description,
        images: image ? [{ url: image, alt: `${product.title} anime merchandise` }] : [],
        type: 'website',
        siteName: 'Dracnoir',
      },
      twitter: {
        card: 'summary_large_image',
        title: product.title,
        description,
        images: image ? [image] : [],
      },
    }
  } catch {
    return {
      title: 'Product | Dracnoir Anime Merch',
      description: 'Premium anime merchandise from Dracnoir.',
    }
  }
}

export default function ProductLayout({ children }) {
  return children
}
