import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  const timestamp = new Date().toISOString()
  const tests = []

  try {
    // Test 1: Environment Variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    tests.push({
      name: "Environment Variables",
      success: !!(supabaseUrl && supabaseAnonKey && supabaseServiceKey),
      details: {
        variables: {
          NEXT_PUBLIC_SUPABASE_URL: !!supabaseUrl,
          NEXT_PUBLIC_SUPABASE_ANON_KEY: !!supabaseAnonKey,
          SUPABASE_SERVICE_ROLE_KEY: !!supabaseServiceKey,
        },
        url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : "missing",
      },
      timestamp,
    })

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return NextResponse.json({
        timestamp,
        tests,
        summary: { total: tests.length, passed: 0, failed: tests.length },
      })
    }

    // Test 2: Client Creation
    let supabase
    try {
      supabase = createClient(supabaseUrl, supabaseAnonKey)
      tests.push({
        name: "Client Creation",
        success: true,
        details: {
          clientType: "standard",
          hasAuth: !!supabase.auth,
          hasStorage: !!supabase.storage,
        },
        timestamp,
      })
    } catch (error) {
      tests.push({
        name: "Client Creation",
        success: false,
        details: { error: error instanceof Error ? error.message : "Unknown error" },
        timestamp,
      })
      return NextResponse.json({
        timestamp,
        tests,
        summary: {
          total: tests.length,
          passed: tests.filter((t) => t.success).length,
          failed: tests.filter((t) => !t.success).length,
        },
      })
    }

    // Test 3: Service Client Creation
    let serviceClient
    try {
      serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
      tests.push({
        name: "Service Client Creation",
        success: true,
        details: {
          clientType: "service",
          hasAuth: !!serviceClient.auth,
          hasStorage: !!serviceClient.storage,
        },
        timestamp,
      })
    } catch (error) {
      tests.push({
        name: "Service Client Creation",
        success: false,
        details: { error: error instanceof Error ? error.message : "Unknown error" },
        timestamp,
      })
    }

    // Test 4: Database Connection
    try {
      const { data, error } = await supabase.from("users").select("count").limit(1)
      tests.push({
        name: "Database Connection",
        success: !error,
        details: {
          queryResult: error ? "failed" : "success",
          error: error?.message || null,
        },
        timestamp,
      })
    } catch (error) {
      tests.push({
        name: "Database Connection",
        success: false,
        details: { error: error instanceof Error ? error.message : "Unknown error" },
        timestamp,
      })
    }

    // Test 5: Storage Service
    try {
      const { data: buckets, error } = await serviceClient.storage.listBuckets()
      tests.push({
        name: "Storage Service",
        success: !error,
        details: {
          bucketCount: buckets?.length || 0,
          buckets: buckets?.map((b) => b.id) || [],
        },
        timestamp,
      })

      // Test 6: Audio Submissions Bucket
      const audioBucket = buckets?.find((bucket) => bucket.id === "audio-submissions")
      tests.push({
        name: "Audio Submissions Bucket",
        success: !!audioBucket,
        details: {
          error: audioBucket ? null : "Bucket not found",
          availableBuckets: buckets?.map((b) => b.id) || [],
        },
        timestamp,
      })

      // Test 7: Upload Capability
      if (audioBucket) {
        try {
          const testContent = "test upload"
          const testPath = `test-${Date.now()}.txt`

          const { data: uploadData, error: uploadError } = await serviceClient.storage
            .from("audio-submissions")
            .upload(testPath, testContent, { contentType: "text/plain" })

          // Clean up test file
          if (uploadData && !uploadError) {
            await serviceClient.storage.from("audio-submissions").remove([testPath])
          }

          tests.push({
            name: "Upload Capability",
            success: !uploadError,
            details: {
              canCreateUploadUrl: !uploadError,
              error: uploadError?.message || null,
              uploadUrl: uploadData?.path || null,
            },
            timestamp,
          })
        } catch (error) {
          tests.push({
            name: "Upload Capability",
            success: false,
            details: {
              canCreateUploadUrl: false,
              error: error instanceof Error ? error.message : "Unknown error",
              uploadUrl: null,
            },
            timestamp,
          })
        }
      } else {
        tests.push({
          name: "Upload Capability",
          success: false,
          details: {
            canCreateUploadUrl: false,
            error: "No audio-submissions bucket found",
            uploadUrl: null,
          },
          timestamp,
        })
      }
    } catch (error) {
      tests.push({
        name: "Storage Service",
        success: false,
        details: { error: error instanceof Error ? error.message : "Unknown error" },
        timestamp,
      })
    }

    // Test 8: Auth Service
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      tests.push({
        name: "Auth Service",
        success: !error,
        details: {
          hasSession: !!session,
          user: session?.user ? "authenticated" : "anonymous",
          error: error?.message || null,
        },
        timestamp,
      })
    } catch (error) {
      tests.push({
        name: "Auth Service",
        success: false,
        details: { error: error instanceof Error ? error.message : "Unknown error" },
        timestamp,
      })
    }

    const summary = {
      total: tests.length,
      passed: tests.filter((test) => test.success).length,
      failed: tests.filter((test) => !test.success).length,
    }

    return NextResponse.json({
      timestamp,
      tests,
      summary,
    })
  } catch (error) {
    return NextResponse.json({
      timestamp,
      tests,
      error: error instanceof Error ? error.message : "Unknown error",
      summary: {
        total: tests.length,
        passed: tests.filter((test) => test.success).length,
        failed: tests.filter((test) => !test.success).length,
      },
    })
  }
}
