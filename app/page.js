import HomepageClient from './HomepageClient'

export const metadata = {
  title: 'Dracnoir – Premium Anime Merch Store',
  description:
    'Shop premium anime merchandise: plushies, T-shirts, and action figures from Naruto, One Piece, Demon Slayer, Jujutsu Kaisen and more. Fast shipping across India.',
  keywords: [
    'anime merch',
    'anime t-shirts',
    'anime plushies',
    'action figures',
    'Naruto',
    'Demon Slayer',
    'Jujutsu Kaisen',
    'One Piece',
    'Dragon Ball',
    'anime store India',
    'buy anime merchandise',
  ],
  openGraph: {
    title: 'Dracnoir – Premium Anime Merch Store',
    description:
      'Premium anime merch: plushies, tees, and figures from your favourite series. Shop now.',
    url: 'https://dracnoir.com',
    siteName: 'Dracnoir',
    type: 'website',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dracnoir – Premium Anime Merch Store',
    description: 'Premium anime merchandise from Dracnoir. Plushies, tees & figures.',
  },
  alternates: {
    canonical: 'https://dracnoir.com',
  },
}

export default function Page() {
  return <HomepageClient />
}
