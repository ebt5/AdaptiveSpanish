import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Adaptive Spanish',
  description: 'Type the Spanish. Earn your way up.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
