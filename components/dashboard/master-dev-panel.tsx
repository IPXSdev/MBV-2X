"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Database, Users, RefreshCw, Download, AlertTriangle, Shield, Terminal, ChevronUp } from "lucide-react"
import Link from "next/link"

interface MasterDevPanelProps {
  user: {
    id: string
    email: string
    role: string
  }
}

interface SystemStats {
  totalUsers: number
  totalSubmissions: number
  pendingReviews: number
  systemHealth: "healthy" | "warning" | "error"
  activeUsers: number
  storageUsed: string
}

export function MasterDevPanel({ user }: MasterDevPanelProps) {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  const isMasterDev = user.role === "master_dev"

  useEffect(() => {
    if (isMasterDev) {
      fetchStats()
    }
  }, [isMasterDev])

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
    if (!confirm(`Are you sure you want to ${action.replace("-", " ")}? This action cannot be undone.`)) {
      return
    }

    setActionLoading(action)
    try {
      const response = await fetch(`/api/admin/system/${action}`, {
        method: "POST",
      })

      if (response.ok) {
        await fetchStats() // Refresh stats after action
        alert(`${action.replace("-", " ")} completed successfully`)
      } else {
        throw new Error(`Failed to ${action}`)
      }
    } catch (error) {
      console.error(`Error executing ${action}:`, error)
      alert(`Failed to ${action.replace("-", " ")}`)
    } finally {
      setActionLoading(null)
    }
  }

  if (!isMasterDev) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-lg shadow-xl overflow-hidden">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-white" />
          <h2 className="text-xl font-bold text-white">Master Dev Panel</h2>
          <span className="bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full">MASTER</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-purple-800/50"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronUp className={`h-5 w-5 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </Button>
      </div>

      {!collapsed && (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4 p-4">
            <Card className="bg-purple-900/50 border-none shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-4xl font-bold text-white">{loading ? "..." : stats?.totalUsers || 0}</div>
                <div className="text-sm text-gray-300">Total Users</div>
              </CardContent>
            </Card>

            <Card className="bg-purple-900/50 border-none shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-4xl font-bold text-white">{loading ? "..." : stats?.totalSubmissions || 0}</div>
                <div className="text-sm text-gray-300">Submissions</div>
              </CardContent>
            </Card>

            <Card className="bg-purple-900/50 border-none shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-4xl font-bold text-white">{loading ? "..." : stats?.activeUsers || 0}</div>
                <div className="text-sm text-gray-300">Active Users</div>
              </CardContent>
            </Card>

            <Card className="bg-purple-900/50 border-none shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-4xl font-bold text-green-400">
                  {loading ? "..." : stats?.systemHealth === "healthy" ? "Good" : "Warning"}
                </div>
                <div className="text-sm text-gray-300">System Health</div>
              </CardContent>
            </Card>
          </div>

          {/* Separator */}
          <div className="border-t border-purple-700/50 mx-4"></div>

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-4 p-4">
            <Link href="/admin" className="block">
              <div className="bg-purple-600 hover:bg-purple-700 transition-colors rounded-lg p-4 text-center h-full">
                <Shield className="h-8 w-8 mx-auto mb-2 text-white" />
                <h3 className="text-lg font-semibold text-white">Admin Portal</h3>
                <p className="text-xs text-purple-200">Full admin dashboard</p>
              </div>
            </Link>

            <Link href="/debug" className="block">
              <div className="bg-green-600 hover:bg-green-700 transition-colors rounded-lg p-4 text-center h-full">
                <Terminal className="h-8 w-8 mx-auto mb-2 text-white" />
                <h3 className="text-lg font-semibold text-white">Debug Console</h3>
                <p className="text-xs text-green-200">System diagnostics</p>
              </div>
            </Link>

            <Link href="/admin?tab=users" className="block">
              <div className="bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg p-4 text-center h-full">
                <Users className="h-8 w-8 mx-auto mb-2 text-white" />
                <h3 className="text-lg font-semibold text-white">User Management</h3>
                <p className="text-xs text-blue-200">Manage all users</p>
              </div>
            </Link>

            <Link href="/debug/database" className="block">
              <div className="bg-orange-600 hover:bg-orange-700 transition-colors rounded-lg p-4 text-center h-full">
                <Database className="h-8 w-8 mx-auto mb-2 text-white" />
                <h3 className="text-lg font-semibold text-white">Database Tools</h3>
                <p className="text-xs text-orange-200">Database operations</p>
              </div>
            </Link>
          </div>

          {/* Separator */}
          <div className="border-t border-purple-700/50 mx-4"></div>

          {/* System Actions */}
          <div className="grid grid-cols-3 gap-4 p-4">
            <Button
              onClick={() => handleSystemAction("clear-cache")}
              disabled={actionLoading === "clear-cache"}
              className="bg-amber-600 hover:bg-amber-700 text-white h-12"
            >
              {actionLoading === "clear-cache" ? (
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-5 w-5 mr-2" />
              )}
              Clear Cache
            </Button>

            <Button
              onClick={() => handleSystemAction("export-data")}
              disabled={actionLoading === "export-data"}
              className="bg-blue-600 hover:bg-blue-700 text-white h-12"
            >
              {actionLoading === "export-data" ? (
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Download className="h-5 w-5 mr-2" />
              )}
              Export Data
            </Button>

            <Button
              onClick={() => handleSystemAction("emergency-reset")}
              disabled={actionLoading === "emergency-reset"}
              className="bg-red-600 hover:bg-red-700 text-white h-12"
            >
              {actionLoading === "emergency-reset" ? (
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <AlertTriangle className="h-5 w-5 mr-2" />
              )}
              Emergency Reset
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
