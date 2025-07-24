import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import type { Database } from "./database.types"

interface User {
  id: string
  email: string
  name: string
  role: string
  tier: string
  submission_credits: number
  created_at: string
  updated_at: string
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie?.value) {
      return null
    }

    const sessionData = JSON.parse(sessionCookie.value)
    const userId = sessionData.user_id

    if (!userId) {
      return null
    }

    // Use service client to get user data
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data: user, error } = await supabase.from("users").select("*").eq("id", userId).single()

    if (error || !user) {
      console.error("Error fetching user:", error)
      return null
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name || user.email,
      role: user.role || "creator",
      tier: user.tier || "creator",
      submission_credits: user.submission_credits || 0,
      created_at: user.created_at,
      updated_at: user.updated_at,
    }
  } catch (error) {
    console.error("Error in getCurrentUser:", error)
    return null
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("Authentication required")
  }

  return user
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth()

  if (user.role !== "admin" && user.role !== "master_dev") {
    throw new Error("Admin access required")
  }

  return user
}

export async function requireMasterDev(): Promise<User> {
  const user = await requireAuth()

  if (user.role !== "master_dev") {
    throw new Error("Master dev access required")
  }

  return user
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === "admin" || user?.role === "master_dev"
}

export async function isMasterDev(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === "master_dev"
}

export async function getUserRole(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.role || null
}

export async function getUserTier(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.tier || null
}

export async function getSubmissionCredits(): Promise<number> {
  const user = await getCurrentUser()
  return user?.submission_credits || 0
}

export async function canSubmit(): Promise<boolean> {
  const user = await getCurrentUser()

  if (!user) return false
  if (user.role === "master_dev") return true

  return user.submission_credits > 0
}

export async function validateSession(sessionToken: string): Promise<User | null> {
  try {
    const sessionData = JSON.parse(sessionToken)
    const userId = sessionData.user_id
    const expiresAt = new Date(sessionData.expires_at)

    // Check if session is expired
    if (expiresAt < new Date()) {
      return null
    }

    // Get user data
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data: user, error } = await supabase.from("users").select("*").eq("id", userId).single()

    if (error || !user) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name || user.email,
      role: user.role || "creator",
      tier: user.tier || "creator",
      submission_credits: user.submission_credits || 0,
      created_at: user.created_at,
      updated_at: user.updated_at,
    }
  } catch (error) {
    console.error("Error validating session:", error)
    return null
  }
}

export async function createSession(userId: string): Promise<string> {
  const sessionData = {
    user_id: userId,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
  }

  return JSON.stringify(sessionData)
}

export async function destroySession(): Promise<void> {
  // Session destruction is handled by removing the cookie
  // This is typically done in the logout API route
}
