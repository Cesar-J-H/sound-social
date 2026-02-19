import type { Metadata } from 'next';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import Navbar from './components/layout/Navbar';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '700', '900'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500', '600'],
});

export const metadata: Metadata = {
  title: { default: 'Sound Social', template: '%s · Sound Social' },
  description: 'Rate, review, and discover music.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="bg-cream text-zinc-900 font-body antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}