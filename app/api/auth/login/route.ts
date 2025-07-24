import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  try {
    console.log("🔐 Login request received")

    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      console.log("❌ Missing email or password")
      return NextResponse.json(
        {
          success: false,
          error: "Email and password are required",
        },
        { status: 400 },
      )
    }

    console.log("🔍 Attempting to sign in user:", email)

    // Look up user in database
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .single()

    if (userError || !userData) {
      console.log("❌ User not found in database:", userError?.message)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password",
        },
        { status: 401 },
      )
    }

    console.log("✅ User found in database:", userData.email)

    // Check if this is a master dev user
    const masterDevEmails = ["harris@tmbm.dev", "ipxs@tmbm.dev", "2668harris@gmail.com"]
    const isMasterDev = masterDevEmails.includes(email.toLowerCase())

    let isValidPassword = false

    if (isMasterDev) {
      console.log("🔑 Master dev login attempt")

      // Check for master dev credentials
      if (email.toLowerCase() === "harris@tmbm.dev" || email.toLowerCase() === "2668harris@gmail.com") {
        const masterDevKey = process.env.NEXT_PUBLIC_MASTER_DEV_KEY_HARRIS || "123456789"
        if (password === masterDevKey) {
          console.log("✅ Master dev authentication successful")
          isValidPassword = true
        }
      } else if (email.toLowerCase() === "ipxs@tmbm.dev") {
        const masterDevKey = process.env.MASTER_DEV_KEY_IPXS
        if (password === masterDevKey) {
          console.log("✅ Master dev authentication successful")
          isValidPassword = true
        }
      }

      if (!isValidPassword) {
        console.log("❌ Invalid master dev key")
        return NextResponse.json(
          {
            success: false,
            error: "Invalid email or password",
          },
          { status: 401 },
        )
      }
    } else {
      // For regular users, check password hash if it exists
      if (userData.password_hash) {
        isValidPassword = await bcrypt.compare(password, userData.password_hash)

        if (!isValidPassword) {
          console.log("❌ Invalid password for user:", email)
          return NextResponse.json(
            {
              success: false,
              error: "Invalid email or password",
            },
            { status: 401 },
          )
        }
      } else {
        // If no password hash exists, this might be an old account
        console.log("⚠️ No password hash found for user:", email)
        return NextResponse.json(
          {
            success: false,
            error: "Account needs to be reset. Please contact support.",
          },
          { status: 401 },
        )
      }
    }

    console.log("✅ Authentication successful for:", userData.email)

    // Create a session token
    const sessionToken = randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Store the session in the database
    const { error: sessionError } = await supabase.from("user_sessions").insert({
      user_id: userData.id,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
    })

    if (sessionError) {
      console.error("❌ Failed to create session:", sessionError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create session",
        },
        { status: 500 },
      )
    }

    // Set the session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role || (isMasterDev ? "master_dev" : "user"),
        tier: userData.tier || (isMasterDev ? "pro" : "creator"),
        submission_credits: userData.submission_credits || (isMasterDev ? 999999 : 3),
        legal_waiver_accepted: userData.legal_waiver_accepted,
        compensation_type: userData.compensation_type,
      },
      message: "Login successful",
    })

    response.cookies.set("session-token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    console.log("✅ Login completed successfully")
    return response
  } catch (error) {
    console.error("❌ Login API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during login",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
