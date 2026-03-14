import type { Metadata, Viewport } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Val'tionnaire",
    template: "%s | Val'tionnaire",
  },
  description:
    "Le dictionnaire collaboratif. Creez, partagez et votez pour les definitions les plus droles.",
  applicationName: "Val'tionnaire",
  authors: [{ name: "Val'tionnaire" }],
  keywords: [
    "dictionnaire",
    "collaboratif",
    "argot",
    "slang",
    "amis",
    "definitions",
  ],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Val'tionnaire",
    title: "Val'tionnaire - Le dico de jeune",
    description:
      "Le dictionnaire collaboratif. Creez, partagez et votez pour les definitions les plus droles.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Val'tionnaire - Le dico de jeune",
    description:
      "Le dictionnaire collaboratif.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Val'tionnaire",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body
        className={`${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
