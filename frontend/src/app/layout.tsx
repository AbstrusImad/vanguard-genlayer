import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vanguard — Decentralized Work Bounties',
  description: 'Sponsors fund bounties with GEN, hunters submit work, AI consensus evaluates quality and releases payment.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Nunito+Sans:opsz,wght@6..12,300;6..12,400;6..12,500;6..12,600;6..12,700&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
