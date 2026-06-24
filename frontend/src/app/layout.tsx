import type { Metadata } from "next";
import { Montserrat, Lexend_Deca, Parisienne, Poppins, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BrandProvider } from "@/context/BrandContext";
import { Toaster } from "sonner";
import PWARegister from "@/components/PWARegister";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const lexendDeca = Lexend_Deca({
  subsets: ["latin"],
  variable: "--font-lexend-deca",
  weight: ["300", "400", "500", "600"],
});

const parisienne = Parisienne({
  subsets: ["latin"],
  variable: "--font-parisienne",
  weight: "400",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JG-FIT — Inteligência Coletiva para Personal Trainers",
  description: "A evolução da prescrição de treinos. Uma plataforma inteligente de gestão esportiva e periodização baseada na experiência do treinador.",
  viewport: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0, viewport-fit=cover",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${poppins.variable} ${lexendDeca.variable} ${montserrat.variable} ${parisienne.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg-main text-text-main">
        <BrandProvider>
          {children}
        </BrandProvider>
        <Toaster
          theme="dark"
          position="top-center"
          richColors
          toastOptions={{
            style: {
              background: "#0c111e",
              border: "1px solid #182235",
              color: "#fff",
            },
          }}
        />
        <PWARegister />
      </body>
    </html>
  );
}

