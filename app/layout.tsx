import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Schikking Digest',
  description: 'Recente uitspraken over schikken en minnelijke regelingen',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body className="bg-brand-bg text-brand-darkgray antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
