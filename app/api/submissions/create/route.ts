import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/supabase/auth"

export async function POST(request: NextRequest) {
  try {
    console.log("🎵 Creating new submission...")

    // Get session token from cookies
    const sessionToken = request.cookies.get("session-token")?.value

    if (!sessionToken) {
      console.log("❌ No session token found")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Get current user
    const user = await getCurrentUser(sessionToken)
    if (!user) {
      console.log("❌ Invalid session token")
      return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 })
    }

    console.log("✅ User authenticated:", user.email)

    // Check if user has submission credits
    if (user.submission_credits <= 0 && user.role !== "master_dev") {
      console.log("❌ User has no submission credits")
      return NextResponse.json({ success: false, error: "No submission credits remaining" }, { status: 403 })
    }

    const formData = await request.formData()

    const title = formData.get("title") as string
    const artistName = formData.get("artistName") as string
    const genre = formData.get("genre") as string
    const description = formData.get("description") as string
    const audioFile = formData.get("audioFile") as File

    // Validate required fields
    if (!title || !artistName || !genre || !audioFile) {
      console.log("❌ Missing required fields")
      return NextResponse.json({ success: false, error: "All fields are required" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["audio/mpeg", "audio/wav", "audio/mp3", "audio/m4a"]
    if (!allowedTypes.includes(audioFile.type)) {
      console.log("❌ Invalid file type:", audioFile.type)
      return NextResponse.json(
        { success: false, error: "Invalid file type. Please upload MP3, WAV, or M4A files only." },
        { status: 400 },
      )
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (audioFile.size > maxSize) {
      console.log("❌ File too large:", audioFile.size)
      return NextResponse.json({ success: false, error: "File size must be less than 50MB" }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Upload file to storage
    const fileExt = audioFile.name.split(".").pop()
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

    console.log("📁 Uploading file to storage:", fileName)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("audio-submissions")
      .upload(fileName, audioFile, {
        contentType: audioFile.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("❌ Storage upload error:", uploadError)
      return NextResponse.json({ success: false, error: "Failed to upload audio file" }, { status: 500 })
    }

    console.log("✅ File uploaded successfully:", uploadData.path)

    // Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage.from("audio-submissions").getPublicUrl(uploadData.path)

    // Create submission record
    const { data: submission, error: dbError } = await supabase
      .from("submissions")
      .insert({
        user_id: user.id,
        title: title.trim(),
        artist_name: artistName.trim(),
        genre: genre.trim(),
        description: description?.trim() || null,
        audio_file_url: urlData.publicUrl,
        audio_file_name: audioFile.name,
        audio_file_size: audioFile.size,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (dbError) {
      console.error("❌ Database error creating submission:", dbError)

      // Clean up uploaded file if database insert fails
      await supabase.storage.from("audio-submissions").remove([uploadData.path])

      return NextResponse.json({ success: false, error: "Failed to create submission record" }, { status: 500 })
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
        console.error("❌ Error updating submission credits:", creditError)
        // Don't fail the request, just log the error
      }
    }

    console.log("✅ Submission created successfully:", submission.id)

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        title: submission.title,
        artist_name: submission.artist_name,
        genre: submission.genre,
        description: submission.description,
        status: submission.status,
        created_at: submission.created_at,
      },
      message: "Submission created successfully",
    })
  } catch (error) {
    console.error("❌ Error in submission creation API:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
