import type { Metadata } from "next";
import "./globals.css";
import SplashScreen from "@/components/SplashScreen";

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
        className="antialiased"
        suppressHydrationWarning
      >
        <SplashScreen />
        {children}
      </body>
    </html>
  );
}
