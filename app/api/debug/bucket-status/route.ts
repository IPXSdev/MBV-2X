import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createClient()

    // Check if buckets exist
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()

    if (bucketError) {
      return NextResponse.json(
        {
          error: "Failed to list buckets",
          details: bucketError.message,
          buckets: null,
          audioSubmissionsBucket: null,
          policies: null,
        },
        { status: 500 },
      )
    }

    // Find the audio-submissions bucket
    const audioSubmissionsBucket = buckets?.find((bucket) => bucket.id === "audio-submissions")

    // Try to get bucket policies (this requires admin access)
    let policies = null
    try {
      const { data: policyData } = await supabase
        .from("storage.policies")
        .select("*")
        .eq("bucket_id", "audio-submissions")

      policies = policyData
    } catch (error) {
      console.log("Could not fetch policies (may require admin access):", error)
    }

    // Test upload permissions
    let uploadTest = null
    try {
      // Try to list files in the bucket to test access
      const { data: files, error: listError } = await supabase.storage.from("audio-submissions").list("", { limit: 1 })

      uploadTest = {
        canList: !listError,
        error: listError?.message || null,
      }
    } catch (error) {
      uploadTest = {
        canList: false,
        error: "Failed to test bucket access",
      }
    }

    return NextResponse.json({
      success: true,
      buckets: buckets?.map((b) => ({ id: b.id, name: b.name, public: b.public })),
      audioSubmissionsBucket: audioSubmissionsBucket
        ? {
            id: audioSubmissionsBucket.id,
            name: audioSubmissionsBucket.name,
            public: audioSubmissionsBucket.public,
            created_at: audioSubmissionsBucket.created_at,
            updated_at: audioSubmissionsBucket.updated_at,
          }
        : null,
      policies,
      uploadTest,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Bucket status check failed:", error)
    return NextResponse.json(
      {
        error: "Failed to check bucket status",
        details: error instanceof Error ? error.message : "Unknown error",
        buckets: null,
        audioSubmissionsBucket: null,
        policies: null,
      },
      { status: 500 },
    )
  }
}
