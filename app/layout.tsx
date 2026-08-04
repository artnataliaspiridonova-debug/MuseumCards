import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Museum Adventure",
  description: "A portable creative adventure for any art museum.",
  applicationName: "Museum Adventure",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Museum Adventure",
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "64x64" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f0e4",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <ClerkProvider
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          afterSignOutUrl="/sign-in"
          appearance={{
            variables: {
              colorPrimary: "#173f67",
              colorBackground: "#fffdf8",
              borderRadius: "16px",
            },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
