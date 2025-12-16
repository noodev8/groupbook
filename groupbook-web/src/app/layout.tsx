import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Kitchen Ready — Run group bookings like a pro',
    template: '%s | Kitchen Ready',
  },
  description: 'Stop chasing WhatsApp messages and scattered emails. Kitchen Ready gives restaurants one simple page per group booking — guests add themselves, you stay in control.',
  keywords: ['restaurant booking', 'group booking', 'restaurant management', 'guest list', 'pre-orders', 'food orders', 'private dining', 'event management'],
  authors: [{ name: 'noodev8' }],
  creator: 'noodev8',
  publisher: 'noodev8',
  metadataBase: new URL('https://kitchenready.app'),
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    siteName: 'Kitchen Ready',
    title: 'Kitchen Ready — Run group bookings like a pro',
    description: 'Stop chasing WhatsApp messages and scattered emails. Kitchen Ready gives restaurants one simple page per group booking — guests add themselves, you stay in control.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kitchen Ready — Run group bookings like a pro',
    description: 'Stop chasing WhatsApp messages and scattered emails. Kitchen Ready gives restaurants one simple page per group booking.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
