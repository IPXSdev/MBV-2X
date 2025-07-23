import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("Starting bucket check...")

    // Check environment variables
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("Created Supabase client")

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

    console.log(
      "Available buckets:",
      buckets?.map((b) => b.name),
    )

    const audioBucket = buckets?.find((bucket) => bucket.name === "audio-submissions")

    if (!audioBucket) {
      console.log("Audio submissions bucket not found")
      return NextResponse.json({
        success: false,
        error: "Audio submissions bucket does not exist",
        availableBuckets: buckets?.map((b) => b.name) || [],
      })
    }

    console.log("Found audio-submissions bucket:", audioBucket)

    // Test upload capability
    const testFileName = `test-${Date.now()}.txt`
    const testContent = "This is a test file for bucket verification"

    console.log("Testing upload with file:", testFileName)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("audio-submissions")
      .upload(testFileName, testContent, {
        contentType: "text/plain",
        upsert: true,
      })

    if (uploadError) {
      console.error("Upload test failed:", uploadError)
      return NextResponse.json({
        success: false,
        error: "Upload test failed",
        details: uploadError,
        bucketExists: true,
      })
    }

    console.log("Upload test successful:", uploadData)

    // Test public URL generation
    const {
      data: { publicUrl },
    } = supabase.storage.from("audio-submissions").getPublicUrl(testFileName)

    console.log("Generated public URL:", publicUrl)

    // Clean up test file
    const { error: deleteError } = await supabase.storage.from("audio-submissions").remove([testFileName])

    if (deleteError) {
      console.warn("Failed to clean up test file:", deleteError)
    } else {
      console.log("Test file cleaned up successfully")
    }

    return NextResponse.json({
      success: true,
      bucketExists: true,
      bucketInfo: audioBucket,
      uploadTest: {
        success: true,
        fileName: testFileName,
        publicUrl,
      },
      message: "Audio submissions bucket is fully functional",
    })
  } catch (error) {
    console.error("Bucket check failed:", error)
    return NextResponse.json({
      success: false,
      error: "Bucket check failed",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
