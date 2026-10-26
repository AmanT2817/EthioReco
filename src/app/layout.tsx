import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Anton, Noto_Sans_Ethiopic, Noto_Serif_Ethiopic } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

// For Amharic typography — primary typographic treatment on Ethiopian content
const notoSansEthiopic = Noto_Sans_Ethiopic({
  variable: "--font-noto-sans",
  subsets: ["ethiopic"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const notoSerifEthiopic = Noto_Serif_Ethiopic({
  variable: "--font-noto-ethiopic",
  subsets: ["ethiopic"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EthioReco — Discover what fits you",
  description:
    "Movies, music, and books — one discovery engine. Built with Ethiopian cultural relevance. A cinematic recommendation platform with a hybrid AI engine.",
  keywords: [
    "EthioReco", "recommendation", "Ethiopian content", "Amharic",
    "Tizita", "discovery", "movies", "music", "books", "hybrid AI",
  ],
  authors: [{ name: "EthioReco Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "EthioReco — Discover what fits you",
    description: "Movies, music, and books — one discovery engine. Built with Ethiopian cultural relevance.",
    siteName: "EthioReco",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EthioReco",
    description: "Discover what fits you.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${anton.variable} ${notoSansEthiopic.variable} ${notoSerifEthiopic.variable} antialiased film-grain`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
