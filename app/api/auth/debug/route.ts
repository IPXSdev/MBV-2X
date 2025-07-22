import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/supabase/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()
    const supabase = await createServiceClient()

    // Test database connection
    const { data: testData, error: testError } = await supabase.from("users").select("email, role").limit(1)

    // Check environment variables
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      MASTER_DEV_KEY_HARRIS: process.env.MASTER_DEV_KEY_HARRIS || "TMBM_MAgSTE68_HAR_20h24_SEC4URE",
      MASTER_DEV_KEY_IPXS: process.env.MASTER_DEV_KEY_IPXS || "TMBM_MASTER_KEY_IPXS_DEV_2024_SECURE",
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
    }

    return NextResponse.json({
      user,
      database: {
        connected: !testError,
        error: testError?.message,
        testData,
      },
      environment: envCheck,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Debug endpoint error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
