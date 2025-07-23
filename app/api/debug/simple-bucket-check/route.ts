import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Use service role key for admin operations
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const bucketName = "audio-submissions"
    let bucketExists = false
    let bucketCreated = false
    let uploadTestResult = null

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error("Error listing buckets:", listError)
      return NextResponse.json({
        success: false,
        error: `Failed to list buckets: ${listError.message}`,
        bucketExists: false,
        bucketCreated: false,
        uploadTest: null,
      })
    }

    bucketExists = buckets.some((bucket) => bucket.name === bucketName)

    // Create bucket if it doesn't exist
    if (!bucketExists) {
      const { data: createData, error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
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
        fileSizeLimit: 52428800, // 50MB
      })

      if (createError) {
        console.error("Error creating bucket:", createError)
        return NextResponse.json({
          success: false,
          error: `Failed to create bucket: ${createError.message}`,
          bucketExists: false,
          bucketCreated: false,
          uploadTest: null,
        })
      }

      bucketCreated = true
      bucketExists = true
    }

    // Test upload functionality
    try {
      const testFileName = `test-${Date.now()}.txt`
      const testContent = "This is a test file for bucket functionality"
      const testBlob = new Blob([testContent], { type: "text/plain" })

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(testFileName, testBlob)

      if (uploadError) {
        uploadTestResult = {
          success: false,
          error: uploadError.message,
        }
      } else {
        // Clean up test file
        await supabase.storage.from(bucketName).remove([testFileName])

        uploadTestResult = {
          success: true,
          message: "Upload test successful",
        }
      }
    } catch (uploadTestError) {
      uploadTestResult = {
        success: false,
        error: uploadTestError instanceof Error ? uploadTestError.message : "Unknown upload test error",
      }
    }

    return NextResponse.json({
      success: bucketExists && uploadTestResult?.success,
      bucketExists,
      bucketCreated,
      uploadTest: uploadTestResult,
      message: bucketExists ? "Audio submissions bucket is ready" : "Audio submissions bucket could not be configured",
    })
  } catch (error) {
    console.error("Bucket check error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      bucketExists: false,
      bucketCreated: false,
      uploadTest: null,
    })
  }
}
