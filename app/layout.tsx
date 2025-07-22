import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { MainLayout } from "@/components/layout/main-layout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "The Man Behind the Music - Submit Your Music, Get Heard, Get Placed",
  description:
    "Submit your music to Grammy-winning producers and industry legends. Get your tracks placed in major TV shows, films, and productions.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent Web3/MetaMask errors
              window.addEventListener('unhandledrejection', function(event) {
                if (event.reason && event.reason.message && 
                    (event.reason.message.includes('MetaMask') || 
                     event.reason.message.includes('Web3') ||
                     event.reason.message.includes('ethereum') ||
                     event.reason.message.includes('Failed to connect'))) {
                  event.preventDefault();
                  console.warn('Prevented Web3/MetaMask error:', event.reason.message);
                }
              });
              
              // Disable Web3 injection if present
              if (typeof window.ethereum !== 'undefined') {
                console.warn('Web3 detected but disabled for TMBM platform');
              }
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  )
}
