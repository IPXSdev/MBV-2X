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

export interface User {
  id: string
  email: string
  name: string
  role: string
  tier: string
  submission_credits: number
  legal_waiver_accepted: boolean
  compensation_type: string
  created_at: string
  updated_at: string
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session-token")?.value

    if (!sessionToken) {
      return null
    }

    // Look up the session in the database
    const { data: session, error: sessionError } = await supabase
      .from("user_sessions")
      .select("*, users(*)")
      .eq("session_token", sessionToken)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (sessionError || !session) {
      return null
    }

    return {
      id: session.users.id,
      email: session.users.email,
      name: session.users.name,
      role: session.users.role,
      tier: session.users.tier,
      submission_credits: session.users.submission_credits,
      legal_waiver_accepted: session.users.legal_waiver_accepted,
      compensation_type: session.users.compensation_type,
      created_at: session.users.created_at,
      updated_at: session.users.updated_at,
    }
  } catch (error) {
    console.error("Error getting current user:", error)
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
