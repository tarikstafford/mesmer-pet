import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mesmer - AR Pet App",
  description: "Augmented reality virtual pet app with AI-powered personalities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
