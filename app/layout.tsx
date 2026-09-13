import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { InstallPrompt } from "@/components/InstallPrompt";
import { getAdminSession } from "@/lib/auth";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-manrope",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    template: "%s | KBN Business Directory",
    default: "KBN Business Directory",
  },
  description: "A community business directory.",
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#F06826",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The public Header/nav (search, "List your business", viewer login) is
  // irrelevant chrome once inside the authenticated admin panel — it has
  // its own sidebar nav and account controls. Only suppressed for a
  // logged-in admin; the admin login page itself still gets the public
  // Header since at that point there's no admin session yet.
  const pathname = headers().get("x-pathname") ?? "";
  const isAdminRoute = pathname.startsWith("/admin");
  const adminSession = isAdminRoute ? await getAdminSession() : null;
  const hidePublicHeader = isAdminRoute && Boolean(adminSession?.user);

  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable}`}>
      <body className="flex min-h-screen flex-col bg-paper font-body text-ink antialiased">
        <InstallPrompt />
        {!hidePublicHeader && <Header />}
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
