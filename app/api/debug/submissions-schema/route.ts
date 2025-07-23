import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get the table schema
    const { data: schema, error: schemaError } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type")
      .eq("table_name", "submissions")
      .eq("table_schema", "public")

    if (schemaError) {
      console.error("Schema error:", schemaError)
    }

    // Try to get a sample submission to see actual structure
    const { data: sample, error: sampleError } = await supabase.from("submissions").select("*").limit(1)

    if (sampleError) {
      console.error("Sample error:", sampleError)
    }

    return NextResponse.json({
      schema: schema || [],
      sample: sample || [],
      schemaError,
      sampleError,
    })
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json({ error: "Debug failed" }, { status: 500 })
  }
}
