import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    // Get the schema information for the users table
    const { data: columnsInfo, error: columnsError } = await supabase.rpc("get_table_columns", {
      table_name: "users",
    })

    if (columnsError) {
      // If the RPC function doesn't exist, try a different approach
      // Get a sample user to inspect the structure
      const { data: sampleUser, error: userError } = await supabase.from("users").select("*").limit(1).single()

      if (userError) {
        return NextResponse.json(
          {
            error: "Failed to get users schema",
            details: userError.message,
          },
          { status: 500 },
        )
      }

      // Return the structure of a sample user
      return NextResponse.json({
        message: "Users schema retrieved from sample user",
        columns: Object.keys(sampleUser || {}).map((key) => ({
          column_name: key,
          data_type: typeof sampleUser[key],
        })),
        sample: sampleUser,
      })
    }

    return NextResponse.json({
      message: "Users schema retrieved",
      columns: columnsInfo,
    })
  } catch (error) {
    console.error("Error getting users schema:", error)
    return NextResponse.json(
      {
        error: "Failed to get users schema",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
