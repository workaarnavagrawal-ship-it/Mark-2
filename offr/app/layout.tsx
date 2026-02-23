import "./globals.css";
import { EB_Garamond, DM_Sans } from "next/font/google";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "offr — know your chances",
  description: "Data-driven university offer predictions for IB and A-Level students.",
};

const garamond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-garamond",
  display: "swap",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm",
  display: "swap",
  weight: ["300", "400", "500"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${garamond.variable} ${dmSans.variable}`}>
      <body style={{ fontFamily: "var(--font-dm, var(--sans))" }}>
        {children}
      </body>
    </html>
  );
}
