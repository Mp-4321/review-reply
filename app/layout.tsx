import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/app/ui/convex-client-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const TITLE       = "Replyfier — AI Replies for Google Reviews"
const DESCRIPTION = "Reply to Google reviews faster with AI-powered replies tailored to your business. Save time, stay consistent, and improve your online reputation."

export const metadata: Metadata = {
  title:       TITLE,
  description: DESCRIPTION,
  openGraph: {
    title:       TITLE,
    description: DESCRIPTION,
    type:        'website',
  },
  twitter: {
    card:        'summary',
    title:       TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-sky-100`}
    >
      <body className="min-h-full flex flex-col overscroll-none bg-white">
        <ClerkProvider
          localization={{
            signIn: {
              start: {
                title: 'Welcome to Replyfier',
                subtitle: 'Please sign in to continue',
              },
            },
            signUp: {
              start: {
                subtitle: '',
              },
            },
          }}
        >
          <ConvexClientProvider>
            {children}
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
