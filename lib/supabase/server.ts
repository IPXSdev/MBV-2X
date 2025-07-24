import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import type { Database } from "./database.types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function createClient() {
  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export function createServerClient() {
  const cookieStore = cookies()

  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: "", ...options })
        } catch (error) {
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

export function createServiceClient() {
  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export function createAdminClient() {
  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function getUserFromSession(sessionToken: string) {
  const supabase = createServiceClient()

  try {
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
    return user
  } catch (error) {
    console.error("Error getting user from session:", error)
    return null
  }
}

export async function createSession(userId: string) {
  const supabase = createServiceClient()
  const sessionToken = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  try {
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
    console.error("Error creating session:", error)
    throw error
  }
}

export async function deleteSession(sessionToken: string) {
  const supabase = createServiceClient()

  try {
    await supabase.from("user_sessions").delete().eq("session_token", sessionToken)
  } catch (error) {
    console.error("Error deleting session:", error)
    throw error
  }
}

export async function cleanupExpiredSessions() {
  const supabase = createServiceClient()
  const now = new Date().toISOString()

  try {
    await supabase.from("user_sessions").delete().lt("expires_at", now)
  } catch (error) {
    console.error("Error cleaning up expired sessions:", error)
  }
}
