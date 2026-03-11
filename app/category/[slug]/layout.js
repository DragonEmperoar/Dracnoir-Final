// Server component — exports generateMetadata for category pages

const CANONICAL_BASE = 'https://dracnoir.com'

const CATEGORY_META = {
  plushes: {
    title: 'Anime Plushies & Plush Toys',
    description:
      'Shop premium anime plushies from Naruto, Jujutsu Kaisen, Demon Slayer, Dragon Ball and more. Super-soft chibi collectibles.',
  },
  't-shirts': {
    title: 'Anime T-Shirts & Oversized Tees',
    description:
      'Bold anime print t-shirts and oversized tees from Dracnoir. Featuring Naruto, One Piece, Attack on Titan, and more.',
  },
  'action-figures': {
    title: 'Anime Action Figures & Collectibles',
    description:
      'Dynamic anime action figures with premium sculpts. Collectibles from Jujutsu Kaisen, Demon Slayer, Dragon Ball and more.',
  },
}

function toTitleCase(slug) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export async function generateMetadata({ params }) {
  const slug = params.slug
  const meta = CATEGORY_META[slug]

  const title = meta
    ? `${meta.title} | Dracnoir`
    : `${toTitleCase(slug)} | Dracnoir Anime Merch`

  const description = meta
    ? meta.description
    : `Shop premium anime ${toTitleCase(slug).toLowerCase()} including Naruto, Jujutsu Kaisen, Demon Slayer and more.`

  return {
    title,
    description,
    alternates: {
      canonical: `${CANONICAL_BASE}/category/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'Dracnoir',
    },
  }
}

export default function CategoryLayout({ children }) {
  return children
}
