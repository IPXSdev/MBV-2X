import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/supabase/auth"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    console.log("🎵 Creating new submission...")

    // Use custom auth system
    const user = await getCurrentUser()

    if (!user) {
      console.log("❌ No authenticated user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("✅ User authenticated:", user.email)

    // Check if user has submission credits (unless master dev)
    if (user.role !== "master_dev" && (user.submission_credits || 0) <= 0) {
      console.log("❌ User has no submission credits")
      return NextResponse.json(
        {
          error: "No submission credits remaining",
          message: "You need submission credits to submit music",
        },
        { status: 400 },
      )
    }

    const body = await request.json()
    console.log("📝 Submission data received:", {
      track_title: body.track_title || body.title,
      artist_name: body.artist_name || body.artist,
      genre: body.genre,
    })

    // Transform old format to new format if needed
    const submissionData = {
      track_title: body.track_title || body.title,
      artist_name: body.artist_name || body.artist,
      genre: body.genre,
      mood_tags: Array.isArray(body.mood_tags) ? body.mood_tags : body.moodTags ? JSON.parse(body.moodTags) : [],
      description: body.description,
      file_url: body.file_url,
      file_size: body.file_size || 0,
      duration: body.duration || 0,
    }

    // Validate required fields
    if (!submissionData.track_title || !submissionData.artist_name) {
      console.log("❌ Missing required fields")
      return NextResponse.json(
        {
          error: "Missing required fields",
          message: "Track title and artist name are required",
        },
        { status: 400 },
      )
    }

    // Use service client for database operations
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    console.log("💾 Inserting submission into database...")

    // Create submission
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .insert({
        user_id: user.id,
        track_title: submissionData.track_title,
        artist_name: submissionData.artist_name,
        genre: submissionData.genre || "Other",
        mood_tags: submissionData.mood_tags,
        description: submissionData.description,
        file_url: submissionData.file_url,
        file_size: submissionData.file_size,
        duration: submissionData.duration,
        status: "pending",
        credits_used: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(`
        *,
        users:user_id (
          id,
          name,
          email,
          tier
        )
      `)
      .single()

    if (submissionError) {
      console.error("❌ Submission error:", submissionError)
      return NextResponse.json(
        {
          error: "Failed to create submission",
          details: submissionError.message,
        },
        { status: 500 },
      )
    }

    console.log("✅ Submission created successfully:", submission.id)

    // Deduct submission credit (unless master dev)
    if (user.role !== "master_dev") {
      console.log("💳 Deducting submission credit...")
      const { error: creditError } = await supabase
        .from("users")
        .update({
          submission_credits: Math.max(0, (user.submission_credits || 0) - 1),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (creditError) {
        console.error("⚠️ Credit deduction error:", creditError)
        // Don't fail the submission if credit deduction fails
      } else {
        console.log("✅ Credit deducted successfully")
      }
    }

    return NextResponse.json({
      success: true,
      submission,
      message: "Track submitted successfully!",
    })
  } catch (error) {
    console.error("❌ Error in submission creation:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
