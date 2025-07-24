import { createServiceClient } from "./server"
import { cookies } from "next/headers"

export interface AuthUser {
  id: string
  email: string
  name: string
  role: "user" | "admin" | "master_dev"
  tier: "creator" | "indie" | "pro"
  submission_credits: number
  is_verified: boolean
  legal_waiver_accepted: boolean
  compensation_type: string | null
  created_at: string
  updated_at: string
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = cookies()
    const sessionToken = cookieStore.get("session_token")?.value

    if (!sessionToken) {
      return null
    }

    const supabase = createServiceClient()

    const { data: sessionData, error: sessionError } = await supabase
      .from("user_sessions")
      .select(`
        user_id,
        expires_at,
        users (
          id,
          email,
          name,
          role,
          tier,
          submission_credits,
          is_verified,
          legal_waiver_accepted,
          compensation_type,
          created_at,
          updated_at
        )
      `)
      .eq("session_token", sessionToken)
      .single()

    if (sessionError || !sessionData || !sessionData.users) {
      return null
    }

    // Check if session is expired
    const expiresAt = new Date(sessionData.expires_at)
    const now = new Date()

    if (expiresAt < now) {
      // Clean up expired session
      await supabase.from("user_sessions").delete().eq("session_token", sessionToken)
      return null
    }

    const user = Array.isArray(sessionData.users) ? sessionData.users[0] : sessionData.users
    return user as AuthUser
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Authentication required")
  }
  return user
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth()
  if (user.role !== "admin" && user.role !== "master_dev") {
    throw new Error("Admin access required")
  }
  return user
}

export async function requireMasterDev(): Promise<AuthUser> {
  const user = await requireAuth()
  if (user.role !== "master_dev") {
    throw new Error("Master dev access required")
  }
  return user
}

export async function validateSession(sessionToken: string): Promise<AuthUser | null> {
  try {
    const supabase = createServiceClient()

    const { data: sessionData, error: sessionError } = await supabase
      .from("user_sessions")
      .select(`
        user_id,
        expires_at,
        users (
          id,
          email,
          name,
          role,
          tier,
          submission_credits,
          is_verified,
          legal_waiver_accepted,
          compensation_type,
          created_at,
          updated_at
        )
      `)
      .eq("session_token", sessionToken)
      .single()

    if (sessionError || !sessionData || !sessionData.users) {
      return null
    }

    // Check if session is expired
    const expiresAt = new Date(sessionData.expires_at)
    const now = new Date()

    if (expiresAt < now) {
      // Clean up expired session
      await supabase.from("user_sessions").delete().eq("session_token", sessionToken)
      return null
    }

    const user = Array.isArray(sessionData.users) ? sessionData.users[0] : sessionData.users
    return user as AuthUser
  } catch (error) {
    console.error("Error validating session:", error)
    return null
  }
}

export async function createSession(userId: string): Promise<string> {
  try {
    const supabase = createServiceClient()
    const sessionToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const { error } = await supabase.from("user_sessions").insert({
      user_id: userId,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
    })

    if (error) {
      throw error
    }

    return sessionToken
  } catch (error) {
    console.error("Error creating session:", error)
    throw error
  }
}

export async function deleteSession(sessionToken: string): Promise<void> {
  try {
    const supabase = createServiceClient()
    await supabase.from("user_sessions").delete().eq("session_token", sessionToken)
  } catch (error) {
    console.error("Error deleting session:", error)
    throw error
  }
}

export async function cleanupExpiredSessions(): Promise<void> {
  try {
    const supabase = createServiceClient()
    const now = new Date().toISOString()

    await supabase.from("user_sessions").delete().lt("expires_at", now)
  } catch (error) {
    console.error("Error cleaning up expired sessions:", error)
  }
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
