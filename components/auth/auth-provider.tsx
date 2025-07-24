"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface User {
  id: string
  name: string
  email: string
  role: string
  tier?: string
  submission_credits?: number
  is_verified?: boolean
  legal_waiver_accepted?: boolean
  compensation_type?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkAuth = async () => {
    setLoading(true)
    try {
      console.log("🔍 Checking authentication status...")

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch("/api/auth/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.log(`❌ Auth check failed with status: ${response.status}`)
        if (response.status === 401) {
          setUser(null)
          setError(null)
        } else {
          setError(`Authentication check failed (${response.status})`)
        }
        return
      }

      const responseText = await response.text()

      if (!responseText) {
        console.log("⚠️ Empty response from auth check")
        setUser(null)
        setError(null)
        return
      }

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error("❌ Failed to parse auth response:", responseText.substring(0, 200))
        setUser(null)
        setError("Invalid response from server")
        return
      }

      if (data.user) {
        console.log("✅ User authenticated:", data.user.email)
        setUser(data.user)
        setError(null)
      } else {
        console.log("ℹ️ No user session found")
        setUser(null)
        setError(null)
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        console.error("⏰ Auth check timed out")
        setError("Connection timeout - please check your internet connection")
      } else {
        console.error("❌ Auth check error:", err)
        setError("Connection error - unable to verify authentication")
      }
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    setLoading(true)
    setError(null)

    try {
      console.log("🔐 Attempting login for:", email)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), password }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const responseText = await response.text()
      console.log("📝 Login response status:", response.status)
      console.log("📝 Login response text:", responseText.substring(0, 500))

      let data
      try {
        data = responseText ? JSON.parse(responseText) : {}
      } catch (parseError) {
        console.error("❌ Failed to parse login response:", responseText.substring(0, 200))
        const errorMsg = "Invalid response from server"
        setError(errorMsg)
        return { success: false, error: errorMsg }
      }

      if (response.ok && data.success && data.user) {
        console.log("✅ Login successful for:", data.user.email)
        setUser(data.user)
        setError(null)
        return { success: true }
      } else {
        const errorMsg = data.error || `Login failed (${response.status})`
        console.error("❌ Login failed:", errorMsg)
        setError(errorMsg)
        return { success: false, error: errorMsg }
      }
    } catch (err) {
      let errorMessage = "Connection error during login"

      if (err instanceof Error) {
        if (err.name === "AbortError") {
          errorMessage = "Login timed out - please check your connection"
        } else {
          errorMessage = err.message || errorMessage
        }
      }

      console.error("❌ Login error:", err)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const signup = async (email: string, password: string, name: string) => {
    setLoading(true)
    setError(null)

    try {
      console.log("📝 Attempting signup for:", email)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000)

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          name: name.trim(),
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const responseText = await response.text()
      let data

      try {
        data = responseText ? JSON.parse(responseText) : {}
      } catch (parseError) {
        console.error("❌ Failed to parse signup response:", responseText.substring(0, 200))
        return { success: false, error: "Invalid response from server" }
      }

      if (response.ok && data.success && data.user) {
        console.log("✅ Signup successful for:", data.user.email)
        setUser(data.user)
        setError(null)
        return { success: true }
      } else {
        const errorMsg = data.error || `Signup failed (${response.status})`
        console.error("❌ Signup failed:", errorMsg)
        setError(errorMsg)
        return { success: false, error: errorMsg }
      }
    } catch (err) {
      let errorMessage = "Connection error during signup"

      if (err instanceof Error) {
        if (err.name === "AbortError") {
          errorMessage = "Signup timed out - please check your connection"
        } else {
          errorMessage = err.message || errorMessage
        }
      }

      console.error("❌ Signup error:", err)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("🚪 Logging out user...")

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      setUser(null)
      setError(null)

      if (response.ok) {
        console.log("✅ Logout successful")
      } else {
        console.log("⚠️ Logout response not OK, but user cleared locally")
      }
    } catch (err) {
      console.error("❌ Logout error:", err)
      setUser(null)
      setError(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, signup, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
