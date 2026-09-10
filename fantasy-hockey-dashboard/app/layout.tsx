import type { Metadata } from "next";
import { Anton, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const display = Anton({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-display",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Fantasy Hockey Dashboard",
  description: "Category-value targeting dashboard for a 12-team H2H keeper league",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
