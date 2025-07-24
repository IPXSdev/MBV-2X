import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const sessionToken = cookieStore.get("session-token")?.value

    if (!sessionToken) {
      return NextResponse.json(
        {
          success: false,
          error: "No session token found",
        },
        { status: 401 },
      )
    }

    // Get user from session
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
      return NextResponse.json(
        {
          success: false,
          error: "Invalid session",
        },
        { status: 401 },
      )
    }

    // Check if session is expired
    const expiresAt = new Date(sessionData.expires_at)
    const now = new Date()

    if (expiresAt < now) {
      // Clean up expired session
      await supabase.from("user_sessions").delete().eq("session_token", sessionToken)

      return NextResponse.json(
        {
          success: false,
          error: "Session expired",
        },
        { status: 401 },
      )
    }

    const user = Array.isArray(sessionData.users) ? sessionData.users[0] : sessionData.users

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tier: user.tier,
        submission_credits: user.submission_credits,
        is_verified: user.is_verified,
        legal_waiver_accepted: user.legal_waiver_accepted,
        compensation_type: user.compensation_type,
      },
    })
  } catch (error) {
    console.error("❌ Auth me error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
