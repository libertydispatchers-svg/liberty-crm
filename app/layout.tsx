import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Liberty Dispatchers | The Free\'er Revolution for Drivers',
  description: 'Join the dispatch revolution! We empower drivers (18+) with smart routing, dedicated support, and total freedom. Mix our offers with your other delivery apps and work entirely on your own terms. We partner with multiple top tech companies to bring you endless opportunities.',
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
