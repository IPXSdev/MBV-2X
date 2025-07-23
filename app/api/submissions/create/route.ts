import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user details including credits
    const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", user.id).single()

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user has submission credits
    if (userData.submission_credits <= 0 && userData.role !== "master_dev") {
      return NextResponse.json({ error: "No submission credits remaining" }, { status: 400 })
    }

    const body = await request.json()
    const { track_title, artist_name, genre, mood_tags, description, file_url, file_size, duration } = body

    // Validate required fields
    if (!track_title || !artist_name || !genre) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create submission
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .insert({
        user_id: user.id,
        track_title,
        artist_name,
        genre,
        mood_tags: mood_tags || [],
        description,
        file_url,
        file_size: file_size || 0,
        duration: duration || 0,
        status: "pending",
        credits_used: 1,
      })
      .select()
      .single()

    if (submissionError) {
      console.error("Submission error:", submissionError)
      return NextResponse.json({ error: "Failed to create submission" }, { status: 500 })
    }

    // Deduct submission credit (unless master dev)
    if (userData.role !== "master_dev") {
      const { error: creditError } = await supabase
        .from("users")
        .update({
          submission_credits: userData.submission_credits - 1,
        })
        .eq("id", user.id)

      if (creditError) {
        console.error("Credit deduction error:", creditError)
        // Don't fail the submission if credit deduction fails
      }
    }

    return NextResponse.json({
      success: true,
      submission,
      message: "Track submitted successfully!",
    })
  } catch (error) {
    console.error("Submission creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
