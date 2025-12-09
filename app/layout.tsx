import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "+AI Labs – The Secure Multimodal AI Assistant",
  description:
    "+AI Labs is the secure multimodal AI assistant that unifies leading models in one place. Chat, create, analyze images and voice, and protect your identity with built-in voice fingerprint security.",
  keywords: [
    "+AI",
    "PlusAI Labs",
    "secure AI assistant",
    "multimodal AI",
    "AI for creators",
    "AI chat app",
    "AI voice assistant",
    "voice fingerprint",
    "AI security",
    "ChatGPT alternative",
    "AI tools for artists",
    "AI tools for business",
  ],
  alternates: {
    canonical: "https://www.plusailabs.com/",
  },
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    type: "website",
    url: "https://www.plusailabs.com/",
    title: "+AI Labs – The Secure Multimodal AI Assistant",
    description:
      "+AI Labs is the secure multimodal AI assistant that unifies leading models in one place. Chat, create, analyze images and voice, and protect your identity with built-in voice fingerprint security.",
    siteName: "+AI Labs",
    images: [
      {
        url: "https://www.plusailabs.com/og-plus-ai.png",
        width: 1200,
        height: 630,
        alt: "+AI Labs – The Secure Multimodal AI Assistant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "+AI Labs – The Secure Multimodal AI Assistant",
    description:
      "+AI Labs is the secure multimodal AI assistant that unifies leading models in one place. Chat, create, analyze images and voice, and protect your identity with built-in voice fingerprint security.",
    images: ["https://www.plusailabs.com/og-plus-ai.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://www.plusailabs.com/#website",
        "url": "https://www.plusailabs.com/",
        "name": "+AI Labs",
        "description": "+AI Labs is the secure multimodal AI assistant that unifies leading models in one place. Chat, create, analyze images and voice, and protect your identity with built-in voice fingerprint security.",
        "inLanguage": "en-US",
        "publisher": {
          "@type": "Organization",
          "name": "Super eComm Inc.",
          "url": "https://www.superecomminc.com"
        },
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://www.plusailabs.com/#app",
        "name": "+AI Labs",
        "alternateName": "+AI",
        "operatingSystem": "Web, iOS, Android, macOS, Windows",
        "applicationCategory": "ProductivityApplication",
        "description": "+AI Labs is the secure multimodal AI assistant that unifies multiple large language and vision models in a single interface. Features include +Chat, +Vision, +Voice, +Studio, +Docs and +Cloud with built-in voice fingerprint security.",
        "softwareVersion": "1.0.0",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD",
          "description": "Free tier available with optional Plus and SuperPlus subscriptions."
        },
        "publisher": {
          "@type": "Organization",
          "name": "Super eComm Inc.",
          "url": "https://www.superecomminc.com"
        },
        "url": "https://www.plusailabs.com/",
        "image": "https://www.plusailabs.com/og-plus-ai.png"
      }
    ]
  };

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
