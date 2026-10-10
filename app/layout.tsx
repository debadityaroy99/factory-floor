import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Industrial Intelligence // Autonomous Manufacturing Platform",
  description: "From engineering drawings to actionable factory intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#f4ebd7]">{children}</body>
    </html>
  );
}
