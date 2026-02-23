import "./globals.css";
import { EB_Garamond } from "next/font/google";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "offr — know your chances",
  description: "Data-driven university offer predictions for IB and A-Level students.",
};

const garamond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-garamond",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={garamond.variable}>
      <body className="font-garamond bg-zinc-950 text-zinc-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
