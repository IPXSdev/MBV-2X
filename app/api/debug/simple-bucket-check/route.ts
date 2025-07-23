import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()

    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      return NextResponse.json({
        success: false,
        error: `Failed to list buckets: ${bucketsError.message}`,
        timestamp: new Date().toISOString(),
      })
    }

    const audioBucket = buckets?.find((bucket) => bucket.id === "audio-submissions")

    if (!audioBucket) {
      // Try to create the bucket
      const { data: newBucket, error: createError } = await supabase.storage.createBucket("audio-submissions", {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          "audio/mpeg",
          "audio/mp3",
          "audio/wav",
          "audio/wave",
          "audio/x-wav",
          "audio/flac",
          "audio/x-flac",
          "audio/aac",
          "audio/mp4",
          "audio/m4a",
          "audio/x-m4a",
          "audio/ogg",
          "audio/webm",
        ],
      })

      if (createError) {
        return NextResponse.json({
          success: false,
          error: `Failed to create bucket: ${createError.message}`,
          timestamp: new Date().toISOString(),
        })
      }

      // Test upload capability after creation
      const testFile = new Blob(["test"], { type: "audio/mpeg" })
      const testPath = `test-${Date.now()}.mp3`

      const { error: uploadError } = await supabase.storage.from("audio-submissions").upload(testPath, testFile)

      // Clean up test file
      if (!uploadError) {
        await supabase.storage.from("audio-submissions").remove([testPath])
      }

      return NextResponse.json({
        success: true,
        message: "Bucket created successfully",
        bucket: newBucket,
        uploadTest: {
          success: !uploadError,
          error: uploadError?.message || null,
        },
        allBuckets: buckets?.map((b) => b.id) || [],
        timestamp: new Date().toISOString(),
      })
    }

    // Test upload capability for existing bucket
    const testFile = new Blob(["test"], { type: "audio/mpeg" })
    const testPath = `test-${Date.now()}.mp3`

    const { error: uploadError } = await supabase.storage.from("audio-submissions").upload(testPath, testFile)

    // Clean up test file
    if (!uploadError) {
      await supabase.storage.from("audio-submissions").remove([testPath])
    }

    return NextResponse.json({
      success: true,
      message: "Bucket exists and is functional",
      bucket: {
        id: audioBucket.id,
        name: audioBucket.name,
        public: audioBucket.public,
        fileSizeLimit: audioBucket.file_size_limit,
        allowedMimeTypes: audioBucket.allowed_mime_types,
      },
      uploadTest: {
        success: !uploadError,
        error: uploadError?.message || null,
      },
      allBuckets: buckets?.map((b) => b.id) || [],
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Bucket check error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      timestamp: new Date().toISOString(),
    })
  }
}
