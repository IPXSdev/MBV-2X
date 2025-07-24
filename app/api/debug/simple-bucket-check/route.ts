import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Use service role key for admin operations
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Create a minimal MP3 file buffer for testing (44 bytes - minimal MP3 header)
    const mp3Buffer = Buffer.from([
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
      .upload(testFileName, mp3Buffer, {
        contentType: "audio/mpeg",
        cacheControl: "3600",
      })

    if (uploadError) {
      console.error("Upload test failed:", uploadError)
      return NextResponse.json({
        success: false,
        error: "Upload failed",
        details: uploadError.message,
        bucket: "audio-submissions",
        testFile: testFileName,
      })
    }

    // Test download
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from("audio-submissions")
      .download(testFileName)

    if (downloadError) {
      console.error("Download test failed:", downloadError)
      return NextResponse.json({
        success: false,
        error: "Download failed",
        details: downloadError.message,
        bucket: "audio-submissions",
        testFile: testFileName,
      })
    }

    // Clean up test file
    const { error: deleteError } = await supabase.storage.from("audio-submissions").remove([testFileName])

    if (deleteError) {
      console.warn("Failed to clean up test file:", deleteError)
    }

    return NextResponse.json({
      success: true,
      message: "Bucket is working correctly",
      bucket: "audio-submissions",
      testFile: testFileName,
      uploadSize: mp3Buffer.length,
      downloadSize: downloadData?.size || 0,
    })
  } catch (error) {
    console.error("Bucket check error:", error)
    return NextResponse.json({
      success: false,
      error: "Bucket check failed",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
