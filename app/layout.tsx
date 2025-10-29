import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'UM Lost & Found',
  description: 'University Malaya Lost & Found Platform',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}

