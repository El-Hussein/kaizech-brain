import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kaizech Brain | Self-Learning AI Agents for WhatsApp, Web & Enterprise",
  description: "Deploy omnichannel AI agents on WhatsApp, Web, and mobile in minutes. Features self-learning RAG pipelines, concierge WhatsApp setup, and multi-tenant isolation.",
  keywords: ["WhatsApp AI Chatbot", "Self-Learning AI Agent", "Omnichannel Customer Support AI", "WhatsApp Business API Automation", "Enterprise RAG Agent"],
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
