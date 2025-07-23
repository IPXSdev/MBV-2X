"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Settings, Database, FileText, Shield, X, ExternalLink, RefreshCw, Download, Trash2 } from "lucide-react"
import Link from "next/link"

interface SystemStats {
  totalUsers: number
  totalSubmissions: number
  pendingReviews: number
  systemHealth: "healthy" | "warning" | "error"
}

export function DevToolbar() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(false)

  // Only show for specific admin/master_dev accounts
  const shouldShow =
    user &&
    (user.role === "admin" || user.role === "master_dev") &&
    (user.email.includes("2668") || user.email.includes("ipxs"))

  useEffect(() => {
    if (isOpen && !stats) {
      fetchStats()
    }
  }, [isOpen])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSystemAction = async (action: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/system/${action}`, {
        method: "POST",
      })
      if (response.ok) {
        await fetchStats() // Refresh stats
      }
    } catch (error) {
      console.error(`Error executing ${action}:`, error)
    } finally {
      setLoading(false)
    }
  }

  if (!shouldShow) return null

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setIsOpen(true)}
            className="rounded-full w-14 h-14 bg-purple-600 hover:bg-purple-700 shadow-lg"
            size="icon"
          >
            <Settings className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Sliding Panel */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-96 bg-gray-900 shadow-2xl border-l border-gray-800 transform transition-transform duration-300 ease-in-out">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-purple-600 text-white">
              <div className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                <h2 className="font-semibold">{user?.role === "master_dev" ? "Master Dev Tools" : "Admin Tools"}</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-purple-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* User Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Current User</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{user?.email}</p>
                    <Badge variant={user?.role === "master_dev" ? "destructive" : "secondary"}>{user?.role}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* System Stats */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">System Stats</CardTitle>
                    <Button variant="ghost" size="icon" onClick={fetchStats} disabled={loading} className="h-6 w-6">
                      <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {stats ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Users:</span>
                        <span className="font-medium">{stats.totalUsers}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Submissions:</span>
                        <span className="font-medium">{stats.totalSubmissions}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Pending:</span>
                        <span className="font-medium">{stats.pendingReviews}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Health:</span>
                        <Badge
                          variant={
                            stats.systemHealth === "healthy"
                              ? "default"
                              : stats.systemHealth === "warning"
                                ? "secondary"
                                : "destructive"
                          }
                          className="text-xs"
                        >
                          {stats.systemHealth}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Loading...</p>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <Link href="/admin" className="block">
                    <Button variant="outline" className="w-full justify-start text-sm h-8 bg-transparent">
                      <Shield className="h-3 w-3 mr-2" />
                      Admin Portal
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </Button>
                  </Link>

                  <Link href="/debug" className="block">
                    <Button variant="outline" className="w-full justify-start text-sm h-8 bg-transparent">
                      <Database className="h-3 w-3 mr-2" />
                      Debug Console
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </Button>
                  </Link>

                  <Link href="/submissions" className="block">
                    <Button variant="outline" className="w-full justify-start text-sm h-8 bg-transparent">
                      <FileText className="h-3 w-3 mr-2" />
                      All Submissions
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Master Dev Actions */}
              {user?.role === "master_dev" && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-red-600">Master Dev Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start text-sm h-8 text-blue-600 border-blue-200 bg-transparent"
                      onClick={() => handleSystemAction("clear-cache")}
                      disabled={loading}
                    >
                      <RefreshCw className="h-3 w-3 mr-2" />
                      Clear Cache
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start text-sm h-8 text-green-600 border-green-200 bg-transparent"
                      onClick={() => handleSystemAction("export-data")}
                      disabled={loading}
                    >
                      <Download className="h-3 w-3 mr-2" />
                      Export Data
                    </Button>

                    <Separator />

                    <Button
                      variant="outline"
                      className="w-full justify-start text-sm h-8 text-red-600 border-red-200 bg-transparent"
                      onClick={() => handleSystemAction("emergency-reset")}
                      disabled={loading}
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Emergency Reset
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Environment Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Environment</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Mode:</span>
                      <Badge variant="outline" className="text-xs">
                        {process.env.NODE_ENV}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Version:</span>
                      <span className="text-gray-500">1.0.0</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-25 z-40" onClick={() => setIsOpen(false)} />}
    </>
  )
}
