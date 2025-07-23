import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServiceClient()

    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      return NextResponse.json(
        {
          error: "Failed to list buckets",
          details: bucketsError,
        },
        { status: 500 },
      )
    }

    // Check if audio-submissions bucket exists
    const audioSubmissionsBucket = buckets?.find((bucket) => bucket.id === "audio-submissions")

    // Try to list files in the bucket (this will also verify permissions)
    let bucketContents = null
    let bucketError = null

    if (audioSubmissionsBucket) {
      const { data: files, error: filesError } = await supabase.storage.from("audio-submissions").list("", { limit: 5 })

      bucketContents = files
      bucketError = filesError
    }

    return NextResponse.json({
      success: true,
      buckets: buckets?.map((b) => ({
        id: b.id,
        name: b.name,
        public: b.public,
        file_size_limit: b.file_size_limit,
        allowed_mime_types: b.allowed_mime_types,
      })),
      audioSubmissionsBucket: audioSubmissionsBucket
        ? {
            id: audioSubmissionsBucket.id,
            name: audioSubmissionsBucket.name,
            public: audioSubmissionsBucket.public,
            file_size_limit: audioSubmissionsBucket.file_size_limit,
            allowed_mime_types: audioSubmissionsBucket.allowed_mime_types,
          }
        : null,
      bucketContents,
      bucketError,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Bucket status check error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
