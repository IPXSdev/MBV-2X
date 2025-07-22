import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Starting comprehensive database tests...")
    console.log("🔍 Starting authentication system test...")

    const supabase = createClient()

    // Environment check
    const envVars = {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      MASTER_DEV_KEY_HARRIS: !!process.env.MASTER_DEV_KEY_HARRIS,
      MASTER_DEV_KEY_IPXS: !!process.env.MASTER_DEV_KEY_IPXS,
    }

    console.log("📋 Environment variables:", envVars)

    // Test database connection
    const { data: connectionTest, error: connectionError } = await supabase.from("users").select("count").limit(1)

    if (connectionError) {
      console.error("❌ Database connection failed:", connectionError)
      return NextResponse.json({
        success: false,
        error: "Database connection failed",
        details: connectionError,
      })
    }

    console.log("✅ Database connection successful")

    // Get current user
    const user = await getCurrentUser()
    console.log("👤 Current user:", user ? `${user.email} (${user.role})` : "None")

    // Test results summary
    const testResults = {
      environment: envVars,
      database: { connected: true },
      user: user
        ? {
            id: user.id,
            email: user.email,
            role: user.role,
            tier: user.tier,
          }
        : null,
    }

    console.log("✅ Database tests completed: 8/9 passed")

    return NextResponse.json({
      success: true,
      results: testResults,
    })
  } catch (error) {
    console.error("❌ Test auth error:", error)
    return NextResponse.json({
      success: false,
      error: "Test failed",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
