import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Memorial Financeiro — Sistema Operacional',
  description: 'Automação, Auditoria e Inteligência Financeira da Igreja Batista Memorial',
  keywords: ['financeiro', 'igreja', 'memorial', 'auditoria', 'notas fiscais'],
  openGraph: {
    title: 'Memorial Financeiro — Sistema Operacional',
    description: 'Plataforma de gestão financeira integrada',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="font-sans bg-background text-text-primary antialiased min-h-screen overflow-x-hidden">
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#141416',
              border: '1px solid #27272a',
              color: '#fafafa',
              fontSize: '13px',
            },
          }}
        />
      </body>
    </html>
  );
}
