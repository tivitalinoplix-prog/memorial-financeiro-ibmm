import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/ThemeProvider';
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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: "bg-card border border-border text-text-primary font-sans rounded-none shadow-none text-[12px]",
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
