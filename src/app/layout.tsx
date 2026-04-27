import './globals.css';
import { Inter, Outfit } from 'next/font/google';
import { Sidebar } from '@/components/layout/sidebar';
import { AuthProvider } from '@/providers/auth-provider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata = {
  title: 'PromptAccreditation | Sovereign Dashboard',
  description: 'Autonomous Regulatory Compliance Governance for the Prompt App Suite',
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="bg-[#07080a] text-[#e2e8f4] font-sans antialiased selection:bg-blue-500/30">
        <AuthProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-hidden bg-[#07080a]">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
