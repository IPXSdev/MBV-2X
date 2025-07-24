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
  signup: (
    email: string,
    password: string,
    name: string,
    artistName: string,
    primaryGenre: string,
    legalWaiverAccepted: boolean,
    subscribeToNewsletter: boolean,
  ) => Promise<{ success: boolean; error?: string }>
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
          console.log("Auth Provider: User loaded on initial fetch.", data.user)
          setUser(data.user)
        } else {
          setUser(null)
        }
      } else {
        setUser(null)
      }
    } catch (err) {
      console.error("Auth Provider: Failed to fetch user.", err)
      setError("Failed to check authentication status.")
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
      console.log(`Auth Provider: Attempting login for ${email}.`)
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      const responseText = await response.text()
      console.log(`Auth Provider: Login response status: ${response.status}`)
      console.log(`Auth Provider: Login response text: ${responseText.substring(0, 500)}`)

      let data
      if (response.ok) {
        try {
          data = JSON.parse(responseText)
        } catch (e) {
          console.error("Auth Provider: Failed to parse successful login response.", e)
          return { success: false, error: "Received an invalid response from the server." }
        }

        if (data.success && data.user) {
          console.log("Auth Provider: Login successful.", data.user)
          setUser(data.user)
          return { success: true }
        }
      }

      // Handle failed responses
      try {
        data = JSON.parse(responseText)
        const errorMessage = data.error || "An unknown error occurred during login."
        console.error(`Auth Provider: Login failed. Server message: ${errorMessage}`)
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } catch (e) {
        console.error("Auth Provider: Failed to parse error response. The server may have crashed.")
        const errorMsg = "The server returned an unreadable error. Please contact support."
        setError(errorMsg)
        return { success: false, error: errorMsg }
      }
    } catch (err) {
      console.error("Auth Provider: Network or unexpected error during login.", err)
      const errorMessage = "Could not connect to the server. Please check your network."
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const signup = async (
    email: string,
    password: string,
    name: string,
    artistName: string,
    primaryGenre: string,
    legalWaiverAccepted: boolean,
    subscribeToNewsletter: boolean,
  ) => {
    setLoading(true)
    setError(null)

    try {
      console.log(`Auth Provider: Attempting signup for ${email}.`)
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          name: name.trim(),
          artistName: artistName.trim(),
          primaryGenre: primaryGenre.trim(),
          legalWaiverAccepted,
          subscribeToNewsletter,
        }),
      })

      const responseText = await response.text()
      console.log(`Auth Provider: Signup response status: ${response.status}`)
      console.log(`Auth Provider: Signup response text: ${responseText.substring(0, 500)}`)

      let data
      if (response.ok) {
        try {
          data = JSON.parse(responseText)
        } catch (e) {
          console.error("Auth Provider: Failed to parse successful signup response.", e)
          return { success: false, error: "Received an invalid response from the server." }
        }

        if (data.success && data.user) {
          console.log("Auth Provider: Signup successful.", data.user)
          setUser(data.user)
          return { success: true }
        }
      }

      // Handle failed responses
      try {
        data = JSON.parse(responseText)
        const errorMessage = data.error || "An unknown error occurred during signup."
        console.error(`Auth Provider: Signup failed. Server message: ${errorMessage}`)
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } catch (e) {
        console.error("Auth Provider: Failed to parse error response. The server may have crashed.")
        const errorMsg = "The server returned an unreadable error. Please contact support."
        setError(errorMsg)
        return { success: false, error: errorMsg }
      }
    } catch (err) {
      console.error("Auth Provider: Network or unexpected error during signup.", err)
      const errorMessage = "Could not connect to the server. Please check your network."
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch (err) {
      console.error("Auth Provider: Logout request failed.", err)
    } finally {
      console.log("Auth Provider: User logged out.")
      setUser(null)
      setError(null)
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
