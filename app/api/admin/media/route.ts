import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || (user.role !== "admin" && user.role !== "master_dev")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const supabase = createClient()

    const { data: media, error } = await supabase.from("media").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching media:", error)
      return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 })
    }

    return NextResponse.json({ media })
  } catch (error) {
    console.error("Admin media API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
