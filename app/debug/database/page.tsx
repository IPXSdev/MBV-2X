"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database, RefreshCw, AlertCircle, Table, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function DatabaseDebugPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [schemaData, setSchemaData] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    loadSchemaData()
  }, [])

  const loadSchemaData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/debug/database-schema")
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`)
      }

      const data = await response.json()
      setSchemaData(data)
    } catch (error) {
      console.error("Error loading schema data:", error)
      setError(error instanceof Error ? error.message : "Failed to load schema data")
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    router.back()
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Database className="h-6 w-6 text-blue-400" />
            <h1 className="text-2xl font-bold">Database Schema Debug</h1>
          </div>
          <Button variant="outline" onClick={goBack} className="border-gray-600 bg-transparent">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 text-gray-400 animate-spin mr-2" />
            <span className="text-gray-400">Loading schema data...</span>
          </div>
        ) : error ? (
          <Alert className="bg-red-900/20 border-red-500/50">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {/* Tables List */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Table className="h-5 w-5 mr-2 text-blue-400" />
                  Database Tables
                </CardTitle>
                <CardDescription className="text-gray-400">List of tables in the public schema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {schemaData?.tables?.map((table: any) => (
                    <div
                      key={table.table_name}
                      className="bg-gray-700/50 rounded p-2 text-sm hover:bg-gray-700 transition-colors"
                    >
                      {table.table_name}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Submissions Table Schema */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Table className="h-5 w-5 mr-2 text-purple-400" />
                  Submissions Table Schema
                </CardTitle>
                <CardDescription className="text-gray-400">Column structure of the submissions table</CardDescription>
              </CardHeader>
              <CardContent>
                {schemaData?.submissionsColumns?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-2 px-4 text-gray-400">Column Name</th>
                          <th className="text-left py-2 px-4 text-gray-400">Data Type</th>
                          <th className="text-left py-2 px-4 text-gray-400">Nullable</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schemaData.submissionsColumns.map((column: any) => (
                          <tr key={column.column_name} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                            <td className="py-2 px-4 font-medium">{column.column_name}</td>
                            <td className="py-2 px-4 text-gray-300">{column.data_type}</td>
                            <td className="py-2 px-4 text-gray-300">{column.is_nullable === "YES" ? "Yes" : "No"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-400">No columns found for submissions table</div>
                )}
              </CardContent>
            </Card>

            {/* Sample Submission */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Database className="h-5 w-5 mr-2 text-green-400" />
                  Sample Submission
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Example of a submission record from the database
                </CardDescription>
              </CardHeader>
              <CardContent>
                {schemaData?.sampleSubmission ? (
                  <div className="bg-gray-700/50 p-4 rounded overflow-x-auto">
                    <pre className="text-xs text-gray-300">{JSON.stringify(schemaData.sampleSubmission, null, 2)}</pre>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-400">No sample submission found</div>
                )}
              </CardContent>
            </Card>

            {/* Submissions Count */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Database className="h-5 w-5 mr-2 text-yellow-400" />
                  Submissions Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center p-6 bg-gray-700/50 rounded">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-yellow-400">{schemaData?.submissionsCount || 0}</div>
                    <div className="text-gray-400 mt-2">Total Submissions</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Errors */}
            {schemaData?.errors && Object.values(schemaData.errors).some(Boolean) && (
              <Card className="bg-gray-800 border-red-500/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 text-red-400" />
                    Schema Errors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(schemaData.errors)
                      .filter(([_, value]) => Boolean(value))
                      .map(([key, value]) => (
                        <div key={key} className="bg-red-900/20 border border-red-500/20 rounded p-3">
                          <p className="text-red-300 font-medium">{key}:</p>
                          <p className="text-red-200 text-sm mt-1">{value as string}</p>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-center mt-8">
              <Button onClick={loadSchemaData} className="bg-blue-600 hover:bg-blue-700">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh Schema Data
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
