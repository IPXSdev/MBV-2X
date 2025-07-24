import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/supabase/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("🔍 Checking user session...")
    const user = await getCurrentUser()

    if (!user) {
      console.log("❌ No user session found")
      return NextResponse.json({ user: null })
    }

    console.log("✅ User session found:", user.email)
    return NextResponse.json({ user })
  } catch (error) {
    console.error("❌ Session check error:", error)
    return NextResponse.json({ user: null, error: "Session check failed" })
  }
}
