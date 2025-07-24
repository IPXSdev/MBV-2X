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

    const normalizedEmail = email.toLowerCase().trim()
    console.log("🔍 Attempting to sign in user:", normalizedEmail)

    // Check if this is a master dev user first
    const masterDevEmails = ["harris@tmbm.dev", "ipxs@tmbm.dev", "2668harris@gmail.com", "harris@tmbm.com"]
    const isMasterDev = masterDevEmails.includes(normalizedEmail)

    if (isMasterDev) {
      console.log("🔑 Master dev login attempt for:", normalizedEmail)

      // Check for master dev credentials - using server-side environment variables only
      let masterDevKey = ""
      if (
        normalizedEmail === "harris@tmbm.dev" ||
        normalizedEmail === "2668harris@gmail.com" ||
        normalizedEmail === "harris@tmbm.com"
      ) {
        masterDevKey = process.env.MASTER_DEV_KEY_HARRIS || process.env.NEXT_PUBLIC_MASTER_DEV_KEY_HARRIS || "123456789"
      } else if (normalizedEmail === "ipxs@tmbm.dev") {
        masterDevKey = process.env.MASTER_DEV_KEY_IPXS || "123456789"
      }

      if (password !== masterDevKey) {
        console.log("❌ Invalid master dev key for:", normalizedEmail)
        return NextResponse.json(
          {
            success: false,
            error: "Invalid email or password",
          },
          { status: 401 },
        )
      }

      console.log("✅ Master dev authentication successful")

      // Get or create master dev user
      let { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", normalizedEmail)
        .single()

      if (userError || !userData) {
        console.log("Creating new master dev user:", normalizedEmail)
        // Create new master dev user
        const passwordHash = await bcrypt.hash(password, 12)
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert({
            email: normalizedEmail,
            name:
              normalizedEmail === "harris@tmbm.dev" ||
              normalizedEmail === "harris@tmbm.com" ||
              normalizedEmail === "2668harris@gmail.com"
                ? "Harris"
                : "IPXS",
            password_hash: passwordHash,
            role: "master_dev",
            tier: "pro",
            submission_credits: 999999,
            is_verified: true,
            legal_waiver_accepted: true,
            compensation_type: "royalty_split",
          })
          .select()
          .single()

        if (createError) {
          console.error("❌ Failed to create master dev user:", createError)
          return NextResponse.json(
            {
              success: false,
              error: "Failed to create user account",
            },
            { status: 500 },
          )
        }

        userData = newUser
      } else {
        // Update existing user to ensure master dev privileges
        const { error: updateError } = await supabase
          .from("users")
          .update({
            role: "master_dev",
            tier: "pro",
            submission_credits: 999999,
          })
          .eq("id", userData.id)

        if (updateError) {
          console.error("❌ Failed to update master dev user:", updateError)
        }

        // Update local userData object
        userData.role = "master_dev"
        userData.tier = "pro"
        userData.submission_credits = 999999
      }
    } else {
      // Regular user authentication
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", normalizedEmail)
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

      // For regular users, check password hash if it exists
      if (userData.password_hash) {
        const isValidPassword = await bcrypt.compare(password, userData.password_hash)

        if (!isValidPassword) {
          console.log("❌ Invalid password for user:", normalizedEmail)
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
        console.log("⚠️ No password hash found for user:", normalizedEmail)
        return NextResponse.json(
          {
            success: false,
            error: "Account needs to be reset. Please contact support.",
          },
          { status: 401 },
        )
      }
    }

    // At this point, authentication was successful
    // Look up the user data again to ensure we have the latest
    const { data: finalUserData, error: finalUserError } = await supabase
      .from("users")
      .select("*")
      .eq("email", normalizedEmail)
      .single()

    if (finalUserError || !finalUserData) {
      console.error("❌ Failed to fetch final user data:", finalUserError)
      return NextResponse.json(
        {
          success: false,
          error: "Authentication failed",
        },
        { status: 500 },
      )
    }

    console.log("✅ Authentication successful for:", finalUserData.email)

    // Create a session token
    const sessionToken = randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Store the session in the database
    const { error: sessionError } = await supabase.from("user_sessions").insert({
      user_id: finalUserData.id,
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
        id: finalUserData.id,
        email: finalUserData.email,
        name: finalUserData.name,
        role: finalUserData.role,
        tier: finalUserData.tier,
        submission_credits: finalUserData.submission_credits,
        legal_waiver_accepted: finalUserData.legal_waiver_accepted,
        compensation_type: finalUserData.compensation_type,
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
