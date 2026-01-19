import type { Metadata } from "next";
import "./globals.css";

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
      </head>
      <body className="font-sans antialiased bg-gray-50 text-gray-900">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <span className="text-2xl">🔮</span>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                LogicForge
              </span>
            </a>
            <nav className="flex items-center gap-6">
              <a href="/" className="text-gray-600 hover:text-indigo-600 transition-colors">
                Programs
              </a>
              <a href="/dashboard" className="text-gray-600 hover:text-indigo-600 transition-colors">
                📊 Analytics
              </a>
              <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full">
                <span className="text-sm font-medium text-indigo-700">850 XP</span>
                <span className="text-xs text-indigo-500">Lvl 2</span>
              </div>
              <a href="/login" className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-shadow text-sm font-medium">
                Sign In
              </a>
            </nav>
          </div>
        </header>

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
      </body>
    </html>
  );
}
