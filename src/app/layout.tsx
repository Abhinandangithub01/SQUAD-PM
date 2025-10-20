import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ConfigureAmplifyClientSide } from '@/components/ConfigureAmplify';
import { Providers } from '@/components/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SQUAD PM - Project Management System',
  description: 'Modern project management application with AWS Amplify',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConfigureAmplifyClientSide />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
