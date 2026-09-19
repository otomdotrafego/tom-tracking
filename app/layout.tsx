import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tom Tracking",
  description: "Rastreamento de conversões para negócio local",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css"
        />
      </head>
      <body className={inter.className}>
        <Sidebar />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            height: "100vh",
          }}
        >
          {children}
        </div>
      </body>
    </html>
  );
}
