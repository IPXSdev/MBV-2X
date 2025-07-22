import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    const supabase = await createClient()

    const { title, description, media_type, file_url, thumbnail_url } = await request.json()

    if (!title || !media_type) {
      return NextResponse.json({ error: "Title and media type are required" }, { status: 400 })
    }

    // Create media record
    const { data, error } = await supabase
      .from("media")
      .insert({
        title,
        description: description || "",
        media_type,
        file_url: file_url || null,
        thumbnail_url: thumbnail_url || null,
        uploaded_by: admin.id,
        is_public: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error adding media:", error)
      return NextResponse.json({ error: "Failed to add media" }, { status: 500 })
    }

    return NextResponse.json({ media: data })
  } catch (error) {
    console.error("Add media API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
