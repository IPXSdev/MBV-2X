import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const createServiceClient = () => {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function getServerUser() {
  try {
    const cookieStore = cookies()
    const sessionToken = cookieStore.get("session-token")?.value

    if (!sessionToken) {
      return null
    }

    const supabase = createServiceClient()

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
          updated_at,
          legal_waiver_accepted,
          compensation_type
        )
      `)
      .eq("session_token", sessionToken)
      .single()

    if (error || !data || !data.users) {
      return null
    }

    // Check if session is expired
    if (new Date(data.expires_at) < new Date()) {
      // Delete expired session
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
      legal_waiver_accepted: user.legal_waiver_accepted,
      compensation_type: user.compensation_type,
    }
  } catch (error) {
    console.error("❌ Error getting server user:", error)
    return null
  }
}
