import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"
import type { User } from "@/lib/types"

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
  const harrisKey = process.env.MASTER_DEV_KEY_HARRIS
  const ipxsKey = process.env.MASTER_DEV_KEY_IPXS

  if (!supabaseUrl || !supabaseServiceKey || !harrisKey || !ipxsKey) {
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

    // 2. Master Dev Login Logic
    const isMasterDev =
      (normalizedEmail === "2668harris@gmail.com" && password === harrisKey) ||
      (normalizedEmail === "ipxsdev@gmail.com" && password === ipxsKey)

    let user: User | null = null

    if (isMasterDev) {
      const { data: masterUser, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("email", normalizedEmail)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("DB Error fetching master dev:", fetchError)
        return NextResponse.json(
          { error: "Database error during login.", details: fetchError.message },
          { status: 500 },
        )
      }

      if (masterUser) {
        user = masterUser
      } else {
        // Create master dev user if they don't exist
        const { data: newMasterUser, error: createError } = await supabase
          .from("users")
          .insert({
            email: normalizedEmail,
            name: normalizedEmail === "2668harris@gmail.com" ? "Harris (Master Dev)" : "IPXS (Master Dev)",
            role: "master_dev",
            tier: "pro",
            submission_credits: 999999,
            is_verified: true,
            legal_waiver_accepted: true,
          })
          .select()
          .single()

        if (createError) {
          console.error("DB Error creating master dev:", createError)
          return NextResponse.json(
            { error: "Database error creating master dev account.", details: createError.message },
            { status: 500 },
          )
        }
        user = newMasterUser as User
      }
    } else {
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
      user = regularUser
    }

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
