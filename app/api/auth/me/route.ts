import { type NextRequest, NextResponse } from "next/server"
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

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Auth check request received")

    const cookieStore = cookies()
    const sessionToken = cookieStore.get("session-token")?.value

    if (!sessionToken) {
      console.log("❌ No session token found")
      return NextResponse.json({ user: null }, { status: 401 })
    }

    console.log("🔍 Checking session token:", sessionToken.substring(0, 10) + "...")

    // Get user session from database
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
      console.log("❌ Session not found or invalid:", sessionError?.message)
      return NextResponse.json({ user: null }, { status: 401 })
    }

    // Check if session is expired
    const expiresAt = new Date(sessionData.expires_at)
    const now = new Date()

    if (expiresAt < now) {
      console.log("❌ Session expired")
      // Clean up expired session
      await supabase.from("user_sessions").delete().eq("session_token", sessionToken)
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const user = Array.isArray(sessionData.users) ? sessionData.users[0] : sessionData.users

    console.log("✅ Valid session found for user:", user.email)

    return NextResponse.json({
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
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    })
  } catch (error) {
    console.error("❌ Auth check error:", error)
    return NextResponse.json({ user: null }, { status: 500 })
  }
}
