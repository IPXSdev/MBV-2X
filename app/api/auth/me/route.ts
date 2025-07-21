import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/supabase/auth"

export async function GET() {
  try {
    console.log("🔍 API /auth/me: Starting user lookup...")
    const user = await getCurrentUser()

    if (!user) {
      console.log("❌ API /auth/me: No user found")
      return NextResponse.json({ user: null }, { status: 200 })
    }

    console.log("✅ API /auth/me: User found:", user.email, "Role:", user.role)
    return NextResponse.json({ user }, { status: 200 })
  } catch (error) {
    console.error("❌ API /auth/me: Error:", error)
    return NextResponse.json({ error: "Internal server error", user: null }, { status: 500 })
  }
}
