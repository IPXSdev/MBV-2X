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

      let isValidMasterDev = false

      // Check master dev credentials
      if (
        normalizedEmail === "harris@tmbm.dev" ||
        normalizedEmail === "2668harris@gmail.com" ||
        normalizedEmail === "harris@tmbm.com"
      ) {
        const masterDevKey = process.env.MASTER_DEV_KEY_HARRIS || "123456789"
        console.log("🔑 Checking Harris master dev key")
        if (password === masterDevKey) {
          console.log("✅ Harris master dev authentication successful")
          isValidMasterDev = true
        } else {
          console.log("❌ Harris master dev key mismatch")
        }
      } else if (normalizedEmail === "ipxs@tmbm.dev") {
        const masterDevKey = process.env.MASTER_DEV_KEY_IPXS
        console.log("🔑 Checking IPXS master dev key")
        if (password === masterDevKey) {
          console.log("✅ IPXS master dev authentication successful")
          isValidMasterDev = true
        } else {
          console.log("❌ IPXS master dev key mismatch")
        }
      }

      if (isValidMasterDev) {
        // Look up or create master dev user
        let { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("email", normalizedEmail)
          .single()

        if (userError || !userData) {
          console.log("🆕 Creating new master dev user")
          // Create new master dev user
          const hashedPassword = await bcrypt.hash(password, 12)

          const { data: newUser, error: createError } = await supabase
            .from("users")
            .insert({
              email: normalizedEmail,
              password_hash: hashedPassword,
              name: normalizedEmail.includes("harris") ? "Harris (Master Dev)" : "IPXS (Master Dev)",
              role: "master_dev",
              tier: "pro",
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
            return NextResponse.json(
              {
                success: false,
                error: "Failed to create master dev user",
              },
              { status: 500 },
            )
          }

          userData = newUser
        } else {
          // Update existing user to ensure master dev privileges
          await supabase
            .from("users")
            .update({
              role: "master_dev",
              tier: "pro",
              submission_credits: 999999,
              is_verified: true,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userData.id)
        }

        // Create session for master dev
        const sessionToken = randomBytes(32).toString("hex")
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

        const { error: sessionError } = await supabase.from("user_sessions").insert({
          user_id: userData.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
        })

        if (sessionError) {
          console.error("❌ Failed to create master dev session:", sessionError)
          return NextResponse.json(
            {
              success: false,
              error: "Failed to create session",
            },
            { status: 500 },
          )
        }

        const response = NextResponse.json({
          success: true,
          user: {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: "master_dev",
            tier: "pro",
            submission_credits: 999999,
            is_verified: true,
            legal_waiver_accepted: userData.legal_waiver_accepted,
            compensation_type: userData.compensation_type,
          },
          message: "Master dev login successful",
        })

        response.cookies.set("session-token", sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 30 * 24 * 60 * 60, // 30 days
          path: "/",
        })

        console.log("✅ Master dev login completed successfully")
        return response
      } else {
        console.log("❌ Invalid master dev key for:", normalizedEmail)
        return NextResponse.json(
          {
            success: false,
            error: "Invalid email or password",
          },
          { status: 401 },
        )
      }
    }

    // Regular user authentication
    console.log("👤 Regular user login attempt for:", normalizedEmail)
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

    console.log("✅ User found in database:", userData.email)

    // Verify password for regular users
    if (!userData.password_hash) {
      console.log("⚠️ No password hash found for user:", normalizedEmail)
      return NextResponse.json(
        {
          success: false,
          error: "Account needs to be reset. Please contact support.",
        },
        { status: 401 },
      )
    }

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

    console.log("✅ Regular user authentication successful for:", userData.email)

    // Create session for regular user
    const sessionToken = randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

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

    const response = NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role || "user",
        tier: userData.tier || "creator",
        submission_credits: userData.submission_credits || 3,
        is_verified: userData.is_verified,
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

    console.log("✅ Regular user login completed successfully")
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
