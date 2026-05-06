import './globals.css';
// import { Inter, Outfit } from 'next/font/google';
import { Sidebar } from '@/components/layout/sidebar';
import { AuthProvider } from '@/providers/auth-provider';

// Temporary system font fallbacks to bypass build-time network failures
const inter = { variable: 'font-inter', className: 'font-inter' };
const outfit = { variable: 'font-outfit', className: 'font-outfit' };

/*
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
*/

export const metadata = {
  title: 'PromptAccreditation | Sovereign Dashboard',
  description: 'Autonomous Regulatory Compliance Governance for the Prompt App Suite',
};



export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="bg-[#0f172a] text-[#e2e8f4] font-sans antialiased selection:bg-blue-500/30">
        <AuthProvider>
          <div className="flex h-screen overflow-hidden bg-[#0f172a]">
            <Sidebar />
            <main className="flex-1 overflow-y-auto scroll-smooth">
              {children}
            </main>
          </div>

        </AuthProvider>
      </body>
    </html>
  );
}
