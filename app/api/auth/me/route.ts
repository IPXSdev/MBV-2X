import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { User } from "@/lib/types"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  console.log("API /me: Checking user session...")

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("API /me: Server is missing Supabase environment variables.")
      return NextResponse.json({ success: false, error: "Server configuration error." }, { status: 500 })
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const sessionToken = request.cookies.get("session-token")?.value

    if (!sessionToken) {
      console.log("API /me: No session token found.")
      return NextResponse.json({ success: false, user: null }, { status: 200 })
    }

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
      console.log("API /me: Session not found in database or error.", sessionError?.message)
      return NextResponse.json({ success: false, user: null }, { status: 200 })
    }

    if (new Date(sessionData.expires_at) < new Date()) {
      console.log(`API /me: Expired session for user ${sessionData.user_id}. Cleaning up.`)
      await supabase.from("user_sessions").delete().eq("session_token", sessionToken)
      return NextResponse.json({ success: false, user: null }, { status: 200 })
    }

    const user = Array.isArray(sessionData.users) ? sessionData.users[0] : sessionData.users
    console.log(`API /me: Valid session found for user ${user.id}.`)
    return NextResponse.json({ success: true, user: user as User })
  } catch (error) {
    console.error("API /me: Unhandled exception:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
    return NextResponse.json(
      { success: false, error: "Internal server error while checking session.", details: errorMessage },
      { status: 500 },
    )
  }
}
