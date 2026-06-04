import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TopTask - Todo App",
  description: "A priority-based todo app",
};

function Header() {
  return (
    <header className="w-full border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="font-semibold tracking-tight">
          TopTask
        </div>

        <nav className="flex items-center gap-4 text-sm text-gray-600">
          <a href="/" className="hover:text-black transition">Home</a>
          <a href="/tasks" className="hover:text-black transition">Tasks</a>
          <a href="/analytics" className="hover:text-black transition">Analytics</a>
        </nav>
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        <Header />
        {children}
      </body>
    </html>
  );
}
