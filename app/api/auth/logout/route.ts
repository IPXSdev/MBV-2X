import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get("session-token")?.value

  if (sessionToken) {
    await supabase.from("user_sessions").delete().eq("session_token", sessionToken)
  }

  const response = NextResponse.json({ success: true, message: "Logged out" })

  // Clear the cookie
  response.cookies.set("session-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: -1,
    path: "/",
  })

  return response
}
