import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Background Remover — Free Online Tool',
  description: 'Remove image backgrounds instantly, free and private. No signup required.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
