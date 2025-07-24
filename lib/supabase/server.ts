import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import type { Database } from "./database.types"

export function createServiceClient() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function getServerSession() {
  try {
    const cookieStore = cookies()
    const sessionToken = cookieStore.get("session_token")?.value

    if (!sessionToken) {
      return null
    }

    const supabase = createServiceClient()

    const { data: sessionData, error } = await supabase
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
          created_at,
          updated_at
        )
      `)
      .eq("session_token", sessionToken)
      .single()

    if (error || !sessionData || !sessionData.users) {
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
    return {
      user,
      sessionToken,
      expiresAt,
    }
  } catch (error) {
    console.error("Error getting server session:", error)
    return null
  }
}

export async function validateServerSession(sessionToken: string) {
  try {
    const supabase = createServiceClient()

    const { data: sessionData, error } = await supabase
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
          created_at,
          updated_at
        )
      `)
      .eq("session_token", sessionToken)
      .single()

    if (error || !sessionData || !sessionData.users) {
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
    return user
  } catch (error) {
    console.error("Error validating server session:", error)
    return null
  }
}

export async function createServerSession(userId: string) {
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

    return {
      sessionToken,
      expiresAt,
    }
  } catch (error) {
    console.error("Error creating server session:", error)
    throw error
  }
}

export async function deleteServerSession(sessionToken: string) {
  try {
    const supabase = createServiceClient()
    await supabase.from("user_sessions").delete().eq("session_token", sessionToken)
  } catch (error) {
    console.error("Error deleting server session:", error)
    throw error
  }
}

export async function cleanupExpiredServerSessions() {
  try {
    const supabase = createServiceClient()
    const now = new Date().toISOString()

    await supabase.from("user_sessions").delete().lt("expires_at", now)
  } catch (error) {
    console.error("Error cleaning up expired server sessions:", error)
  }
}

export async function getUserFromSession() {
  const session = await getServerSession()
  return session?.user || null
}

export async function requireServerAuth() {
  const user = await getUserFromSession()
  if (!user) {
    throw new Error("Authentication required")
  }
  return user
}

export async function requireServerAdmin() {
  const user = await requireServerAuth()
  if (user.role !== "admin" && user.role !== "master_dev") {
    throw new Error("Admin access required")
  }
  return user
}

export async function requireServerMasterDev() {
  const user = await requireServerAuth()
  if (user.role !== "master_dev") {
    throw new Error("Master dev access required")
  }
  return user
}
