import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/supabase/auth"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    // Use custom auth system
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin or master dev
    if (user.role !== "admin" && user.role !== "master_dev") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    // Use service client for database operations
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Get storage bucket information
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError)
      return NextResponse.json(
        {
          error: "Failed to list storage buckets",
          details: bucketsError.message,
        },
        { status: 500 },
      )
    }

    // Get files from audio-submissions bucket
    const { data: files, error: filesError } = await supabase.storage.from("audio-submissions").list("", {
      limit: 100,
      offset: 0,
    })

    if (filesError) {
      console.error("Error listing files:", filesError)
    }

    // Calculate storage usage
    const totalSize = files?.reduce((sum, file) => sum + (file.metadata?.size || 0), 0) || 0

    return NextResponse.json({
      success: true,
      media: {
        buckets: buckets || [],
        files: files || [],
        totalFiles: files?.length || 0,
        totalSize,
        formattedSize: formatBytes(totalSize),
      },
    })
  } catch (error) {
    console.error("Error in admin media route:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}
