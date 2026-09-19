import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { InstallPrompt } from "@/components/InstallPrompt";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";
import { getAdminSession, getViewerSession } from "@/lib/auth";

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
  // The public Header/Footer (search, "List your business", viewer login,
  // footer links) are irrelevant chrome once inside the authenticated admin
  // panel — it has its own sidebar nav and account controls. Only
  // suppressed for a logged-in admin; the admin login page itself still
  // gets the public Header/Footer since at that point there's no admin
  // session yet.
  const pathname = headers().get("x-pathname") ?? "";
  const isAdminRoute = pathname.startsWith("/admin");
  const [adminSession, viewerSession] = await Promise.all([
    isAdminRoute ? getAdminSession() : Promise.resolve(null),
    isAdminRoute ? Promise.resolve(null) : getViewerSession(),
  ]);
  const hidePublicChrome = isAdminRoute && Boolean(adminSession?.user);
  // A signed-in viewer already has the dashboard sidebar (and the header's
  // own Dashboard CTA) for navigation — the marketing/site footer is aimed
  // at a visitor who isn't signed in yet, so it's dropped once they are.
  const hideFooter = hidePublicChrome || Boolean(viewerSession?.user);

  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable}`}>
      <body className="flex min-h-screen flex-col bg-paper font-body text-ink antialiased">
        <InstallPrompt />
        {!hidePublicChrome && <Header />}
        {/* Bottom nav is fixed and only visible below md, so its own
            content never needs page padding on desktop — pb-16 clears it
            on mobile without affecting larger viewports. */}
        <main className={cn("flex-1", !isAdminRoute && "pb-16 md:pb-0")}>{children}</main>
        {!hideFooter && <Footer />}
        {!isAdminRoute && <BottomNav />}
      </body>
    </html>
  );
}
