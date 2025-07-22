import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { data: media, error } = await supabase.from("media").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching media:", error)
      return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 })
    }

    return NextResponse.json({ media: media || [] })
  } catch (error) {
    console.error("Admin media API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
