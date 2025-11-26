import './globals.css'
import { Inter } from 'next/font/google'
import Providers from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Dracnoir – Anime Merch Store',
  description: 'Dracnoir: anime-themed e-commerce store for plushes, tees, and action figures.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-screen bg-background text-foreground`}>
        <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
          <Providers>
            <main className="flex-1">{children}</main>
            <footer className="border-t border-slate-800/80 bg-slate-950/80 text-xs text-slate-400">
              <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-4 sm:flex-row">
                <span>© {new Date().getFullYear()} Dracnoir. All rights reserved.</span>
                <div className="flex flex-wrap items-center gap-3">
                  <button className="hover:text-slate-200" type="button">
                    Terms
                  </button>
                  <span className="h-3 w-px bg-slate-700" />
                  <button className="hover:text-slate-200" type="button">
                    Privacy
                  </button>
                  <span className="h-3 w-px bg-slate-700" />
                  <span className="text-slate-500">Built for anime collectors.</span>
                </div>
              </div>
            </footer>
          </Providers>
        </div>
      </body>
    </html>
  )
}
