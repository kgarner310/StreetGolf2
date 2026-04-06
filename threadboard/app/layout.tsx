import type { Metadata, Viewport } from 'next';
import './globals.css';
import { StoreProvider } from '@/context/StoreContext';

export const metadata: Metadata = {
  title: 'Threadboard',
  description: 'Your group chat already has the game. We make the show.',
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
