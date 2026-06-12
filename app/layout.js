"use client";

import { usePathname } from "next/navigation";
import "./globals.css";
import Navbar from "../components/Navbar";
import { AuthProvider } from "../src/context/AuthContext";
import { ThemeProvider } from "../src/context/ThemeContext";

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isWelcome = pathname === "/welcome";

  const themeInitScript = `(function(){try{var m=localStorage.getItem("eiry_theme_mode");var h=new Date().getHours();var t=m==="light"||m==="dark"?m:(h>=20||h<7?"dark":"light");document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t==="dark"?"dark":"light";}catch(e){document.documentElement.dataset.theme="dark";}})();`;

  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Эйри — платформа для веб-комиксов. Читайте комиксы, создавайте свои истории и делитесь с сообществом." />
        <meta name="keywords" content="комиксы, веб-комиксы, манга, чтение, создание комиксов, арт, иллюстрации" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Эйри — Платформа для веб-комиксов" />
        <meta property="og:description" content="Читайте и создавайте комиксы на Эйри." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://eiry.ru" />
        <meta property="og:image" content="/img/og-image.jpg" />
        <link rel="canonical" href="https://eiry.ru" />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            {!isWelcome && <Navbar />}
            <main>{children}</main>
            {!isWelcome && (
              <footer className="global-footer">
                <p>© 2026 ЭЙРИ Комиксы</p>
              </footer>
            )}
          </AuthProvider>
        </ThemeProvider>
        
        <script
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
          suppressHydrationWarning
        />
      </body>
    </html>
  );
}