import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()

    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError)
      return NextResponse.json(
        {
          error: "Failed to list buckets",
          details: bucketsError.message,
          buckets: null,
          audioSubmissionsBucket: null,
        },
        { status: 500 },
      )
    }

    console.log("Available buckets:", buckets)

    // Find the audio-submissions bucket
    const audioSubmissionsBucket = buckets?.find((bucket) => bucket.id === "audio-submissions")

    // Test bucket access by trying to list files
    let bucketTest = null
    if (audioSubmissionsBucket) {
      try {
        const { data: files, error: listError } = await supabase.storage
          .from("audio-submissions")
          .list("", { limit: 1 })

        bucketTest = {
          canList: !listError,
          error: listError?.message || null,
          fileCount: files?.length || 0,
        }
      } catch (error) {
        bucketTest = {
          canList: false,
          error: "Failed to test bucket access",
          fileCount: 0,
        }
      }
    }

    // Test upload capability (without actually uploading)
    let uploadTest = null
    if (audioSubmissionsBucket) {
      try {
        // Try to get upload URL (this tests permissions without uploading)
        const testFileName = `test-${Date.now()}.txt`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("audio-submissions")
          .createSignedUploadUrl(`test/${testFileName}`)

        uploadTest = {
          canCreateUploadUrl: !uploadError,
          error: uploadError?.message || null,
        }
      } catch (error) {
        uploadTest = {
          canCreateUploadUrl: false,
          error: "Failed to test upload permissions",
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      buckets: buckets?.map((b) => ({
        id: b.id,
        name: b.name,
        public: b.public,
        created_at: b.created_at,
        updated_at: b.updated_at,
        file_size_limit: b.file_size_limit,
        allowed_mime_types: b.allowed_mime_types,
      })),
      audioSubmissionsBucket: audioSubmissionsBucket
        ? {
            id: audioSubmissionsBucket.id,
            name: audioSubmissionsBucket.name,
            public: audioSubmissionsBucket.public,
            created_at: audioSubmissionsBucket.created_at,
            updated_at: audioSubmissionsBucket.updated_at,
            file_size_limit: audioSubmissionsBucket.file_size_limit,
            allowed_mime_types: audioSubmissionsBucket.allowed_mime_types,
          }
        : null,
      bucketTest,
      uploadTest,
    })
  } catch (error) {
    console.error("Bucket status check failed:", error)
    return NextResponse.json(
      {
        error: "Failed to check bucket status",
        details: error instanceof Error ? error.message : "Unknown error",
        buckets: null,
        audioSubmissionsBucket: null,
      },
      { status: 500 },
    )
  }
}
