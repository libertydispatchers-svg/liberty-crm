import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Liberty Dispatchers | The Free\'er Revolution for Drivers',
  description: 'Join the free\'er revolution of drivers changing up dispatching. Ebike, bike, and moped courier lifestyle with support, freedom, and pre-determined amounts. Flexibility is how we operate. We run delivery dispatch and placement for many tech companies to change the game for delivery workers.',
  keywords: ['delivery drivers', 'dispatching', 'ebike courier', 'bike courier', 'moped courier', 'gig economy', 'flexible work', 'tech dispatch'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Liberty Dispatch',
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
      <body>
        {children}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              function loadTailorTalkWhatsAppWidget(callback) {
                var script = document.createElement('script');
                script.src = "https://plugins.tailortalk.ai/widget_whatsapp.js";
                script.onload = callback;
                document.head.appendChild(script);
              }

              loadTailorTalkWhatsAppWidget(function() {
                window.TailorTalkWhatsApp && window.TailorTalkWhatsApp.init({
                  "agentId": "public",
                  "whatsappConfig": {
                    "businessInfo": {
                      "phoneNumber": "14106354001"
                    },
                    "buttonText": "DISPATCH",
                    "welcomeMessage": "Hello"
                  },
                  "position": "right"
                });
              });
            })();
          `
        }} />
      </body>
    </html>
  );
}
