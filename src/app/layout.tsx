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
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Presupuesto",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#064E3B" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={`h-full ${outfit.variable}`}>
      <body className={`${outfit.className} min-h-full antialiased`}>
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
