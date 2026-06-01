import './globals.css';
import type { Metadata } from 'next';
import Providers from './providers';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'PlugFácil - Simulador Financeiro',
  description: 'Simulador financeiro para franquias PlugFácil de recarga de veículos elétricos',
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: 'PlugFácil - Simulador Financeiro',
    description: 'Simulador financeiro para franquias PlugFácil de recarga de veículos elétricos',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="bg-gray-50 text-gray-900 antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
