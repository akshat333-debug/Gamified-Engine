import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "LogicForge - AI-Powered Programme Design",
  description: "Gamified, AI-assisted programme design tool for Education NGOs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="LogicForge" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        {/* Service Worker Registration */}
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                  console.log('✅ SW registered:', registration.scope);
                }).catch(function(error) {
                  console.log('❌ SW registration failed:', error);
                });
              });
            }
          `
        }} />
      </head>
      <body className="font-sans antialiased bg-gray-50 text-gray-900">
        <Providers>
          {/* Dynamic Header with Auth State */}
          <Header />

          {/* Main Content */}
          <main className="min-h-screen">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-100 py-8">
            <div className="max-w-7xl mx-auto px-6 text-center text-gray-500 text-sm">
              <p>© 2024 LogicForge. Empowering Education NGOs with AI.</p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
