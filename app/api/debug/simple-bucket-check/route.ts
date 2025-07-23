import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
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
        timestamp: new Date().toISOString(),
      })
    }

    // Create service role client with explicit configuration
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      return NextResponse.json({
        success: false,
        error: `Failed to list buckets: ${bucketsError.message}`,
        details: bucketsError,
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
          details: createError,
          timestamp: new Date().toISOString(),
        })
      }

      // Test upload capability after creation
      const testContent = "test upload content"
      const testPath = `test-${Date.now()}.txt`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("audio-submissions")
        .upload(testPath, testContent, {
          contentType: "text/plain",
        })

      // Clean up test file
      if (uploadData && !uploadError) {
        await supabase.storage.from("audio-submissions").remove([testPath])
      }

      return NextResponse.json({
        success: true,
        message: "Bucket created successfully",
        bucket: {
          id: "audio-submissions",
          name: "audio-submissions",
          public: true,
        },
        uploadTest: {
          success: !uploadError,
          error: uploadError?.message || null,
        },
        allBuckets: [...(buckets?.map((b) => b.id) || []), "audio-submissions"],
        timestamp: new Date().toISOString(),
      })
    }

    // Test upload capability for existing bucket
    const testContent = "test upload content"
    const testPath = `test-${Date.now()}.txt`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("audio-submissions")
      .upload(testPath, testContent, {
        contentType: "text/plain",
      })

    // Clean up test file
    if (uploadData && !uploadError) {
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
      details: error instanceof Error ? error.stack : "No stack trace available",
      timestamp: new Date().toISOString(),
    })
  }
}
