import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "./providers";
import Shell from "./components/Shell";

export const metadata: Metadata = {
  title: "CHEREPOVETS · Модерация",
  description: "Панель модерации CHEREPOVETS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" data-theme="light">
      <body>
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
