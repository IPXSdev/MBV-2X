import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, artistName, primaryGenre, legalWaiverAccepted, subscribeToNewsletter } =
      await request.json()
    const normalizedEmail = email.toLowerCase().trim()

    // --- Validation ---
    if (!normalizedEmail || !password || !name || !artistName || !primaryGenre) {
      return NextResponse.json({ error: "Missing required fields. Please complete the form." }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 })
    }
    if (!legalWaiverAccepted) {
      return NextResponse.json({ error: "The legal waiver must be accepted to create an account." }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingUser } = await supabase.from("users").select("id").eq("email", normalizedEmail).single()
    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    // --- Create New User ---
    // Aligned with the platform bible: new users are on the free 'creator' tier with 0 credits.
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        email: normalizedEmail,
        name: name.trim(),
        password_hash: passwordHash,
        artist_name: artistName.trim(),
        primary_genre: primaryGenre.trim(),
        role: "user",
        tier: "creator", // 'creator' is the free tier as per docs
        submission_credits: 0, // Free tier starts with 0 credits
        is_verified: true, // Auto-verified on signup
        legal_waiver_accepted: legalWaiverAccepted,
        subscribed_to_newsletter: subscribeToNewsletter,
      })
      .select()
      .single()

    if (createError) {
      console.error("Supabase user creation error:", createError)
      throw createError
    }

    // --- Create Session ---
    const sessionToken = randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const { error: sessionError } = await supabase.from("user_sessions").insert({
      user_id: newUser.id,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
    })

    if (sessionError) {
      console.error("Supabase session creation error:", sessionError)
      // Note: In a production scenario, you might want to handle this more gracefully,
      // perhaps by informing the user to try logging in.
      throw new Error("Failed to create session after signup.")
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
