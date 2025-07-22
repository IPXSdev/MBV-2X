import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/supabase/auth"
import { createServiceClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    console.log("🔍 Starting authentication system test...")

    // Test environment variables
    const envVars = {
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      MASTER_DEV_KEY_HARRIS: !!process.env.MASTER_DEV_KEY_HARRIS,
      MASTER_DEV_KEY_IPXS: !!process.env.MASTER_DEV_KEY_IPXS,
    }

    console.log("📋 Environment variables:", envVars)

    // Test database connection
    const supabase = await createServiceClient()

    const { data: testConnection, error: connectionError } = await supabase.from("users").select("count").limit(1)

    if (connectionError) {
      console.error("❌ Database connection failed:", connectionError)
      return NextResponse.json(
        {
          status: "error",
          message: "Database connection failed",
          error: connectionError.message,
          envVars,
        },
        { status: 500 },
      )
    }

    console.log("✅ Database connection successful")

    // Test current user
    const currentUser = await getCurrentUser()
    console.log("👤 Current user:", currentUser ? `${currentUser.name} (${currentUser.role})` : "None")

    // Test table access
    const { data: userCount, error: userError } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })

    const { data: sessionCount, error: sessionError } = await supabase
      .from("user_sessions")
      .select("id", { count: "exact", head: true })

    return NextResponse.json({
      status: "success",
      message: "Authentication system is working correctly",
      details: {
        envVars,
        currentUser: currentUser
          ? {
              id: currentUser.id,
              name: currentUser.name,
              email: currentUser.email,
              role: currentUser.role,
              tier: currentUser.tier,
              credits: currentUser.submission_credits,
              verified: currentUser.is_verified,
            }
          : null,
        database: {
          connected: true,
          userCount: userCount || 0,
          sessionCount: sessionCount || 0,
          userError: userError?.message || null,
          sessionError: sessionError?.message || null,
        },
      },
    })
  } catch (error) {
    console.error("🚨 Authentication test failed:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Authentication test failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
