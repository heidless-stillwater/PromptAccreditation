import type { Metadata } from 'next';
import { Geist, Geist_Mono, Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/sidebar';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
const inter = Inter({ variable: '--font-inter', subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'PromptAccreditation | Active Policy Controller',
    template: '%s | PromptAccreditation',
  },
  description:
    'Governance, monitoring, and compliance auditing for the Prompt App Suite. Manage Online Safety Act, UK GDPR, and Security policies.',
  keywords: ['compliance', 'policy', 'governance', 'online safety', 'GDPR', 'security'],
};

import { AuthProvider } from '@/providers/auth-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} h-full flex antialiased`}
        style={{ background: 'var(--color-background)', color: 'var(--foreground)' }}
      >
        <AuthProvider>
          <Sidebar />
          <div className="flex-1 h-full overflow-y-auto relative">
            {/* Ambient glow layers */}
            <div
              className="pointer-events-none fixed top-0 right-0 w-1/3 h-1/3 opacity-40"
              style={{ background: 'radial-gradient(ellipse at top right, rgba(59,130,246,0.08) 0%, transparent 70%)' }}
            />
            <div
              className="pointer-events-none fixed bottom-0 left-1/4 w-1/3 h-1/3 opacity-30"
              style={{ background: 'radial-gradient(ellipse at bottom left, rgba(16,185,129,0.06) 0%, transparent 70%)' }}
            />
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
