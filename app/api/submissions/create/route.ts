import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/supabase/auth"

export async function POST(request: NextRequest) {
  try {
    // Use the custom auth system
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has submission credits (unless master dev)
    if (user.role !== "master_dev" && user.submission_credits <= 0) {
      return NextResponse.json(
        {
          error: "No submission credits available. Please upgrade your plan or purchase credits.",
        },
        { status: 400 },
      )
    }

    const formData = await request.formData()

    // Validate required fields
    const title = formData.get("title") as string
    const artistName = formData.get("artistName") as string
    const genre = formData.get("genre") as string
    const description = formData.get("description") as string
    const audioFile = formData.get("audioFile") as File

    if (!title || !artistName || !genre || !audioFile) {
      return NextResponse.json(
        {
          error: "Missing required fields: title, artistName, genre, and audioFile are required",
        },
        { status: 400 },
      )
    }

    // Validate file type
    const allowedTypes = ["audio/mpeg", "audio/wav", "audio/mp3", "audio/x-wav"]
    if (!allowedTypes.includes(audioFile.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Please upload MP3 or WAV files only.",
        },
        { status: 400 },
      )
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        {
          error: "File too large. Maximum size is 50MB.",
        },
        { status: 400 },
      )
    }

    // Use service client for database operations
    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Upload file to Supabase Storage
    const fileName = `${user.id}/${Date.now()}-${audioFile.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("audio-submissions")
      .upload(fileName, audioFile)

    if (uploadError) {
      console.error("File upload error:", uploadError)
      return NextResponse.json(
        {
          error: "Failed to upload file",
          details: uploadError.message,
        },
        { status: 500 },
      )
    }

    // Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage.from("audio-submissions").getPublicUrl(fileName)

    // Parse mood tags if provided
    let moodTags: string[] = []
    const moodTagsString = formData.get("moodTags") as string
    if (moodTagsString) {
      try {
        moodTags = JSON.parse(moodTagsString)
      } catch {
        // If parsing fails, treat as comma-separated string
        moodTags = moodTagsString
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      }
    }

    // Create submission record
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .insert({
        user_id: user.id,
        title: title.trim(),
        artist_name: artistName.trim(),
        genre: genre.trim(),
        description: description?.trim() || null,
        file_url: urlData.publicUrl,
        file_size: audioFile.size,
        mood_tags: moodTags,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (submissionError) {
      console.error("Submission creation error:", submissionError)

      // Clean up uploaded file if submission creation fails
      await supabase.storage.from("audio-submissions").remove([fileName])

      return NextResponse.json(
        {
          error: "Failed to create submission",
          details: submissionError.message,
        },
        { status: 500 },
      )
    }

    // Deduct submission credit (unless master dev)
    if (user.role !== "master_dev") {
      const { error: creditError } = await supabase
        .from("users")
        .update({
          submission_credits: user.submission_credits - 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (creditError) {
        console.error("Credit deduction error:", creditError)
        // Don't fail the submission, but log the error
      }
    }

    return NextResponse.json({
      success: true,
      message: "Submission created successfully",
      submission,
    })
  } catch (error) {
    console.error("Submission creation error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
