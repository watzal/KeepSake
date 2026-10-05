import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Bricolage_Grotesque, Caveat, DM_Sans } from "next/font/google";
import AuthBridge from "@/components/AuthBridge";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display" });
const body = DM_Sans({ subsets: ["latin"], variable: "--font-body" });
const hand = Caveat({ subsets: ["latin"], variable: "--font-hand" });

export const metadata: Metadata = {
  title: "Keepsake",
  description: "Everyone's trip photos, organized together.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#0E6E6E",
          colorText: "#17262B",
          borderRadius: "0.75rem",
          fontFamily: "var(--font-body)",
        },
      }}
    >
      <html lang="en" className={`${display.variable} ${body.variable} ${hand.variable}`}>
        <body>
          <AuthBridge />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
