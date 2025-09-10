import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { ScrollToTop } from "@/components/shared/ScrollToTop";
import { AuthProvider } from "@/lib/context/auth-context";
import { CartProvider } from "@/lib/context/cart-context";
import { InventoryProvider } from "@/lib/context/inventory-context";
import { PricesProvider } from "@/lib/context/prices-context";
import { LoyaltyProvider } from "@/lib/context/loyalty-context";
import { LoadingProvider } from "@/lib/hooks/useLoading";
import { GlobalLoadingOverlay } from "@/components/ui/GlobalLoadingOverlay";
import { Toaster } from "@/components/ui/sonner";
import MetaPixelTracker from "@/components/analytics/MetaPixel";
import CookieConsent from "@/components/consent/CookieConsent";
import { ThemeProvider } from "@/components/shared/ThemeProvider";

// Force import medusa-client to initialize SDK
import '@/lib/medusa-client';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Falko Project - Premium Streetwear",
  description: "Ekskluzywna odzież streetwear dla wymagających. Bluzy, koszulki i czapki najwyższej jakości.",
};

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex min-h-screen flex-col`}
      >
        {/* Meta Pixel base code */}
        {META_PIXEL_ID ? (
          <>
            <Script id="meta-pixel" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                // Init only if consent cookie present
                (function(){
                  try {
                    var consent = document.cookie.split(';').map(function(c){return c.trim()}).find(function(c){return c.indexOf('consent_marketing=')===0});
                    if (consent && (consent.split('=')[1] === '1' || consent.split('=')[1] === 'true')) {
                      fbq('init', '${META_PIXEL_ID}');
                      fbq('track', 'PageView');
                    }
                  } catch (e) {}
                })();
              `}
            </Script>
            <noscript>
              <img height="1" width="1" style={{display:'none'}} alt="fbpx" src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`} />
            </noscript>
          </>
        ) : null}
        {/* End Meta Pixel base code */}

        <Script 
          src="https://furgonetka.pl/js/dist/map/map.js" 
          strategy="beforeInteractive"
        />
        
        {/* Theme initialization script - runs before hydration */}
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (function() {
              try {
                var theme = localStorage.getItem('theme');
                if (!theme) {
                  theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            })();
          `}
        </Script>
        <ThemeProvider>
          <LoadingProvider>
            <PricesProvider>
              <InventoryProvider>
                <AuthProvider>
                  <CartProvider>
                    <LoyaltyProvider>
                    <ScrollToTop />
                    <GlobalLoadingOverlay />
                    <Header />
                    <MetaPixelTracker />
                    <main className="flex-1">{children}</main>
                    <Footer />
                    <Toaster />
                    {/* Cookie Consent banner */}
                    <CookieConsent />
                    </LoyaltyProvider>
                  </CartProvider>
                </AuthProvider>
              </InventoryProvider>
            </PricesProvider>
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
