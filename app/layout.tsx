import type { Metadata } from "next";
import "./globals.css";
import SplashScreen from "@/components/SplashScreen";

export const metadata: Metadata = {
  title: 'Onedesign Screens — Digital Menu Streaming',
  description: 'Stream your menus to every screen. Update prices, schedule dayparts, and manage every location — all from one dashboard. By Onedesign Studios.',
  openGraph: {
    siteName: 'Onedesign Screens',
    title: 'Onedesign Screens — Digital Menu Streaming',
    description: 'Menu boards that run themselves. By the sign-making experts at Onedesign Studios.',
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
