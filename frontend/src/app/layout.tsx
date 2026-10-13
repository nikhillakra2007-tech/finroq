import type { Metadata } from 'next';
import { Bricolage_Grotesque, Hanken_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/components/layout/AppProviders';
import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider';

const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const hanken = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'FINROQ — Personal Finance & Wealth Architecture',
  description: 'Precision personal finance, budgeting, recurring expense management, and net worth tracking.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${bricolage.variable} ${hanken.variable} ${jetbrains.variable} font-sans antialiased scroll-smooth`}>
      <body className="min-h-screen bg-finroq-ivory text-finroq-text antialiased selection:bg-finroq-lime selection:text-finroq-forest">
        <SmoothScrollProvider>
          <AppProviders>{children}</AppProviders>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}