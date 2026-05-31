import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Liberty Dispatchers Command System',
  description: 'Google Workspace powered driver hiring, managing, onboarding, and dispatch system',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Liberty CRM',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f111a',
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
