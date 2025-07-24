import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()

    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      return NextResponse.json({
        success: false,
        error: "Failed to list buckets",
        details: bucketsError,
        bucketExists: false,
      })
    }

    const audioSubmissionsBucket = buckets?.find((bucket) => bucket.name === "audio-submissions")

    if (!audioSubmissionsBucket) {
      return NextResponse.json({
        success: false,
        error: "audio-submissions bucket not found",
        details: { availableBuckets: buckets?.map((b) => b.name) || [] },
        bucketExists: false,
      })
    }

    // Create a minimal MP3 file for testing
    const mp3Header = new Uint8Array([
      0xff,
      0xfb,
      0x90,
      0x00, // MP3 header
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

    const testFileName = `test-${Date.now()}.mp3`

    // Test upload
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("audio-submissions")
      .upload(testFileName, mp3Header, {
        contentType: "audio/mpeg",
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({
        success: false,
        error: "Upload test failed",
        details: uploadError,
        bucketExists: true,
      })
    }

    // Clean up test file
    await supabase.storage.from("audio-submissions").remove([testFileName])

    return NextResponse.json({
      success: true,
      message: "Bucket check passed",
      details: {
        bucketExists: true,
        uploadTest: "passed",
        testFile: testFileName,
        uploadPath: uploadData?.path,
      },
    })
  } catch (error) {
    console.error("Bucket check error:", error)
    return NextResponse.json({
      success: false,
      error: "Bucket check failed",
      details: error instanceof Error ? error.message : String(error),
      bucketExists: false,
    })
  }
}
