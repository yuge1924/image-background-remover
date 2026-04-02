import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'Background Remover — Free Online Tool',
  description: 'Remove image backgrounds instantly, free and private. No signup required.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-6Y0Q97FFGM"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-6Y0Q97FFGM');
          `}
        </Script>
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
