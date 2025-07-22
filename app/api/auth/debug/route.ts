import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const supabase = createClient()

    // Test database connection
    const { data: testData, error: testError } = await supabase.from("users").select("count").limit(1)

    return NextResponse.json({
      user: user
        ? {
            id: user.id,
            email: user.email,
            role: user.role,
            tier: user.tier,
          }
        : null,
      database: {
        connected: !testError,
        error: testError?.message,
      },
      environment: {
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        MASTER_DEV_KEY_HARRIS: !!process.env.MASTER_DEV_KEY_HARRIS,
        MASTER_DEV_KEY_IPXS: !!process.env.MASTER_DEV_KEY_IPXS,
      },
    })
  } catch (error) {
    console.error("Auth debug error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
