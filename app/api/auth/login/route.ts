import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"
import type { User } from "@/lib/types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createSession(userId: string, response: NextResponse) {
  const sessionToken = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const { error: sessionError } = await supabase.from("user_sessions").insert({
    user_id: userId,
    session_token: sessionToken,
    expires_at: expiresAt.toISOString(),
  })

  if (sessionError) {
    console.error("Failed to create session:", sessionError)
    throw new Error("Failed to create session")
  }

  response.cookies.set("session-token", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  })
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    const normalizedEmail = email.toLowerCase().trim()

    if (!normalizedEmail || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Master Dev Login Logic
    const harrisEmail = "2668harris@gmail.com"
    const ipxsEmail = "ipxsdev@gmail.com"
    const harrisKey = process.env.MASTER_DEV_KEY_HARRIS
    const ipxsKey = process.env.MASTER_DEV_KEY_IPXS

    let isMasterDev = false
    if (
      (normalizedEmail === harrisEmail && password === harrisKey) ||
      (normalizedEmail === ipxsEmail && password === ipxsKey)
    ) {
      isMasterDev = true
    }

    if (isMasterDev) {
      let { data: user, error: userError } = await supabase
        .from("users")
        .select<"*", User>("*")
        .eq("email", normalizedEmail)
        .single()

      if (userError && userError.code !== "PGRST116") {
        console.error("Master Dev Login - DB Error fetching user:", userError)
        return NextResponse.json(
          { error: "Database error while fetching master dev user.", details: userError.message },
          { status: 500 },
        )
      }

      if (!user) {
        // User not found, create them
        console.log(`Master dev user ${normalizedEmail} not found. Creating...`)
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert({
            email: normalizedEmail,
            name: normalizedEmail === harrisEmail ? "Harris (Master Dev)" : "IPXS (Master Dev)",
            role: "master_dev",
            tier: "pro",
            submission_credits: 999999,
            is_verified: true,
            legal_waiver_accepted: true,
          })
          .select()
          .single()

        if (createError) {
          console.error("Master Dev Login - DB Error creating user:", createError)
          return NextResponse.json(
            { error: "Database error while creating master dev user.", details: createError.message },
            { status: 500 },
          )
        }
        user = newUser as User
      }

      if (!user) {
        console.error("Master Dev Login - User is null after fetch/create.")
        return NextResponse.json({ error: "Failed to retrieve or create master dev user." }, { status: 500 })
      }

      const response = NextResponse.json({ success: true, user, message: "Master dev login successful" })
      await createSession(user.id, response)
      return response
    }

    // Regular User Login Logic
    const { data: user, error: userError } = await supabase
      .from("users")
      .select<"*", User>("*")
      .eq("email", normalizedEmail)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    if (!user.password_hash) {
      return NextResponse.json({ error: "Account requires password reset. Please contact support." }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const response = NextResponse.json({ success: true, user, message: "Login successful" })
    await createSession(user.id, response)
    return response
  } catch (error) {
    console.error("Login API Error:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: "Internal server error", details: errorMessage }, { status: 500 })
  }
}
