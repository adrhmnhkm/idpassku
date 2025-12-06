import "./globals.css";
import { Inter } from "next/font/google";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <head>
        {/* Inline script to redirect dashboard from main domain BEFORE React renders */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                var hostname = window.location.hostname;
                var pathname = window.location.pathname;
                var isMainDomain = hostname === 'idpassku.com' || 
                  (hostname !== 'vault.idpassku.com' && !hostname.includes('vault.') && 
                   !hostname.includes('localhost') && !hostname.includes('127.0.0.1'));
                var isDashboard = pathname.startsWith('/dashboard');
                
                if (isMainDomain && isDashboard) {
                  // Clear auth data if exists
                  try {
                    localStorage.removeItem('indovault-auth');
                    sessionStorage.removeItem('encryption-key');
                  } catch(e) {}
                  // Immediate redirect - prevents React from rendering
                  window.location.replace('https://idpassku.com/login');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-cyber-bg text-white`}>{children}</body>
    </html>
  );
}
