import type { Metadata } from "next";
import { Toaster } from "sonner";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Assistant - AIで仕事を加速",
  description:
    "高度なAIアシスタントで、調査・分析・文章作成を効率化。チームで共有できるナレッジベースも構築できます。",
  keywords: ["AI", "アシスタント", "チャット", "SaaS", "Mastra", "OpenAI"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <NuqsAdapter>{children}</NuqsAdapter>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
