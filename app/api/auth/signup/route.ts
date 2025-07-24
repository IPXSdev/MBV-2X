import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  console.log("Signup API: Received request.")
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Signup API Error: Server is missing Supabase environment variables.")
      return NextResponse.json({ error: "Server configuration error. Please contact support." }, { status: 500 })
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log("Signup API: Supabase client created.")

    const body = await request.json()
    const { email, password, name, artistName, primaryGenre, legalWaiverAccepted, subscribeToNewsletter } = body
    const normalizedEmail = email.toLowerCase().trim()
    console.log(`Signup API: Processing signup for ${normalizedEmail}.`)

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
    console.log("Signup API: Validation passed.")

    // Check if user already exists
    console.log("Signup API: Checking for existing user.")
    const { data: existingUser, error: existingUserError } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .single()

    if (existingUserError && existingUserError.code !== "PGRST116") {
      // PGRST116 means no rows found, which is good here.
      console.error("Signup API: DB error checking for existing user:", existingUserError)
      return NextResponse.json(
        { error: "Database error. Please try again later.", details: existingUserError.message },
        { status: 500 },
      )
    }
    if (existingUser) {
      console.log(`Signup API: User with email ${normalizedEmail} already exists.`)
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 })
    }
    console.log("Signup API: User does not exist. Proceeding.")

    const passwordHash = await bcrypt.hash(password, 10)
    console.log("Signup API: Password hashed.")

    // --- Create New User ---
    console.log("Signup API: Inserting new user into database.")
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        email: normalizedEmail,
        name: name.trim(),
        password_hash: passwordHash,
        artist_name: artistName.trim(),
        primary_genre: primaryGenre.trim(),
        role: "user",
        tier: "creator",
        submission_credits: 0,
        is_verified: true,
        legal_waiver_accepted: legalWaiverAccepted,
        subscribed_to_newsletter: subscribeToNewsletter,
      })
      .select()
      .single()

    if (createError || !newUser) {
      console.error("Signup API: Supabase user creation error:", createError)
      return NextResponse.json(
        { error: "Could not create your account. Please try again.", details: createError?.message },
        { status: 500 },
      )
    }
    console.log(`Signup API: New user created with ID: ${newUser.id}.`)

    // --- Create Session ---
    console.log(`Signup API: Creating session for user ${newUser.id}.`)
    const sessionToken = randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const { error: sessionError } = await supabase.from("user_sessions").insert({
      user_id: newUser.id,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
    })

    if (sessionError) {
      console.error("Signup API: Supabase session creation error:", sessionError)
      return NextResponse.json(
        {
          error: "Account created, but failed to log you in. Please try logging in manually.",
          details: sessionError.message,
        },
        { status: 500 },
      )
    }
    console.log(`Signup API: Session created for user ${newUser.id}.`)

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

    console.log(`Signup API: Responding with success for user ${newUser.id}.`)
    return response
  } catch (error) {
    console.error("Signup API: Unhandled exception in main try-catch block:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
    return NextResponse.json(
      { error: "An unexpected internal server error occurred.", details: errorMessage },
      { status: 500 },
    )
  }
}
