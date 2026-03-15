import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SplashScreen from "@/components/SplashScreen";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Onesign Display — Digital Menu Streaming',
  description: 'Stream your menus to every screen. Update prices, schedule dayparts, and manage every location — all from one dashboard. By Onesign & Digital.',
  openGraph: {
    siteName: 'Onesign Display',
    title: 'Onesign Display — Digital Menu Streaming',
    description: 'Menu boards that run themselves. By the sign-making experts at Onesign & Digital.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <SplashScreen />
        {children}
      </body>
    </html>
  );
}
