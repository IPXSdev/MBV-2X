import { type NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/auth/authenticate"
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
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 })
    }

    const authResult = await authenticateUser({ email, password })

    if (!authResult.success || !authResult.user || !authResult.sessionToken) {
      return NextResponse.json({ success: false, error: authResult.error || "Invalid credentials" }, { status: 401 })
    }

    const response = NextResponse.json({
      success: true,
      user: authResult.user,
      message: authResult.message || "Login successful",
    })

    response.cookies.set("session-token", authResult.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("❌ Login API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during login",
      },
      { status: 500 },
    )
  }
}
