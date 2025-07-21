import { signOut } from "@/lib/supabase/auth"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    await signOut()
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
