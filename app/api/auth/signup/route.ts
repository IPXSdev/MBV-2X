import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()
    const normalizedEmail = email.toLowerCase().trim()

    if (!normalizedEmail || !password || !name) {
      return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingUser } = await supabase.from("users").select("id").eq("email", normalizedEmail).single()
    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        email: normalizedEmail,
        name: name.trim(),
        password_hash: passwordHash,
        role: "user",
        tier: "creator",
        submission_credits: 3,
        is_verified: true, // Or false if you have an email verification flow
      })
      .select()
      .single()

    if (createError) {
      throw createError
    }

    // Create session
    const sessionToken = randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const { error: sessionError } = await supabase.from("user_sessions").insert({
      user_id: newUser.id,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
    })

    if (sessionError) {
      throw new Error("Failed to create session after signup")
    }

    const response = NextResponse.json({
      success: true,
      user: newUser,
      message: "Signup successful",
    })

    response.cookies.set("session-token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Signup API Error:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: "Internal server error", details: errorMessage }, { status: 500 })
  }
}
