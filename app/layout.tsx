import type { Metadata } from "next";
import { Geist, Geist_Mono, Manrope, Jost } from "next/font/google";
import { AuthProvider } from "./AuthProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

const manropeFont = Manrope({
  variable: "--font-manrope",
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
})

const jostFont = Jost({
  variable: "--font-jost",
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Incident Hub",
  description: "Use To-do app simplier",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">

      <body
        className={`${geistSans.variable} ${geistMono.variable} ${jostFont.variable} ${manropeFont.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
