import { NextResponse } from "next/server"
import { requireMasterDev } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    await requireMasterDev()
    const supabase = await createClient()

    // Export all system data
    const [users, submissions, media] = await Promise.all([
      supabase.from("users").select("*"),
      supabase.from("submissions").select("*"),
      supabase.from("media").select("*"),
    ])

    const exportData = {
      users: users.data || [],
      submissions: submissions.data || [],
      media: media.data || [],
      exportedAt: new Date().toISOString(),
      exportedBy: "master_dev",
    }

    const jsonContent = JSON.stringify(exportData, null, 2)

    return new NextResponse(jsonContent, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="system-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    })
  } catch (error) {
    console.error("Export data API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
