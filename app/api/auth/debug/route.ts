import { getCurrentUser } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const user = await getCurrentUser()
    const supabase = await createClient()

    // Test database connection
    const { data: dbTest, error: dbError } = await supabase.from("users").select("count").limit(1)

    const debugInfo = {
      timestamp: new Date().toISOString(),
      user: user
        ? {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tier: user.tier,
          }
        : null,
      database: {
        connected: !dbError,
        error: dbError?.message || null,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasMasterKeys: !!(process.env.MASTER_DEV_KEY_HARRIS && process.env.MASTER_DEV_KEY_IPXS),
      },
    }

    return NextResponse.json(debugInfo)
  } catch (error) {
    return NextResponse.json(
      {
        error: "Debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
