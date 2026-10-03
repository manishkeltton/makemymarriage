import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Noto_Sans_Devanagari } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { getEffectiveLocale } from "@/lib/i18n/locale-resolver";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-noto-devanagari",
});

export const metadata: Metadata = {
  title: {
    default: "MakeMyMarriage - Plan your wedding. Together.",
    template: "%s | MakeMyMarriage",
  },
  description:
    "MakeMyMarriage is a shared wedding planning workspace for Indian couples. Manage events, tasks, guests, expenses, and vendors all in one place.",
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
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getEffectiveLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${plusJakartaSans.variable} ${notoSansDevanagari.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
