import { type NextRequest, NextResponse } from "next/server"
import { registerUser } from "@/lib/auth/authenticate"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    // Basic validation
    if (!email || !password || !name) {
      return NextResponse.json({ success: false, error: "Email, password, and name are required" }, { status: 400 })
    }

    const result = await registerUser({ email, password, name })

    if (!result.success || !result.user || !result.sessionToken) {
      return NextResponse.json({ success: false, error: result.error || "Signup failed" }, { status: 400 })
    }

    const response = NextResponse.json({
      success: true,
      user: result.user,
      message: result.message || "Signup successful",
    })

    response.cookies.set("session-token", result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("❌ Signup API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during signup",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
