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

export async function POST(request: NextRequest) {
  try {
    console.log("🚪 Logout request received")

    const sessionToken = request.cookies.get("session-token")?.value

    if (sessionToken) {
      // Delete the session from the database
      const { error } = await supabase.from("user_sessions").delete().eq("session_token", sessionToken)

      if (error) {
        console.error("❌ Failed to delete session:", error)
      } else {
        console.log("✅ Session deleted successfully")
      }
    }

    // Clear the session cookie
    const response = NextResponse.json({ success: true, message: "Logged out successfully" })

    response.cookies.set("session-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("❌ Logout error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
