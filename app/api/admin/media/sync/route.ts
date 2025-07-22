import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    const supabase = await createClient()

    const { youtube_url, title, description } = await request.json()

    if (!youtube_url || !title) {
      return NextResponse.json({ error: "YouTube URL and title are required" }, { status: 400 })
    }

    // Extract video ID from YouTube URL
    const videoIdMatch = youtube_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    const videoId = videoIdMatch?.[1]

    if (!videoId) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 })
    }

    // Create media record
    const { data, error } = await supabase
      .from("media")
      .insert({
        title,
        description: description || "",
        media_type: "youtube",
        youtube_url,
        youtube_video_id: videoId,
        thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        uploaded_by: admin.id,
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error syncing YouTube video:", error)
      return NextResponse.json({ error: "Failed to sync YouTube video" }, { status: 500 })
    }

    return NextResponse.json({ media: data })
  } catch (error) {
    console.error("YouTube sync API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
