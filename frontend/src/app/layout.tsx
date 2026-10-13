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
    <html lang="en" className={`${bricolage.variable} ${hanken.variable} ${jetbrains.variable} font-sans antialiased scroll-smooth`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('finroq_theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.setAttribute('data-theme','dark')}else{document.documentElement.setAttribute('data-theme','light')}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen antialiased" style={{ background: 'var(--bg)', color: 'var(--ink)' }}>
        <SmoothScrollProvider>
          <AppProviders>{children}</AppProviders>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}