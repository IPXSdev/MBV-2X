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

    // Master Dev Login
    const masterDevEmails = ["harris@tmbm.dev", "ipxs@tmbm.dev", "2668harris@gmail.com"]
    if (masterDevEmails.includes(normalizedEmail)) {
      const harrisKey = process.env.MASTER_DEV_KEY_HARRIS
      const ipxsKey = process.env.MASTER_DEV_KEY_IPXS

      const isHarris =
        (normalizedEmail === "harris@tmbm.dev" || normalizedEmail === "2668harris@gmail.com") && password === harrisKey
      const isIpxs = normalizedEmail === "ipxs@tmbm.dev" && password === ipxsKey

      if (isHarris || isIpxs) {
        let { data: user, error: userError } = await supabase
          .from("users")
          .select<"*", User>("*")
          .eq("email", normalizedEmail)
          .single()

        if (userError && userError.code === "PGRST116") {
          // User not found, create them with master_dev role
          const { data: newUser, error: createError } = await supabase
            .from("users")
            .insert({
              email: normalizedEmail,
              name: isHarris ? "Harris" : "IPXS",
              role: "master_dev",
              tier: "pro",
              submission_credits: 999999,
              is_verified: true,
            })
            .select()
            .single()

          if (createError) throw createError
          user = newUser as User
        } else if (userError) {
          throw userError
        }

        const response = NextResponse.json({ success: true, user, message: "Master dev login successful" })
        await createSession(user!.id, response)
        return response
      }
    }

    // Regular User Login
    const { data: user, error: userError } = await supabase
      .from("users")
      .select<"*", User>("*")
      .eq("email", normalizedEmail)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    if (!user.password_hash) {
      return NextResponse.json({ error: "Account requires password reset" }, { status: 401 })
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
