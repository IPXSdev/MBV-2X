import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session-token")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "No session token" }, { status: 401 })
    }

    const supabase = createServiceClient()

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
          updated_at,
          legal_waiver_accepted,
          compensation_type
        )
      `)
      .eq("session_token", sessionToken)
      .single()

    if (error || !data || !data.users) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    // Check if session is expired
    if (new Date(data.expires_at) < new Date()) {
      // Clean up expired session
      await supabase.from("user_sessions").delete().eq("session_token", sessionToken)
      return NextResponse.json({ error: "Session expired" }, { status: 401 })
    }

    const user = Array.isArray(data.users) ? data.users[0] : data.users

    return NextResponse.json({
      user: {
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
      },
    })
  } catch (error) {
    console.error("Error getting current user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
