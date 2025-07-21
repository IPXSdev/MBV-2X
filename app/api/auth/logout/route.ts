import { NextResponse } from "next/server"
import { signOut } from "@/lib/supabase/auth"

export async function POST() {
  try {
    console.log("🚪 API /auth/logout: Starting logout...")
    await signOut()
    console.log("✅ API /auth/logout: Logout successful")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ API /auth/logout: Error:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
