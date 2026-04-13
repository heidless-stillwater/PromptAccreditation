import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Prompt Accreditation | Active Policy Controller",
  description: "Governance, monitoring, and compliance auditing for the Prompt App Suite.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className={`${geistSans.variable} ${geistMono.variable} h-full flex bg-background text-white`}>
        <Sidebar export />
        <main className="flex-1 h-full overflow-y-auto relative">
          {children}
          {/* Global Ambient Glow */}
          <div className="absolute top-0 right-0 w-1/3 h-1/4 bg-primary/5 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-1/4 h-1/3 bg-success/5 blur-[120px] pointer-events-none" />
        </main>
      </body>
    </html>
  );
}
