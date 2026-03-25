import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spirit — Type Pattern Fill",
  description: "Transform text into pattern-filled vector art",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
