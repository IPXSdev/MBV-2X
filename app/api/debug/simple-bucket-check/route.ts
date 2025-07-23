import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: "Missing environment variables",
        details: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceKey,
        },
      })
    }

    // Create service client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      return NextResponse.json({
        success: false,
        error: "Failed to list buckets",
        details: listError,
      })
    }

    const audioBucket = buckets?.find((bucket) => bucket.id === "audio-submissions")

    if (!audioBucket) {
      // Try to create the bucket
      const { data: newBucket, error: createError } = await supabase.storage.createBucket("audio-submissions", {
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
        return NextResponse.json({
          success: false,
          error: "Failed to create bucket",
          details: createError,
          allBuckets: buckets?.map((b) => b.id) || [],
        })
      }

      // Test upload after creation
      const testContent = "test upload"
      const testFileName = `test-${Date.now()}.txt`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("audio-submissions")
        .upload(testFileName, testContent, {
          contentType: "text/plain",
        })

      // Clean up test file
      if (uploadData) {
        await supabase.storage.from("audio-submissions").remove([testFileName])
      }

      return NextResponse.json({
        success: true,
        message: "Bucket created successfully",
        bucket: newBucket,
        uploadTest: {
          success: !uploadError,
          error: uploadError?.message || null,
        },
        allBuckets: [...(buckets?.map((b) => b.id) || []), "audio-submissions"],
        timestamp: new Date().toISOString(),
      })
    }

    // Bucket exists, test upload capability
    const testContent = "test upload"
    const testFileName = `test-${Date.now()}.txt`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("audio-submissions")
      .upload(testFileName, testContent, {
        contentType: "text/plain",
      })

    // Clean up test file
    if (uploadData) {
      await supabase.storage.from("audio-submissions").remove([testFileName])
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
    return NextResponse.json({
      success: false,
      error: "Unexpected error",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    })
  }
}
