import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { AppProvider } from "@/lib/store";
import { Providers } from "@/components/Providers";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Presupuesto",
  description: "Controla ingresos, gastos, cuentas, deudas y ahorros personales o familiares.",
  applicationName: "Presupuesto",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/icons/favicon-32x32.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Presupuesto",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#022c22" },
    { media: "(prefers-color-scheme: dark)", color: "#022c22" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={`h-full ${outfit.variable}`}>
      <body className={`${outfit.className} min-h-full antialiased`}>
        <div id="boot-splash" className="splash" role="status" aria-live="polite" aria-label="Cargando">
          <div className="splash-glow" aria-hidden />
          <div className="splash-orb splash-orb-a" aria-hidden />
          <div className="splash-orb splash-orb-b" aria-hidden />
          <div className="splash-mark">
            <div className="splash-logo-ring">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo.png" alt="" width={168} height={168} className="splash-logo" />
            </div>
            <p className="brand splash-title">Presupuesto</p>
            <p className="splash-caption">Cargando…</p>
          </div>
        </div>
        <AppProvider>
          <Providers>
            <ServiceWorkerRegister />
            {children}
          </Providers>
        </AppProvider>
      </body>
    </html>
  );
}
