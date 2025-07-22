import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("tier, submission_credits")
      .eq("id", session.user.id)
      .single()

    if (userError) {
      return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
    }

    // Check if user has credits
    if (userData.submission_credits <= 0 && userData.tier === "creator") {
      return NextResponse.json({ error: "No submission credits available" }, { status: 403 })
    }

    // Parse request body
    const formData = await request.formData()
    const title = formData.get("title") as string
    const artist = formData.get("artist") as string
    const genre = formData.get("genre") as string
    const description = formData.get("description") as string
    const moodTags = formData.get("mood_tags") as string
    const file = formData.get("file") as File

    // Validate required fields
    if (!title || !artist || !genre || !file) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate file type
    const acceptedTypes = ["audio/mpeg", "audio/wav", "audio/x-m4a", "audio/aac"]
    if (!acceptedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 })
    }

    // Upload file to Supabase Storage
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `submissions/${session.user.id}/${fileName}`

    const { error: uploadError, data: uploadData } = await supabase.storage.from("audio").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (uploadError) {
      return NextResponse.json({ error: `Error uploading file: ${uploadError.message}` }, { status: 500 })
    }

    // Get public URL for the uploaded file
    const {
      data: { publicUrl },
    } = supabase.storage.from("audio").getPublicUrl(filePath)

    // Parse mood tags
    const parsedMoodTags = moodTags
      ? moodTags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : []

    // Create submission record in database
    const { error: submissionError, data: submission } = await supabase
      .from("submissions")
      .insert({
        user_id: session.user.id,
        title,
        artist,
        genre,
        description,
        mood_tags: parsedMoodTags,
        file_url: publicUrl,
        status: "pending",
      })
      .select()
      .single()

    if (submissionError) {
      return NextResponse.json({ error: `Error creating submission: ${submissionError.message}` }, { status: 500 })
    }

    // Deduct credit from user if not pro tier
    if (userData.tier !== "pro") {
      const { error: creditError } = await supabase
        .from("users")
        .update({ submission_credits: userData.submission_credits - 1 })
        .eq("id", session.user.id)

      if (creditError) {
        console.error("Error updating credits:", creditError)
        // Continue anyway, the submission is already created
      }
    }

    // Log activity
    await supabase.from("activity").insert({
      user_id: session.user.id,
      activity_type: "submission",
      description: `Submitted track: ${title}`,
    })

    return NextResponse.json({ success: true, submission })
  } catch (error: any) {
    console.error("Error creating submission:", error)
    return NextResponse.json({ error: error.message || "Failed to create submission" }, { status: 500 })
  }
}
