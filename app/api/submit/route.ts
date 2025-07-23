import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
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

    const formData = await request.formData()
    const title = formData.get("title") as string
    const artistName = formData.get("artistName") as string
    const genre = formData.get("genre") as string
    const description = formData.get("description") as string
    const audioFile = formData.get("audio") as File
    const moodTagsStr = formData.get("moodTags") as string

    let moodTags: string[] = []
    try {
      moodTags = JSON.parse(moodTagsStr || "[]")
    } catch (e) {
      console.error("Error parsing mood tags:", e)
    }

    if (!title || !artistName) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          message: "Track title and artist name are required",
        },
        { status: 400 },
      )
    }

    let fileUrl = ""
    let fileSize = 0

    // Upload file to Supabase storage if provided
    if (audioFile && audioFile.size > 0) {
      const supabase = await createClient()
      const fileExt = audioFile.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `submissions/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("audio-submissions")
        .upload(filePath, audioFile, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        console.error("Upload error:", uploadError)
        return NextResponse.json(
          {
            error: "File upload failed",
            details: uploadError.message,
          },
          { status: 500 },
        )
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("audio-submissions").getPublicUrl(filePath)

      fileUrl = publicUrl
      fileSize = audioFile.size
    }

    const supabase = await createClient()

    // Create the submission
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .insert({
        user_id: user.id,
        track_title: title,
        artist_name: artistName,
        genre,
        mood_tags: moodTags,
        description,
        file_url: fileUrl,
        file_size: fileSize,
        status: "pending",
        credits_used: 1,
      })
      .select()
      .single()

    if (submissionError) {
      console.error("Error creating submission:", submissionError)
      return NextResponse.json(
        {
          error: "Failed to create submission",
          details: submissionError.message,
        },
        { status: 500 },
      )
    }

    // Deduct credits from user (unless master_dev)
    if (user.role !== "master_dev") {
      const { error: creditError } = await supabase
        .from("users")
        .update({
          submission_credits: Math.max(0, user.submission_credits - 1),
        })
        .eq("id", user.id)

      if (creditError) {
        console.error("Error updating credits:", creditError)
        // Don't fail the submission, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      submission,
    })
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
