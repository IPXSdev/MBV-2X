import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/supabase/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || !["admin", "master_dev"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    // Get all tables in the public schema
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .order("table_name")

    if (tablesError) {
      console.error("Error fetching tables:", tablesError)
      return NextResponse.json({ error: "Failed to fetch tables" }, { status: 500 })
    }

    // Get columns for the submissions table
    const { data: columns, error: columnsError } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type, is_nullable")
      .eq("table_schema", "public")
      .eq("table_name", "submissions")
      .order("ordinal_position")

    if (columnsError) {
      console.error("Error fetching columns:", columnsError)
    }

    // Try to get a sample submission
    const { data: sampleSubmission, error: sampleError } = await supabase.from("submissions").select("*").limit(1)

    if (sampleError) {
      console.error("Error fetching sample submission:", sampleError)
    }

    // Get all submissions count
    const { count, error: countError } = await supabase.from("submissions").select("*", { count: "exact", head: true })

    if (countError) {
      console.error("Error counting submissions:", countError)
    }

    return NextResponse.json({
      tables: tables || [],
      submissionsColumns: columns || [],
      sampleSubmission: sampleSubmission?.[0] || null,
      submissionsCount: count || 0,
      errors: {
        tables: tablesError?.message,
        columns: columnsError?.message,
        sample: sampleError?.message,
        count: countError?.message,
      },
    })
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json({ error: "Debug failed" }, { status: 500 })
  }
}
