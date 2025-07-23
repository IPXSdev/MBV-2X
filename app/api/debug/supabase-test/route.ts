import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

interface TestResult {
  name: string
  success: boolean
  details: any
  timestamp: string
}

export async function GET() {
  const results: TestResult[] = []
  const timestamp = new Date().toISOString()

  try {
    // Test 1: Environment Variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    const envTest = {
      name: "Environment Variables",
      success: !!(supabaseUrl && supabaseAnonKey && supabaseServiceKey),
      details: {
        variables: {
          NEXT_PUBLIC_SUPABASE_URL: !!supabaseUrl,
          NEXT_PUBLIC_SUPABASE_ANON_KEY: !!supabaseAnonKey,
          SUPABASE_SERVICE_ROLE_KEY: !!supabaseServiceKey,
        },
        url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : "missing",
      },
      timestamp,
    }
    results.push(envTest)

    if (!envTest.success) {
      return NextResponse.json({
        timestamp,
        tests: results,
        summary: { total: 1, passed: 0, failed: 1 },
      })
    }

    // Create clients
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!)
    const supabaseService = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Test 2: Client Creation
    results.push({
      name: "Client Creation",
      success: true,
      details: {
        clientType: "standard",
        hasAuth: !!supabase.auth,
        hasStorage: !!supabase.storage,
      },
      timestamp: new Date().toISOString(),
    })

    // Test 3: Service Client Creation
    results.push({
      name: "Service Client Creation",
      success: true,
      details: {
        clientType: "service",
        hasAuth: !!supabaseService.auth,
        hasStorage: !!supabaseService.storage,
      },
      timestamp: new Date().toISOString(),
    })

    // Test 4: Database Connection
    try {
      const { data, error } = await supabaseService.from("users").select("count").limit(1)

      results.push({
        name: "Database Connection",
        success: !error,
        details: {
          queryResult: error ? "failed" : "success",
          error: error?.message || null,
        },
        timestamp: new Date().toISOString(),
      })
    } catch (dbError) {
      results.push({
        name: "Database Connection",
        success: false,
        details: {
          queryResult: "failed",
          error: dbError instanceof Error ? dbError.message : "Unknown error",
        },
        timestamp: new Date().toISOString(),
      })
    }

    // Test 5: Storage Service with Service Role
    try {
      const { data: buckets, error: bucketsError } = await supabaseService.storage.listBuckets()

      results.push({
        name: "Storage Service",
        success: !bucketsError,
        details: {
          bucketCount: buckets?.length || 0,
          buckets: buckets?.map((b) => ({ id: b.id, name: b.name, public: b.public })) || [],
          error: bucketsError?.message || null,
        },
        timestamp: new Date().toISOString(),
      })

      // Test 6: Audio Submissions Bucket
      const audioBucket = buckets?.find((bucket) => bucket.id === "audio-submissions")

      if (!audioBucket) {
        results.push({
          name: "Audio Submissions Bucket",
          success: false,
          details: {
            action: "not found",
            bucket: null,
            error: "Bucket does not exist",
            availableBuckets: buckets?.map((b) => b.id) || [],
          },
          timestamp: new Date().toISOString(),
        })
      } else {
        results.push({
          name: "Audio Submissions Bucket",
          success: true,
          details: {
            action: "found",
            bucket: {
              id: audioBucket.id,
              name: audioBucket.name,
              public: audioBucket.public,
              file_size_limit: audioBucket.file_size_limit,
              allowed_mime_types: audioBucket.allowed_mime_types,
            },
            availableBuckets: buckets?.map((b) => b.id) || [],
          },
          timestamp: new Date().toISOString(),
        })

        // Test 7: Upload Capability with Service Role
        try {
          const testContent = "test audio content"
          const testFileName = `test-${Date.now()}.txt`

          const { data: uploadData, error: uploadError } = await supabaseService.storage
            .from("audio-submissions")
            .upload(testFileName, testContent, {
              contentType: "text/plain",
            })

          // Clean up test file
          if (uploadData) {
            await supabaseService.storage.from("audio-submissions").remove([testFileName])
          }

          results.push({
            name: "Upload Capability",
            success: !uploadError,
            details: {
              canUpload: !uploadError,
              error: uploadError?.message || null,
              uploadPath: uploadData?.path || null,
              cleanedUp: !!uploadData,
            },
            timestamp: new Date().toISOString(),
          })
        } catch (uploadTestError) {
          results.push({
            name: "Upload Capability",
            success: false,
            details: {
              canUpload: false,
              error: uploadTestError instanceof Error ? uploadTestError.message : "Unknown upload error",
              uploadPath: null,
            },
            timestamp: new Date().toISOString(),
          })
        }
      }
    } catch (storageError) {
      results.push({
        name: "Storage Service",
        success: false,
        details: {
          bucketCount: 0,
          buckets: [],
          error: storageError instanceof Error ? storageError.message : "Unknown storage error",
        },
        timestamp: new Date().toISOString(),
      })

      results.push({
        name: "Audio Submissions Bucket",
        success: false,
        details: {
          action: "storage error",
          bucket: null,
          error: "Could not access storage service",
          availableBuckets: [],
        },
        timestamp: new Date().toISOString(),
      })
    }

    // Test 8: Auth Service
    try {
      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession()

      results.push({
        name: "Auth Service",
        success: !authError,
        details: {
          hasSession: !!session,
          user: session?.user ? "authenticated" : "anonymous",
          error: authError?.message || null,
        },
        timestamp: new Date().toISOString(),
      })
    } catch (authTestError) {
      results.push({
        name: "Auth Service",
        success: false,
        details: {
          hasSession: false,
          user: "error",
          error: authTestError instanceof Error ? authTestError.message : "Unknown auth error",
        },
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    results.push({
      name: "Critical Error",
      success: false,
      details: {
        error: error instanceof Error ? error.message : "Unknown critical error",
      },
      timestamp: new Date().toISOString(),
    })
  }

  const summary = {
    total: results.length,
    passed: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
  }

  return NextResponse.json({
    timestamp,
    tests: results,
    summary,
  })
}
