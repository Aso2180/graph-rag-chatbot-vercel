import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI使用上の法的リスク分析 GraphRAG Chatbot for GAIS",
  description: "生成AI協会会員向け法的リスク検討支援システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
