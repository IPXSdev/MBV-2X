import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"

// This function now returns a result object instead of throwing an error
async function createSession(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<{ sessionToken?: string; error?: string }> {
  const sessionToken = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const { error: sessionError } = await supabase.from("user_sessions").insert({
    user_id: userId,
    session_token: sessionToken,
    expires_at: expiresAt.toISOString(),
  })

  if (sessionError) {
    console.error("Failed to create session:", sessionError)
    return { error: "Failed to create session" }
  }

  return { sessionToken }
}

export async function POST(request: NextRequest) {
  // 1. Environment Variable Validation
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Login API Error: Missing one or more required environment variables.")
    return NextResponse.json({ error: "Server configuration error. Please contact support." }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const { email, password } = await request.json()
    const normalizedEmail = email.toLowerCase().trim()

    if (!normalizedEmail || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // 3. Regular User Login Logic
    const { data: regularUser, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", normalizedEmail)
      .single()

    if (userError || !regularUser) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    if (!regularUser.password_hash) {
      return NextResponse.json({ error: "Account requires password reset. Please contact support." }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, regularUser.password_hash)
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }
    const user = regularUser

    if (!user) {
      // This should not be reached, but as a safeguard:
      return NextResponse.json({ error: "Could not verify user credentials." }, { status: 500 })
    }

    // 4. Session Creation
    const sessionResult = await createSession(supabase, user.id)
    if (sessionResult.error || !sessionResult.sessionToken) {
      return NextResponse.json({ error: sessionResult.error || "Could not create session." }, { status: 500 })
    }

    const response = NextResponse.json({
      success: true,
      user,
      message: "Login successful",
    })

    response.cookies.set("session-token", sessionResult.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Login API - Unhandled Error:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json(
      { error: "An unexpected internal server error occurred.", details: errorMessage },
      { status: 500 },
    )
  }
}
