import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: [] as any[],
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
    },
  }

  const addTest = (name: string, success: boolean, details: any) => {
    results.tests.push({
      name,
      success,
      details,
      timestamp: new Date().toISOString(),
    })
    results.summary.total++
    if (success) {
      results.summary.passed++
    } else {
      results.summary.failed++
    }
  }

  // Test 1: Environment Variables
  try {
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }

    const allPresent = Object.values(envVars).every(Boolean)
    addTest("Environment Variables", allPresent, {
      variables: envVars,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "...",
    })
  } catch (error) {
    addTest("Environment Variables", false, {
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }

  // Test 2: Client Creation
  try {
    const supabase = await createClient()
    addTest("Client Creation", true, {
      clientType: "standard",
      hasAuth: !!supabase.auth,
      hasStorage: !!supabase.storage,
    })
  } catch (error) {
    addTest("Client Creation", false, {
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }

  // Test 3: Service Client Creation
  try {
    const serviceClient = await createServiceClient()
    addTest("Service Client Creation", true, {
      clientType: "service",
      hasAuth: !!serviceClient.auth,
      hasStorage: !!serviceClient.storage,
    })
  } catch (error) {
    addTest("Service Client Creation", false, {
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }

  // Test 4: Database Connection
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("users").select("count").limit(1)

    if (error && error.code !== "PGRST116") {
      throw error
    }

    addTest("Database Connection", true, {
      queryResult: data ? "success" : "empty",
      error: error?.message || null,
    })
  } catch (error) {
    addTest("Database Connection", false, {
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }

  // Test 5: Storage Service
  try {
    const supabase = await createClient()
    const { data: buckets, error } = await supabase.storage.listBuckets()

    if (error) {
      throw error
    }

    addTest("Storage Service", true, {
      bucketCount: buckets?.length || 0,
      buckets: buckets?.map((b) => ({ id: b.id, name: b.name })) || [],
    })
  } catch (error) {
    addTest("Storage Service", false, {
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }

  // Test 6: Audio Submissions Bucket
  try {
    const supabase = await createClient()
    const { data: buckets, error } = await supabase.storage.listBuckets()

    if (error) {
      throw error
    }

    const audioSubmissionsBucket = buckets?.find((bucket) => bucket.id === "audio-submissions")

    if (!audioSubmissionsBucket) {
      addTest("Audio Submissions Bucket", false, {
        error: "Bucket not found",
        availableBuckets: buckets?.map((b) => b.id) || [],
      })
    } else {
      // Test bucket access
      const { data: files, error: listError } = await supabase.storage.from("audio-submissions").list("", { limit: 1 })

      addTest("Audio Submissions Bucket", !listError, {
        bucket: {
          id: audioSubmissionsBucket.id,
          name: audioSubmissionsBucket.name,
          public: audioSubmissionsBucket.public,
          file_size_limit: audioSubmissionsBucket.file_size_limit,
          allowed_mime_types: audioSubmissionsBucket.allowed_mime_types,
        },
        canList: !listError,
        listError: listError?.message || null,
        fileCount: files?.length || 0,
      })
    }
  } catch (error) {
    addTest("Audio Submissions Bucket", false, {
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }

  // Test 7: Upload Test (without actually uploading)
  try {
    const supabase = await createClient()
    const testFileName = `test-${Date.now()}.txt`
    const { data: uploadUrl, error } = await supabase.storage
      .from("audio-submissions")
      .createSignedUploadUrl(`test/${testFileName}`)

    addTest("Upload Capability", !error, {
      canCreateUploadUrl: !error,
      error: error?.message || null,
      uploadUrl: uploadUrl ? "generated" : null,
    })
  } catch (error) {
    addTest("Upload Capability", false, {
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }

  // Test 8: Auth Service
  try {
    const supabase = await createClient()
    const { data: session, error } = await supabase.auth.getSession()

    addTest("Auth Service", true, {
      hasSession: !!session?.session,
      user: session?.session?.user ? "authenticated" : "anonymous",
      error: error?.message || null,
    })
  } catch (error) {
    addTest("Auth Service", false, {
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }

  return NextResponse.json(results, {
    headers: {
      "Content-Type": "application/json",
    },
  })
}
