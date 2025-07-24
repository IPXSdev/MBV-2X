import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/supabase/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ success: false, user: null, error: "No active session" }, { status: 401 })
    }

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error("Me API Error:", error)
    return NextResponse.json({ success: false, user: null, error: "Internal server error" }, { status: 500 })
  }
}
