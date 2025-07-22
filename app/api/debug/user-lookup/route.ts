import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is required",
        },
        { status: 400 },
      )
    }

    console.log("🔍 Looking up user:", email)

    const supabase = await createServiceClient()

    // Test 1: Basic user lookup
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .single()

    const result = {
      email: email.toLowerCase(),
      timestamp: new Date().toISOString(),
      tests: {
        userLookup: {
          success: !userError || userError.code === "PGRST116", // PGRST116 = not found (which is a valid result)
          userFound: !!user,
          error: userError?.message || null,
          errorCode: userError?.code || null,
        },
        userData: user || null,
      },
    }

    if (user) {
      // Test 2: Check if user has sessions
      const { data: sessions, error: sessionError } = await supabase
        .from("user_sessions")
        .select("id, session_token, expires_at, created_at")
        .eq("user_id", user.id)

      result.tests.sessions = {
        success: !sessionError,
        sessionCount: sessions?.length || 0,
        activeSessions: sessions?.filter((s) => new Date(s.expires_at) > new Date()).length || 0,
        error: sessionError?.message || null,
      }

      // Test 3: Master dev specific checks
      if (user.role === "master_dev") {
        const masterKeyHarris = process.env.MASTER_DEV_KEY_HARRIS || "TMBM_MAgSTE68_HAR_20h24_SEC4URE"
        const masterKeyIpxs = process.env.MASTER_DEV_KEY_IPXS || "TMBM_MASTER_KEY_IPXS_DEV_2024_SECURE"

        result.tests.masterDevAuth = {
          isHarris: user.email === "2668harris@gmail.com",
          isIpxs: user.email === "ipxsdev@gmail.com",
          expectedKey:
            user.email === "2668harris@gmail.com"
              ? masterKeyHarris
              : user.email === "ipxsdev@gmail.com"
                ? masterKeyIpxs
                : null,
          keySource:
            user.email === "2668harris@gmail.com"
              ? process.env.MASTER_DEV_KEY_HARRIS
                ? "Environment Variable"
                : "Default Value"
              : user.email === "ipxsdev@gmail.com"
                ? process.env.MASTER_DEV_KEY_IPXS
                  ? "Environment Variable"
                  : "Default Value"
                : "N/A",
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: user ? "User found in database" : "User not found in database",
      ...result,
    })
  } catch (error) {
    console.error("❌ User lookup error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "User lookup failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
