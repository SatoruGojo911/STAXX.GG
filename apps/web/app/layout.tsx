import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const redaction35 = localFont({
  src: [
    {
      path: "../public/fonts/Redaction35-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Redaction35-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/Redaction35-Italic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-redaction",
  display: "swap",
});

export const metadata: Metadata = {
  title: "staxx.gg — Pokémon Higher or Lower & Guesser",
  description:
    "Compare Pokémon stats and guess Pokémon by silhouette. Build streaks, unlock evolving auras, and climb global leaderboards. PLAY. GUESS. STAXX.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${redaction35.variable} font-redaction antialiased h-full`}>
      <body className="flex min-h-screen flex-col bg-background text-foreground font-redaction selection:bg-primary/20 selection:text-primary transition-colors duration-200">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          <Header />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
