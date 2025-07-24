import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error("Error listing buckets:", listError)
      return NextResponse.json({
        success: false,
        error: "Failed to list buckets",
        details: listError,
        bucketExists: false,
      })
    }

    const bucketExists = buckets?.some((bucket) => bucket.name === "audio-submissions")

    if (!bucketExists) {
      return NextResponse.json({
        success: false,
        error: "Bucket does not exist",
        details: { message: "audio-submissions bucket not found" },
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
      console.error("Upload error:", uploadError)
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
      bucketExists: true,
      uploadTest: "passed",
    })
  } catch (error) {
    console.error("Bucket check error:", error)
    return NextResponse.json({
      success: false,
      error: "Bucket check failed",
      details: error instanceof Error ? error.message : "Unknown error",
      bucketExists: false,
    })
  }
}
