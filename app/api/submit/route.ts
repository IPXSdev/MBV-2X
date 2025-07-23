import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/supabase/auth"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has submission credits
    if (user.submission_credits <= 0 && user.role !== "master_dev") {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          message: "You need submission credits to submit music",
        },
        { status: 400 },
      )
    }

    const body = await request.json()

    // Transform old format to new format
    const transformedBody = {
      track_title: body.title,
      artist_name: body.artistName,
      genre: body.genre,
      mood_tags: body.moodTags ? JSON.parse(body.moodTags) : [],
      description: body.description,
      file_url: body.file_url,
      file_size: body.file_size || 0,
      duration: body.duration || 0,
    }

    // Forward to new endpoint
    const response = await fetch(new URL("/api/submissions/create", request.url), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...Object.fromEntries(request.headers.entries()),
      },
      body: JSON.stringify(transformedBody),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Error in submission creation:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
