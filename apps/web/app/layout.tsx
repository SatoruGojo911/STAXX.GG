import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "staxx.gg — Pokémon Higher or Lower",
  description:
    "Compare Pokémon stats, build your streak, unlock evolving auras, and climb the global leaderboards. PLAY. GUESS. STAXX.",
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
    <html lang="en" suppressHydrationWarning className="font-redaction antialiased h-full">
      <body className="flex min-h-screen flex-col bg-background text-foreground font-redaction selection:bg-primary/20 selection:text-primary transition-colors duration-300">
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
