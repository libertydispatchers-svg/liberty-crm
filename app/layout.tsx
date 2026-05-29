import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Liberty Dispatchers Command System',
  description: 'Google Workspace powered driver hiring, managing, onboarding, and dispatch system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
