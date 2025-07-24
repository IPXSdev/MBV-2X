import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session-token")?.value

    if (!sessionToken) {
      return null
    }

    // Get user from session token
    const { data, error } = await supabase
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

    if (error || !data || !data.users) {
      return null
    }

    // Check if session is expired
    if (new Date(data.expires_at) < new Date()) {
      // Clean up expired session
      await supabase.from("user_sessions").delete().eq("session_token", sessionToken)
      return null
    }

    const user = Array.isArray(data.users) ? data.users[0] : data.users

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tier: user.tier,
      submission_credits: user.submission_credits,
      is_verified: user.is_verified,
      created_at: user.created_at,
      updated_at: user.updated_at,
    }
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("Authentication required")
  }

  return user
}

export async function requireAdmin() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("Authentication required")
  }

  if (user.role !== "admin" && user.role !== "master_dev") {
    throw new Error("Admin access required")
  }

  return user
}

export async function requireMasterDev() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("Authentication required")
  }

  if (user.role !== "master_dev") {
    throw new Error("Master dev access required")
  }

  return user
}
