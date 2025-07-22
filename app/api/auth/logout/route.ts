import { NextResponse } from "next/server"
import { signOut } from "@/lib/supabase/auth"

export async function POST() {
  try {
    const result = await signOut()

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ message: "Logged out successfully" })
  } catch (error) {
    console.error("Logout API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
