import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Check if this is a master dev login attempt
    const masterDevKey = process.env.MASTER_DEV_KEY_HARRIS
    const masterDevKeyIpxs = process.env.MASTER_DEV_KEY_IPXS

    if (password === masterDevKey || password === masterDevKeyIpxs) {
      // Handle master dev login
      let masterDevUser = null

      // Try to find existing master dev user
      const { data: existingUser } = await supabase.from("users").select("*").eq("email", email).single()

      if (existingUser) {
        masterDevUser = existingUser

        // Update existing user to ensure they have master dev privileges
        await supabase
          .from("users")
          .update({
            role: "master_dev",
            tier: "unlimited",
            submission_credits: 999999,
            is_verified: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingUser.id)
      } else {
        // Create new master dev user
        const hashedPassword = await bcrypt.hash(password, 12)

        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert({
            email,
            password_hash: hashedPassword,
            name: email.includes("harris") ? "Harris (Master Dev)" : "IPXS (Master Dev)",
            role: "master_dev",
            tier: "unlimited",
            submission_credits: 999999,
            is_verified: true,
            legal_waiver_accepted: true,
            compensation_type: "percentage",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (createError) {
          console.error("❌ Error creating master dev user:", createError)
          return NextResponse.json({ error: "Failed to create master dev user" }, { status: 500 })
        }

        masterDevUser = newUser
      }

      // Create session for master dev
      const sessionToken = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30) // 30 days

      await supabase.from("user_sessions").insert({
        user_id: masterDevUser.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
      })

      // Set session cookie
      const cookieStore = cookies()
      cookieStore.set("session-token", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      })

      return NextResponse.json({
        user: {
          id: masterDevUser.id,
          email: masterDevUser.email,
          name: masterDevUser.name,
          role: masterDevUser.role,
          tier: masterDevUser.tier,
          submission_credits: masterDevUser.submission_credits,
          is_verified: masterDevUser.is_verified,
        },
      })
    }

    // Regular user login
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("email", email).single()

    if (userError || !user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Create session
    const sessionToken = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days for regular users

    await supabase.from("user_sessions").insert({
      user_id: user.id,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
    })

    // Set session cookie
    const cookieStore = cookies()
    cookieStore.set("session-token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tier: user.tier,
        submission_credits: user.submission_credits,
        is_verified: user.is_verified,
      },
    })
  } catch (error) {
    console.error("❌ Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
