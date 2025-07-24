import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"
import type { User } from "@/lib/types"

export const dynamic = "force-dynamic"

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
    console.error("Login API: Failed to create session:", sessionError)
    return { error: "Database error during session creation." }
  }

  return { sessionToken }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Login API Error: Server is missing Supabase environment variables.")
      return NextResponse.json({ error: "Server configuration error. Please contact support." }, { status: 500 })
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { email, password } = await request.json()
    const normalizedEmail = email.toLowerCase().trim()

    if (!normalizedEmail || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 })
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select<"*", User>("*")
      .eq("email", normalizedEmail)
      .single()

    if (userError || !user) {
      console.log(`Login API: User not found or DB error for email: ${normalizedEmail}. Error: ${userError?.message}`)
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 })
    }

    if (!user.password_hash) {
      console.error(`Login API: User ${user.id} has no password hash.`)
      return NextResponse.json({ error: "This account is not configured for password login." }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      console.log(`Login API: Invalid password for user ${user.id}.`)
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 })
    }

    const sessionResult = await createSession(supabase, user.id)
    if (sessionResult.error || !sessionResult.sessionToken) {
      return NextResponse.json({ error: sessionResult.error || "Could not create user session." }, { status: 500 })
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

    console.log(`Login API: Successful login for user ${user.id}.`)
    return response
  } catch (error) {
    console.error("Login API: Unhandled exception:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
    return NextResponse.json(
      { error: "An unexpected internal server error occurred.", details: errorMessage },
      { status: 500 },
    )
  }
}
