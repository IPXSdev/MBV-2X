import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { createClient } = await import("@supabase/supabase-js")

    // Create service client for admin operations
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    console.log("Starting bucket check...")

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error("Error listing buckets:", listError)
      return NextResponse.json(
        {
          error: "Failed to list buckets",
          details: listError.message,
        },
        { status: 500 },
      )
    }

    console.log(
      "Available buckets:",
      buckets?.map((b) => b.name),
    )

    const bucketName = "audio-submissions"
    const bucketExists = buckets?.some((bucket) => bucket.name === bucketName)

    if (!bucketExists) {
      console.log("Creating bucket:", bucketName)

      // Create the bucket
      const { data: createData, error: createError } = await supabase.storage.createBucket(bucketName, {
        public: false,
        allowedMimeTypes: ["audio/mpeg", "audio/wav", "audio/mp3", "audio/x-wav"],
        fileSizeLimit: 52428800, // 50MB
      })

      if (createError) {
        console.error("Error creating bucket:", createError)
        return NextResponse.json(
          {
            error: "Failed to create bucket",
            details: createError.message,
          },
          { status: 500 },
        )
      }

      console.log("Bucket created successfully:", createData)
    }

    // Test file upload
    const testFileName = `test-${Date.now()}.txt`
    const testContent = "This is a test file for bucket validation"

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(testFileName, new Blob([testContent], { type: "text/plain" }))

    if (uploadError) {
      console.error("Error uploading test file:", uploadError)
      return NextResponse.json(
        {
          error: "Failed to upload test file",
          details: uploadError.message,
        },
        { status: 500 },
      )
    }

    console.log("Test file uploaded successfully:", uploadData)

    // Clean up test file
    const { error: deleteError } = await supabase.storage.from(bucketName).remove([testFileName])

    if (deleteError) {
      console.warn("Warning: Could not delete test file:", deleteError)
    }

    return NextResponse.json({
      success: true,
      message: "Bucket check completed successfully",
      bucketExists: true,
      bucketName,
      testUpload: "success",
    })
  } catch (error) {
    console.error("Bucket check error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
