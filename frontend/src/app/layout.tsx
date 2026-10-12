import type { Metadata } from 'next';
import { Inter, Manrope } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/components/layout/AppProviders';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' });

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
    <html lang="en" className={`${inter.variable} ${manrope.variable} font-sans antialiased`}>
      <body className="min-h-screen bg-finroq-ivory text-finroq-text antialiased selection:bg-finroq-lime selection:text-finroq-forest">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}