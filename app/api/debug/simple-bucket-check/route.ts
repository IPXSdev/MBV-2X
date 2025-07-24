import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("Starting bucket check...")

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: "Missing Supabase environment variables",
        details: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceKey,
        },
      })
    }

    // Create service client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError)
      return NextResponse.json({
        success: false,
        error: "Failed to list buckets",
        details: bucketsError,
      })
    }

    const audioSubmissionsBucket = buckets?.find((bucket) => bucket.id === "audio-submissions")

    if (!audioSubmissionsBucket) {
      return NextResponse.json({
        success: false,
        error: "audio-submissions bucket not found",
        bucketExists: false,
        availableBuckets: buckets?.map((b) => b.id) || [],
      })
    }

    // Test upload with proper audio file
    const testFileName = `test-${Date.now()}.mp3`

    // Create a minimal MP3 file buffer (just headers, not actual audio)
    const mp3Header = new Uint8Array([
      0xff,
      0xfb,
      0x90,
      0x00, // MP3 frame header
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
    ])

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("audio-submissions")
      .upload(testFileName, mp3Header, {
        contentType: "audio/mpeg",
        cacheControl: "3600",
        upsert: false,
      })

    let uploadTest = {
      success: false,
      error: null as any,
      details: null as any,
    }

    if (uploadError) {
      console.error("Upload test failed:", uploadError)
      uploadTest = {
        success: false,
        error: uploadError.message,
        details: uploadError,
      }
    } else {
      console.log("Upload test successful:", uploadData)
      uploadTest = {
        success: true,
        error: null,
        details: uploadData,
      }

      // Clean up test file
      try {
        await supabase.storage.from("audio-submissions").remove([testFileName])
        console.log("Test file cleaned up successfully")
      } catch (cleanupError) {
        console.warn("Failed to clean up test file:", cleanupError)
      }
    }

    // Get bucket details
    const { data: bucketFiles, error: filesError } = await supabase.storage
      .from("audio-submissions")
      .list("", { limit: 5 })

    return NextResponse.json({
      success: uploadTest.success,
      error: uploadTest.success ? null : uploadTest.error,
      bucketExists: true,
      bucketDetails: {
        id: audioSubmissionsBucket.id,
        name: audioSubmissionsBucket.name,
        public: audioSubmissionsBucket.public,
        file_size_limit: audioSubmissionsBucket.file_size_limit,
        allowed_mime_types: audioSubmissionsBucket.allowed_mime_types,
        created_at: audioSubmissionsBucket.created_at,
        updated_at: audioSubmissionsBucket.updated_at,
      },
      uploadTest,
      recentFiles: filesError ? null : bucketFiles?.slice(0, 5),
      filesError: filesError?.message || null,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Bucket check error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      details: error,
      timestamp: new Date().toISOString(),
    })
  }
}
