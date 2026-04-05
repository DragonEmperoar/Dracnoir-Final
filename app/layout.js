import './globals.css'
import { Inter } from 'next/font/google'
import Providers from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  metadataBase: new URL('https://dracnoir.com'),
  title: {
    default: 'Dracnoir – Anime Merch Store',
    template: '%s | Dracnoir',
  },
  description:
    'Premium anime merchandise including plushies, t-shirts, and action figures from Naruto, One Piece, Demon Slayer and more.',
  keywords: ['anime merch', 'anime t-shirts', 'anime plushies', 'action figures', 'Naruto', 'Demon Slayer', 'Jujutsu Kaisen', 'One Piece', 'Dragon Ball', 'anime store India'],
  icons: {
    icon: 'https://res.cloudinary.com/dgklaf4bk/image/upload/v1775382215/New_Logo_Inverted_Background_owdt2k.webp',
    shortcut: 'https://res.cloudinary.com/dgklaf4bk/image/upload/v1775382215/New_Logo_Inverted_Background_owdt2k.webp',
    apple: 'https://res.cloudinary.com/dgklaf4bk/image/upload/v1775382215/New_Logo_Inverted_Background_owdt2k.webp',
  },
  openGraph: {
    title: 'Dracnoir – Anime Merch Store',
    description: 'Premium anime merch: plushies, tees, and figures from your favourite series.',
    siteName: 'Dracnoir',
    type: 'website',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dracnoir – Anime Merch Store',
    description: 'Premium anime merchandise from Dracnoir.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background text-foreground`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
