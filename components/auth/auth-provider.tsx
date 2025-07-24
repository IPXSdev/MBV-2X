"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
  id: string
  name: string
  email: string
  role: string
  tier?: string
  submission_credits?: number
  legal_waiver_accepted?: boolean
  compensation_type?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = async () => {
    try {
      setError(null)
      const response = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          console.log("User loaded:", data.user)
          setUser(data.user)
        } else {
          setUser(null)
        }
      } else {
        setUser(null)
      }
    } catch (err) {
      console.error("Auth error:", err)
      setError("Failed to load user")
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async () => {
    setLoading(true)
    await fetchUser()
  }

  useEffect(() => {
    fetchUser()
  }, [])

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
      console.log("📝 Login response:", responseText.substring(0, 200))

      let data
      try {
        data = responseText ? JSON.parse(responseText) : {}
      } catch (parseError) {
        console.error("❌ Failed to parse login response:", responseText.substring(0, 200))
        return { success: false, error: "Invalid response from server" }
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

  const value: AuthContextType = {
    user,
    loading,
    isLoading: loading,
    error,
    login,
    signup,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
