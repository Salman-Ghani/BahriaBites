import type { Metadata } from "next";
import "./globals.css";
import "./staff.css";

export const metadata: Metadata = {
  title: "Bahria Bites — Skip the Queue, Grab the Bite",
  description: "Pre-order fresh campus food, choose a pickup time, and collect without waiting at Bahria University.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-PK">
      <body className="antialiased">{children}</body>
    </html>
  );
}
