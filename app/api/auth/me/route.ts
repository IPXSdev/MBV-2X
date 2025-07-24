import { type NextRequest, NextResponse } from "next/server"
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
    console.log("🔍 Checking user session...")

    const sessionToken = request.cookies.get("session-token")?.value

    if (!sessionToken) {
      console.log("ℹ️ No session token found")
      return NextResponse.json({ success: false, error: "No session found" }, { status: 401 })
    }

    // Look up the session in the database
    const { data: session, error: sessionError } = await supabase
      .from("user_sessions")
      .select("*, users(*)")
      .eq("session_token", sessionToken)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (sessionError || !session) {
      console.log("❌ Invalid or expired session")
      return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 })
    }

    console.log("✅ Valid session found for user:", session.users.email)

    return NextResponse.json({
      success: true,
      user: {
        id: session.users.id,
        email: session.users.email,
        name: session.users.name,
        role: session.users.role,
        tier: session.users.tier,
        submission_credits: session.users.submission_credits,
        legal_waiver_accepted: session.users.legal_waiver_accepted,
        compensation_type: session.users.compensation_type,
      },
    })
  } catch (error) {
    console.error("❌ Session check error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
