import { type NextRequest, NextResponse } from "next/server"
import { registerUser } from "@/lib/auth/authenticate"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password || !name) {
      return NextResponse.json({ success: false, error: "Email, password, and name are required" }, { status: 400 })
    }

    const authResult = await registerUser({ email, password, name })

    if (!authResult.success || !authResult.user || !authResult.sessionToken) {
      return NextResponse.json({ success: false, error: authResult.error || "Signup failed" }, { status: 400 })
    }

    const response = NextResponse.json({
      success: true,
      user: authResult.user,
      message: authResult.message || "Signup successful",
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
    console.error("❌ Signup API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during signup",
      },
      { status: 500 },
    )
  }
}
