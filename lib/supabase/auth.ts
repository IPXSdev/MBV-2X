import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { User } from "@/lib/types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function getCurrentUser(request: NextRequest): Promise<User | null> {
  const sessionToken = request.cookies.get("session-token")?.value

  if (!sessionToken) {
    return null
  }

  try {
    const { data: sessionData, error: sessionError } = await supabase
      .from("user_sessions")
      .select(
        `
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
      `,
      )
      .eq("session_token", sessionToken)
      .single()

    if (sessionError || !sessionData || !sessionData.users) {
      return null
    }

    // Check if session is expired
    if (new Date(sessionData.expires_at) < new Date()) {
      // Clean up expired session
      await supabase.from("user_sessions").delete().eq("session_token", sessionToken)
      return null
    }

    const user = Array.isArray(sessionData.users) ? sessionData.users[0] : sessionData.users
    return user as User
  } catch (error) {
    console.error("Error fetching user by session token:", error)
    return null
  }
}
