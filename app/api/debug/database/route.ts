import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

export async function GET() {
  const testResults = {
    timestamp: new Date().toISOString(),
    tests: [] as any[],
    summary: {
      passed: 0,
      failed: 0,
      total: 0,
    },
  }

  const addTest = (name: string, success: boolean, data?: any, error?: any) => {
    testResults.tests.push({
      name,
      success,
      data,
      error: error?.message || error,
      timestamp: new Date().toISOString(),
    })
    if (success) {
      testResults.summary.passed++
    } else {
      testResults.summary.failed++
    }
    testResults.summary.total++
  }

  try {
    console.log("🔍 Starting comprehensive database tests...")

    // Test 1: Create Supabase Client
    let supabase
    try {
      supabase = await createServiceClient()
      addTest("Create Supabase Client", true, { clientCreated: true })
    } catch (error) {
      addTest("Create Supabase Client", false, null, error)
      return NextResponse.json(testResults, { status: 500 })
    }

    // Test 2: Basic Database Connection
    try {
      const { data, error } = await supabase.from("users").select("count").limit(1)
      if (error) throw error
      addTest("Basic Database Connection", true, { connectionWorking: true })
    } catch (error) {
      addTest("Basic Database Connection", false, null, error)
    }

    // Test 3: Check if users table exists and has data
    try {
      const { data: users, error } = await supabase.from("users").select("id, email, name, role").limit(5)
      if (error) throw error
      addTest("Users Table Query", true, {
        userCount: users?.length || 0,
        sampleUsers: users?.map((u) => ({ email: u.email, role: u.role })) || [],
      })
    } catch (error) {
      addTest("Users Table Query", false, null, error)
    }

    // Test 4: Check for Master Dev Users
    try {
      const { data: masterDevs, error } = await supabase
        .from("users")
        .select("id, email, name, role, tier, submission_credits, is_verified, created_at")
        .eq("role", "master_dev")

      if (error) throw error

      const harrisUser = masterDevs?.find((u) => u.email === "2668harris@gmail.com")
      const ipxsUser = masterDevs?.find((u) => u.email === "ipxsdev@gmail.com")

      addTest("Master Dev Users Check", true, {
        totalMasterDevs: masterDevs?.length || 0,
        harrisExists: !!harrisUser,
        ipxsExists: !!ipxsUser,
        harrisData: harrisUser || null,
        ipxsData: ipxsUser || null,
        allMasterDevs: masterDevs || [],
      })
    } catch (error) {
      addTest("Master Dev Users Check", false, null, error)
    }

    // Test 5: Check user_sessions table
    try {
      const { data: sessions, error } = await supabase
        .from("user_sessions")
        .select("id, user_id, expires_at, created_at")
        .limit(5)

      if (error) throw error
      addTest("User Sessions Table", true, {
        sessionCount: sessions?.length || 0,
        activeSessions: sessions?.filter((s) => new Date(s.expires_at) > new Date()).length || 0,
      })
    } catch (error) {
      addTest("User Sessions Table", false, null, error)
    }

    // Test 6: Test specific user lookup (Harris)
    try {
      const { data: harrisUser, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", "2668harris@gmail.com")
        .single()

      if (error && error.code !== "PGRST116") throw error // PGRST116 is "not found"

      addTest("Harris User Lookup", true, {
        userFound: !!harrisUser,
        userData: harrisUser || null,
        error: error?.code === "PGRST116" ? "User not found" : null,
      })
    } catch (error) {
      addTest("Harris User Lookup", false, null, error)
    }

    // Test 7: Test database permissions
    try {
      // Try to insert a test record (we'll delete it immediately)
      const testUser = {
        email: `test-${Date.now()}@example.com`,
        name: "Test User",
        tier: "creator",
        role: "user",
        submission_credits: 0,
        is_verified: false,
      }

      const { data: insertedUser, error: insertError } = await supabase.from("users").insert(testUser).select().single()

      if (insertError) throw insertError

      // Clean up - delete the test user
      const { error: deleteError } = await supabase.from("users").delete().eq("id", insertedUser.id)

      if (deleteError) {
        console.warn("Failed to clean up test user:", deleteError)
      }

      addTest("Database Write Permissions", true, {
        canInsert: true,
        canDelete: !deleteError,
        testUserId: insertedUser.id,
      })
    } catch (error) {
      addTest("Database Write Permissions", false, null, error)
    }

    // Test 8: Check table structure
    try {
      const { data, error } = await supabase.rpc("get_table_info", { table_name: "users" }).limit(1)
      // This might fail if the function doesn't exist, which is okay
      addTest("Table Structure Check", !error, data, error)
    } catch (error) {
      addTest("Table Structure Check", false, null, "RPC function not available (this is okay)")
    }

    // Test 9: Environment Variables Check
    try {
      const envVars = {
        NEXT_PUBLIC_SUPABASE_URL: {
          exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          value: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "..." || "Not set",
        },
        SUPABASE_SERVICE_ROLE_KEY: {
          exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
        },
        MASTER_DEV_KEY_HARRIS: {
          exists: !!process.env.MASTER_DEV_KEY_HARRIS,
          value: process.env.MASTER_DEV_KEY_HARRIS || "Using default: TMBM_MAgSTE68_HAR_20h24_SEC4URE",
          isDefault: !process.env.MASTER_DEV_KEY_HARRIS,
        },
      }

      addTest("Environment Variables", true, envVars)
    } catch (error) {
      addTest("Environment Variables", false, null, error)
    }

    console.log(`✅ Database tests completed: ${testResults.summary.passed}/${testResults.summary.total} passed`)

    return NextResponse.json(testResults)
  } catch (error) {
    console.error("❌ Database test suite failed:", error)
    addTest("Test Suite Execution", false, null, error)
    return NextResponse.json(testResults, { status: 500 })
  }
}
