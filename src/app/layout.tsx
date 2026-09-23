import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
});

export const metadata: Metadata = {
  title: {
    default: "MakeMyMarriage - Plan your wedding. Together.",
    template: "%s | MakeMyMarriage"
  },
  description: "MakeMyMarriage is a shared wedding planning workspace for Indian couples. Manage events, tasks, guests, expenses, and vendors all in one place.",
  metadataBase: new URL("https://makemymarriage.com"),
  openGraph: {
    title: "MakeMyMarriage - Plan your wedding. Together.",
    description: "MakeMyMarriage is a shared wedding planning workspace for Indian couples.",
    url: "https://makemymarriage.com",
    siteName: "MakeMyMarriage",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MakeMyMarriage",
    description: "A shared wedding planning workspace for Indian couples.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
