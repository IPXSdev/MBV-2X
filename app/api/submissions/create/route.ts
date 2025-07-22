import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/supabase/auth"
import { createServiceClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user can submit (not creator tier and has credits)
    if (user.tier === "creator") {
      return NextResponse.json({ error: "Creator tier cannot submit music. Please upgrade." }, { status: 403 })
    }

    if (user.submission_credits === 0) {
      return NextResponse.json(
        { error: "No submission credits remaining. Please purchase more credits." },
        { status: 403 },
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const title = formData.get("title") as string
    const artistName = formData.get("artistName") as string
    const genre = formData.get("genre") as string
    const description = formData.get("description") as string
    const moodTagsStr = formData.get("moodTags") as string

    // Validate required fields
    if (!file || !title || !artistName || !genre) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["audio/mpeg", "audio/wav", "audio/mp3", "audio/m4a", "audio/aac"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload MP3, WAV, M4A, or AAC files." },
        { status: 400 },
      )
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 50MB" }, { status: 400 })
    }

    let moodTags: string[] = []
    try {
      moodTags = JSON.parse(moodTagsStr || "[]")
    } catch {
      moodTags = []
    }

    const supabase = await createServiceClient()

    // Upload file to Supabase Storage
    const fileExt = file.name.split(".").pop()
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage.from("submissions").upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    })

    if (uploadError) {
      console.error("File upload error:", uploadError)
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }

    // Get public URL for the uploaded file
    const {
      data: { publicUrl },
    } = supabase.storage.from("submissions").getPublicUrl(fileName)

    // Create submission record
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .insert({
        user_id: user.id,
        title: title.trim(),
        artist_name: artistName.trim(),
        genre,
        mood_tags: moodTags,
        file_url: publicUrl,
        status: "pending",
        description: description?.trim() || null,
      })
      .select()
      .single()

    if (submissionError) {
      console.error("Submission creation error:", submissionError)
      // Clean up uploaded file if submission creation fails
      await supabase.storage.from("submissions").remove([fileName])
      return NextResponse.json({ error: "Failed to create submission" }, { status: 500 })
    }

    // Deduct submission credit (unless unlimited)
    if (user.submission_credits !== 999999) {
      const { error: creditError } = await supabase
        .from("users")
        .update({
          submission_credits: user.submission_credits - 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (creditError) {
        console.error("Credit deduction error:", creditError)
        // Don't fail the submission if credit deduction fails, just log it
      }
    }

    // Log activity
    try {
      await supabase.from("user_activity").insert({
        user_id: user.id,
        type: "submission",
        title: "New Track Submitted",
        description: `Submitted "${title}" by ${artistName}`,
        metadata: {
          submission_id: submission.id,
          genre,
          mood_tags: moodTags,
        },
      })
    } catch (error) {
      console.error("Activity logging error:", error)
      // Don't fail submission if activity logging fails
    }

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        title: submission.title,
        artist_name: submission.artist_name,
        status: submission.status,
        created_at: submission.created_at,
      },
    })
  } catch (error) {
    console.error("Submission API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
