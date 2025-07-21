"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@/lib/supabase/auth"

interface AuthContextType {
  user: User | null
  loading: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    try {
      setLoading(true)
      console.log("🔄 AuthProvider: Refreshing user...")

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        signal: controller.signal,
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const userData = await response.json()
        console.log("📊 AuthProvider: Response data:", userData)
        setUser(userData.user || null)
      } else {
        console.log("❌ AuthProvider: Response not ok:", response.status)
        setUser(null)
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.error("⏰ AuthProvider: Request timeout")
      } else {
        console.error("❌ AuthProvider: Failed to refresh user:", error)
      }
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  return <AuthContext.Provider value={{ user, loading, refreshUser }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
