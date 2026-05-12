import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Memorial Financeiro — Sistema Operacional v5.0',
  description: 'Automação, Auditoria e Inteligência Financeira da Igreja Batista Memorial',
  keywords: ['financeiro', 'igreja', 'memorial', 'auditoria', 'notas fiscais', 'automação'],
  openGraph: {
    title: 'Memorial Financeiro — Sistema Operacional v5.0',
    description: 'Plataforma de gestão financeira integrada — IBMM',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html 
      lang="pt-BR" 
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${jetbrainsMono.variable}`} 
      suppressHydrationWarning
    >
      <body className="font-sans bg-background text-text-primary antialiased min-h-screen overflow-x-hidden">
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1c1c22',
              border: '1px solid #27272a',
              color: '#fafafa',
              fontSize: '12px',
              fontFamily: 'var(--font-sans)',
              borderRadius: '0px',
            },
          }}
        />
      </body>
    </html>
  );
}
