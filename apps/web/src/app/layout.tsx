import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TOPLA",
  description: "Маркетплейс TOPLA — всё, что нужно, в одном месте",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
