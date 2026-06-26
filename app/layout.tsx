import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Liberty Dispatchers | Join the Courier Revolution',
  description: 'Join the revolution of choosing your work scheduling, access to charging stations, storage help, and locked in rates per mile. E-bikes, bikes, and couriers wanted!',
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
