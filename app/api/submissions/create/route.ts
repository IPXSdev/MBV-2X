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

    const body = await request.json()
    const {
      track_title,
      artist_name,
      genre,
      mood_tags,
      description,
      file_url,
      file_size,
      duration,
      bpm,
      key_signature,
    } = body

    if (!track_title || !artist_name) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          message: "Track title and artist name are required",
        },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    // Create the submission
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .insert({
        user_id: user.id,
        track_title,
        artist_name,
        genre,
        mood_tags,
        description,
        file_url,
        file_size,
        duration,
        bpm,
        key_signature,
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
      submission: {
        ...submission,
        title: submission.track_title, // Add title mapping for frontend
      },
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
