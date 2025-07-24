export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    console.log("Starting bucket status check...")

    const supabase = await createClient()

    // Test basic connection first
    try {
      const { data: testData, error: testError } = await supabase.from("users").select("count").limit(1).single()

      if (testError && testError.code !== "PGRST116") {
        console.error("Supabase connection test failed:", testError)
        return NextResponse.json(
          {
            success: false,
            error: "Database connection failed",
            details: testError.message,
            buckets: null,
            audioSubmissionsBucket: null,
          },
          { status: 500 },
        )
      }
    } catch (connectionError) {
      console.error("Connection test error:", connectionError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to connect to database",
          details: connectionError instanceof Error ? connectionError.message : "Unknown connection error",
          buckets: null,
          audioSubmissionsBucket: null,
        },
        { status: 500 },
      )
    }

    console.log("Database connection successful, checking buckets...")

    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to list storage buckets",
          details: bucketsError.message,
          buckets: null,
          audioSubmissionsBucket: null,
        },
        { status: 500 },
      )
    }

    console.log(
      "Available buckets:",
      buckets?.map((b) => ({ id: b.id, name: b.name })),
    )

    // Find the audio-submissions bucket
    const audioSubmissionsBucket = buckets?.find((bucket) => bucket.id === "audio-submissions")

    if (!audioSubmissionsBucket) {
      console.log("Audio submissions bucket not found")
      return NextResponse.json({
        success: true,
        error: "Audio submissions bucket not found",
        buckets: buckets?.map((b) => ({
          id: b.id,
          name: b.name,
          public: b.public,
        })),
        audioSubmissionsBucket: null,
        bucketTest: null,
      })
    }

    console.log("Audio submissions bucket found:", audioSubmissionsBucket.id)

    // Test bucket access
    let bucketTest = null
    try {
      const { data: files, error: listError } = await supabase.storage.from("audio-submissions").list("", { limit: 1 })

      bucketTest = {
        canList: !listError,
        error: listError?.message || null,
        fileCount: files?.length || 0,
      }

      console.log("Bucket test result:", bucketTest)
    } catch (error) {
      console.error("Bucket test failed:", error)
      bucketTest = {
        canList: false,
        error: "Failed to test bucket access",
        fileCount: 0,
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      buckets: buckets?.map((b) => ({
        id: b.id,
        name: b.name,
        public: b.public,
        file_size_limit: b.file_size_limit,
      })),
      audioSubmissionsBucket: {
        id: audioSubmissionsBucket.id,
        name: audioSubmissionsBucket.name,
        public: audioSubmissionsBucket.public,
        file_size_limit: audioSubmissionsBucket.file_size_limit,
        allowed_mime_types: audioSubmissionsBucket.allowed_mime_types,
      },
      bucketTest,
    })
  } catch (error) {
    console.error("Bucket status check failed with unexpected error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Unexpected error during bucket status check",
        details: error instanceof Error ? error.message : "Unknown error",
        buckets: null,
        audioSubmissionsBucket: null,
      },
      { status: 500 },
    )
  }
}
