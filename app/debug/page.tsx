"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Database, Search, Shield, Loader2, CheckCircle, AlertCircle, RefreshCw, Play, Settings } from "lucide-react"

export default function DebugPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const runDatabaseTest = async () => {
    setLoading(true)
    setResults(null)

    try {
      const response = await fetch("/api/debug/database")
      const data = await response.json()
      setResults({ type: "database", data })
    } catch (error) {
      setResults({
        type: "error",
        data: { error: error instanceof Error ? error.message : "Unknown error" },
      })
    } finally {
      setLoading(false)
    }
  }

  const runUserLookup = async () => {
    if (!email) return

    setLoading(true)
    setResults(null)

    try {
      const response = await fetch("/api/debug/user-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      setResults({ type: "user-lookup", data })
    } catch (error) {
      setResults({
        type: "error",
        data: { error: error instanceof Error ? error.message : "Unknown error" },
      })
    } finally {
      setLoading(false)
    }
  }

  const runAuthTest = async () => {
    if (!email || !password) return

    setLoading(true)
    setResults(null)

    try {
      const response = await fetch("/api/debug/test-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()
      setResults({ type: "auth-test", data })
    } catch (error) {
      setResults({
        type: "error",
        data: { error: error instanceof Error ? error.message : "Unknown error" },
      })
    } finally {
      setLoading(false)
    }
  }

  const renderResults = () => {
    if (!results) return null

    if (results.type === "error") {
      return (
        <Alert className="bg-red-900/50 border-red-700">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-200">{results.data.error}</AlertDescription>
        </Alert>
      )
    }

    return (
      <div className="space-y-4">
        <pre className="bg-gray-800 p-4 rounded-lg text-sm text-gray-300 overflow-auto max-h-96">
          {JSON.stringify(results.data, null, 2)}
        </pre>

        {results.type === "database" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-green-900/20 border-green-700">
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <p className="text-green-300 font-semibold">{results.data.summary.passed} Passed</p>
              </CardContent>
            </Card>
            <Card className="bg-red-900/20 border-red-700">
              <CardContent className="p-4 text-center">
                <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                <p className="text-red-300 font-semibold">{results.data.summary.failed} Failed</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-900/20 border-blue-700">
              <CardContent className="p-4 text-center">
                <Settings className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <p className="text-blue-300 font-semibold">{results.data.summary.total} Total</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">TMBM Debug Console</h1>
          <p className="text-gray-400">Test database connections, user lookups, and authentication</p>
        </div>

        <Tabs defaultValue="database" className="space-y-6">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="database" className="data-[state=active]:bg-gray-700">
              <Database className="h-4 w-4 mr-2" />
              Database Tests
            </TabsTrigger>
            <TabsTrigger value="user-lookup" className="data-[state=active]:bg-gray-700">
              <Search className="h-4 w-4 mr-2" />
              User Lookup
            </TabsTrigger>
            <TabsTrigger value="auth-test" className="data-[state=active]:bg-gray-700">
              <Shield className="h-4 w-4 mr-2" />
              Auth Test
            </TabsTrigger>
          </TabsList>

          <TabsContent value="database" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Database Connection & Structure Tests
                </CardTitle>
                <CardDescription>
                  Comprehensive tests for database connectivity, table structure, and data integrity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={runDatabaseTest} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running Tests...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Run Database Tests
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="user-lookup" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2" />
                  User Lookup Test
                </CardTitle>
                <CardDescription>Test user existence and data retrieval from the database</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="lookup-email" className="text-white">
                    Email Address
                  </Label>
                  <Input
                    id="lookup-email"
                    type="email"
                    placeholder="Enter email to lookup"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <Button
                  onClick={runUserLookup}
                  disabled={loading || !email}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Looking up...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Lookup User
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="auth-test" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Authentication Test
                </CardTitle>
                <CardDescription>Step-by-step authentication process testing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="auth-email" className="text-white">
                      Email Address
                    </Label>
                    <Input
                      id="auth-email"
                      type="email"
                      placeholder="Enter email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="auth-password" className="text-white">
                      Password
                    </Label>
                    <Input
                      id="auth-password"
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <Button
                  onClick={runAuthTest}
                  disabled={loading || !email || !password}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Test Authentication
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Results Section */}
        {results && (
          <Card className="bg-gray-800 border-gray-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Test Results
                <Button onClick={() => setResults(null)} variant="outline" size="sm" className="border-gray-600">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>{renderResults()}</CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
