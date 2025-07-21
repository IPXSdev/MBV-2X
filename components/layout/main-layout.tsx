import type React from "react"

import { Navigation } from "../navigation"
import { Footer } from "./footer"
import { AuthProvider } from "../auth/auth-provider"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-black text-white flex flex-col">
        <Navigation />
        <main className="flex-1 pt-16">{children}</main>
        <Footer />
      </div>
    </AuthProvider>
  )
}
