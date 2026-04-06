import type { Metadata, Viewport } from 'next';
import './globals.css';
import { StoreProvider } from '@/context/StoreContext';

export const metadata: Metadata = {
  title: 'Threadboard — Daily Wordle Board',
  description: 'Your group chat already has the game. We make the show. Tap your score, see the rankings, share the Board.',
  openGraph: {
    title: 'Threadboard — Daily Wordle Board',
    description: 'Tap your Wordle score. See the rankings. Share the Board with your group.',
    type: 'website',
    url: 'https://threadboard.vercel.app',
  },
  twitter: {
    card: 'summary',
    title: 'Threadboard',
    description: 'Small ESPN for your Wordle group. Tap score → see board → share.',
  },
  keywords: ['wordle', 'wordle score', 'wordle tracker', 'wordle group', 'daily puzzle'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#09090b',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
