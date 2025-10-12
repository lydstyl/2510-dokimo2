import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rental Management System',
  description: 'Manage rental properties, leases, and payments',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
