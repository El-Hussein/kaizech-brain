import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kaizech Brain | Multi-tenant AI Agent Platform",
  description: "Empower your business with Agentic AI. Deploy custom agents, RAG pipelines, and intelligent widgets in minutes.",
  keywords: ["AI Agent Platform", "Multi-tenant AI", "Enterprise Knowledge RAG", "Custom AI Widgets", "Automated Customer Support"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
