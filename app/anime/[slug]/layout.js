// Server component — SEO metadata for anime universe pages

const CANONICAL_BASE = 'https://dracnoir.com'

const ANIME_META = {
  naruto: {
    name: 'Naruto',
    keywords: 'Naruto merch, Naruto t-shirts, Naruto plush, Naruto figures, Naruto Shippuden merchandise',
    description:
      'Shop Naruto anime merchandise including t-shirts, plush toys, and action figures. Naruto, Sasuke, Kakashi and more at Dracnoir.',
  },
  'jujutsu-kaisen': {
    name: 'Jujutsu Kaisen',
    keywords: 'Jujutsu Kaisen merch, JJK t-shirts, Gojo plush, Yuji Itadori figures',
    description:
      'Shop Jujutsu Kaisen anime merchandise. T-shirts, plushies and figures of Gojo, Yuji, Megumi and more.',
  },
  'attack-on-titan': {
    name: 'Attack on Titan',
    keywords: 'Attack on Titan merch, AOT t-shirts, Eren Yeager, Levi figures',
    description:
      'Shop Attack on Titan merchandise at Dracnoir. Tees, plushies and collectibles from the iconic series.',
  },
  'demon-slayer': {
    name: 'Demon Slayer',
    keywords: 'Demon Slayer merch, Kimetsu no Yaiba, Tanjiro t-shirt, Nezuko plush',
    description:
      'Shop Demon Slayer anime merchandise. Tanjiro, Nezuko, Zenitsu and Inosuke collectibles, tees and plushies.',
  },
  'dragon-ball': {
    name: 'Dragon Ball',
    keywords: 'Dragon Ball merch, Goku t-shirt, Dragon Ball Z figures, Vegeta plush',
    description:
      'Shop Dragon Ball Z anime merchandise at Dracnoir. Goku, Vegeta, Gohan and more — figures, tees and plush.',
  },
  'one-piece': {
    name: 'One Piece',
    keywords: 'One Piece merch, Luffy t-shirt, Zoro plush, One Piece figures',
    description:
      'Shop One Piece anime merchandise. Luffy, Zoro, Nami and the Straw Hat crew — tees, figures and plushies.',
  },
}

function toDisplayName(slug) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export async function generateMetadata({ params }) {
  const slug = params.slug
  const meta = ANIME_META[slug]
  const name = meta?.name || toDisplayName(slug)

  return {
    title: `${name} Anime Merch | Dracnoir`,
    description:
      meta?.description ||
      `Shop ${name} anime merchandise including t-shirts, plush toys and action figures at Dracnoir.`,
    keywords: meta?.keywords || `${name} merch, ${name} anime, ${name} t-shirts`,
    alternates: {
      canonical: `${CANONICAL_BASE}/anime/${slug}`,
    },
    openGraph: {
      title: `${name} Anime Merch | Dracnoir`,
      description:
        meta?.description ||
        `Shop ${name} anime merchandise including t-shirts, plush toys and action figures.`,
      type: 'website',
      siteName: 'Dracnoir',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} Anime Merch | Dracnoir`,
      description: `Shop ${name} anime merch at Dracnoir.`,
    },
  }
}

export default function AnimeLayout({ children }) {
  return children
}
