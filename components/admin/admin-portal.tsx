"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { TierManagementPanel } from "@/components/admin/tier-management-panel"
import {
  Users,
  FileText,
  BarChart3,
  Settings,
  Search,
  RefreshCw,
  Trash2,
  Edit,
  Shield,
  Crown,
  Play,
  Download,
  Star,
  Clock,
  Music,
  Plus,
  Minus,
} from "lucide-react"

interface AdminUser {
  id: string
  email: string
  username: string
  role: string
  tier: string
  submission_credits: number
  created_at: string
  last_login?: string
  total_submissions?: number
}

interface Submission {
  id: string
  track_title: string
  artist_name: string
  genre?: string
  status: "pending" | "in_review" | "approved" | "rejected"
  admin_rating?: number
  admin_feedback?: string
  created_at: string
  updated_at?: string
  file_url?: string
  file_size?: number
  mood_tags?: string[]
  description?: string
  users?: {
    id: string
    username: string
    email: string
    tier: string
  }
}

interface Stats {
  submissions: {
    total: number
    pending: number
    approved: number
    rejected: number
    in_review: number
  }
  users: {
    total: number
    creator: number
    indie: number
    pro: number
    admins: number
  }
  activity: {
    recentSubmissions: number
    recentUsers: number
  }
}

interface MediaItem {
  id: string
  title: string
  description?: string
  url: string
  type: "youtube" | "upload"
  thumbnail?: string
  created_at: string
}

export function AdminPortal() {
  const { user } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [media, setMedia] = useState<MediaItem[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("submissions")

  // Media management states
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [videoTitle, setVideoTitle] = useState("")
  const [videoDescription, setVideoDescription] = useState("")
  const [uploadingMedia, setUploadingMedia] = useState(false)

  // User management states
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [userFilter, setUserFilter] = useState("all")
  const [tierFilter, setTierFilter] = useState("all")
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<AdminUser | null>(null)
  const [showTierPanel, setShowTierPanel] = useState(false)

  // Submission management states
  const [submissionFilter, setSubmissionFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [usersRes, submissionsRes, statsRes] = await Promise.all([
        fetch("/api/admin/users").catch(() => ({ ok: false, json: () => Promise.resolve({ users: [] }) })),
        fetch("/api/admin/submissions").catch(() => ({ ok: false, json: () => Promise.resolve({ submissions: [] }) })),
        fetch("/api/admin/stats").catch(() => ({
          ok: false,
          json: () =>
            Promise.resolve({
              submissions: { total: 0, pending: 0, approved: 0, rejected: 0, in_review: 0 },
              users: { total: 0, creator: 0, indie: 0, pro: 0, admins: 0 },
              activity: { recentSubmissions: 0, recentUsers: 0 },
            }),
        })),
      ])

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users || [])
      }

      if (submissionsRes.ok) {
        const submissionsData = await submissionsRes.json()
        setSubmissions(submissionsData.submissions || [])
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      // Try to fetch media, but don't fail if it doesn't exist
      try {
        const mediaRes = await fetch("/api/admin/media")
        if (mediaRes.ok) {
          const mediaData = await mediaRes.json()
          setMedia(mediaData.media || [])
        }
      } catch (mediaError) {
        console.warn("Media endpoint not available:", mediaError)
        setMedia([])
      }
    } catch (error) {
      console.error("Error fetching admin data:", error)
      setError("Failed to load admin data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSyncYouTubeVideo = async () => {
    if (!youtubeUrl.trim()) return

    setUploadingMedia(true)
    try {
      const response = await fetch("/api/admin/media/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: youtubeUrl,
          title: videoTitle,
          description: videoDescription,
        }),
      })

      if (response.ok) {
        setYoutubeUrl("")
        setVideoTitle("")
        setVideoDescription("")
        fetchData() // Refresh data
      }
    } catch (error) {
      console.error("Error syncing YouTube video:", error)
    } finally {
      setUploadingMedia(false)
    }
  }

  const handleBulkUserAction = async (action: string) => {
    if (selectedUsers.length === 0) return

    try {
      const response = await fetch("/api/admin/users/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          userIds: selectedUsers,
        }),
      })

      if (response.ok) {
        setSelectedUsers([])
        fetchData()
      }
    } catch (error) {
      console.error("Error performing bulk action:", error)
    }
  }

  const handleEditUser = (user: AdminUser) => {
    setSelectedUserForEdit(user)
    setShowTierPanel(true)
  }

  const handleUserUpdate = (userId: string) => {
    setShowTierPanel(false)
    setSelectedUserForEdit(null)
    fetchData() // Refresh data
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = userFilter === "all" || u.role === userFilter
    const matchesTier = tierFilter === "all" || u.tier === tierFilter
    return matchesSearch && matchesRole && matchesTier
  })

  const filteredSubmissions = submissions.filter((s) => {
    const matchesSearch =
      s.track_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.artist_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.users?.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || s.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-300">Loading admin portal...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Error Loading Admin Portal</h1>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button onClick={fetchData} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center">
              {user?.role === "master_dev" ? (
                <Crown className="h-8 w-8 mr-3 text-yellow-500" />
              ) : (
                <Shield className="h-8 w-8 mr-3 text-blue-500" />
              )}
              Admin Portal
            </h1>
            <p className="text-gray-400 mt-2">
              Welcome back, {user?.username || user?.email} • {user?.role?.replace("_", " ").toUpperCase()}
            </p>
          </div>
          <Button onClick={fetchData} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Total Submissions</p>
                  <p className="text-2xl font-bold text-white">{stats?.submissions.total || 0}</p>
                  <div className="flex space-x-4 text-xs mt-1">
                    <span className="text-yellow-400">{stats?.submissions.pending || 0} pending</span>
                    <span className="text-green-400">{stats?.submissions.approved || 0} approved</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Users className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold text-white">{stats?.users.total || 0}</p>
                  <div className="flex space-x-4 text-xs mt-1">
                    <span className="text-blue-400">{(stats?.users.indie || 0) + (stats?.users.pro || 0)} paid</span>
                    <span className="text-gray-400">{stats?.users.creator || 0} free</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Recent Activity</p>
                  <p className="text-2xl font-bold text-white">{stats?.activity.recentSubmissions || 0}</p>
                  <p className="text-xs text-gray-400 mt-1">Submissions (30 days)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Review Queue</p>
                  <p className="text-2xl font-bold text-white">{stats?.submissions.pending || 0}</p>
                  <p className="text-xs text-gray-400 mt-1">Awaiting review</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="submissions" className="data-[state=active]:bg-gray-700">
              <FileText className="h-4 w-4 mr-2" />
              Submissions
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-gray-700">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gray-700">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-gray-700">
              <Settings className="h-4 w-4 mr-2" />
              System
            </TabsTrigger>
          </TabsList>

          {/* Submissions Tab */}
          <TabsContent value="submissions">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Submission Management</CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search submissions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64 bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32 bg-gray-700 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_review">In Review</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left p-3 text-gray-300">Track</th>
                        <th className="text-left p-3 text-gray-300">Artist</th>
                        <th className="text-left p-3 text-gray-300">User</th>
                        <th className="text-left p-3 text-gray-300">Status</th>
                        <th className="text-left p-3 text-gray-300">Rating</th>
                        <th className="text-left p-3 text-gray-300">Submitted</th>
                        <th className="text-left p-3 text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubmissions.map((submission) => (
                        <tr key={submission.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                          <td className="p-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                                <Music className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="font-medium text-white">{submission.track_title}</p>
                                <p className="text-sm text-gray-400">{submission.genre}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-gray-300">{submission.artist_name}</td>
                          <td className="p-3">
                            <div>
                              <p className="text-gray-300">{submission.users?.username}</p>
                              <p className="text-xs text-gray-500">{submission.users?.email}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge
                              className={`${
                                submission.status === "approved"
                                  ? "bg-green-500/20 text-green-400"
                                  : submission.status === "pending"
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : submission.status === "in_review"
                                      ? "bg-blue-500/20 text-blue-400"
                                      : "bg-red-500/20 text-red-400"
                              }`}
                            >
                              {submission.status.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {submission.admin_rating ? (
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                <span className="text-yellow-400">{submission.admin_rating}</span>
                              </div>
                            ) : (
                              <span className="text-gray-500">Unrated</span>
                            )}
                          </td>
                          <td className="p-3 text-gray-400 text-sm">
                            {new Date(submission.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <div className="flex space-x-2">
                              {submission.file_url && (
                                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                                  <Play className="h-4 w-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">User Management</CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64 bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <Select value={tierFilter} onValueChange={setTierFilter}>
                      <SelectTrigger className="w-32 bg-gray-700 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="all">All Tiers</SelectItem>
                        <SelectItem value="creator">Creator</SelectItem>
                        <SelectItem value="indie">Indie</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                      </SelectContent>
                    </Select>
                    {selectedUsers.length > 0 && (
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBulkUserAction("grant_credits")}
                          className="border-gray-600"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Grant Credits
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBulkUserAction("suspend")}
                          className="border-gray-600 text-red-400"
                        >
                          <Minus className="h-4 w-4 mr-1" />
                          Suspend
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left p-3 text-gray-300">
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers(filteredUsers.map((u) => u.id))
                              } else {
                                setSelectedUsers([])
                              }
                            }}
                            className="rounded bg-gray-700 border-gray-600"
                          />
                        </th>
                        <th className="text-left p-3 text-gray-300">User</th>
                        <th className="text-left p-3 text-gray-300">Role</th>
                        <th className="text-left p-3 text-gray-300">Tier</th>
                        <th className="text-left p-3 text-gray-300">Credits</th>
                        <th className="text-left p-3 text-gray-300">Submissions</th>
                        <th className="text-left p-3 text-gray-300">Last Login</th>
                        <th className="text-left p-3 text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUsers([...selectedUsers, user.id])
                                } else {
                                  setSelectedUsers(selectedUsers.filter((id) => id !== user.id))
                                }
                              }}
                              className="rounded bg-gray-700 border-gray-600"
                            />
                          </td>
                          <td className="p-3">
                            <div>
                              <p className="font-medium text-white">{user.username}</p>
                              <p className="text-sm text-gray-400">{user.email}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge
                              className={`${
                                user.role === "master_dev"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : user.role === "admin"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : "bg-gray-500/20 text-gray-400"
                              }`}
                            >
                              {user.role.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge
                              className={`${
                                user.tier === "pro"
                                  ? "bg-purple-500/20 text-purple-400"
                                  : user.tier === "indie"
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-gray-500/20 text-gray-400"
                              }`}
                            >
                              {user.tier}
                            </Badge>
                          </td>
                          <td className="p-3 text-gray-300">{user.submission_credits}</td>
                          <td className="p-3 text-gray-300">{user.total_submissions || 0}</td>
                          <td className="p-3 text-gray-400 text-sm">
                            {user.last_login ? new Date(user.last_login).toLocaleDateString() : "Never"}
                          </td>
                          <td className="p-3">
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-white"
                                onClick={() => handleEditUser(user)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-400">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Submission Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Submissions</span>
                      <span className="text-white font-medium">{stats?.submissions.total || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Pending Review</span>
                      <span className="text-yellow-400 font-medium">{stats?.submissions.pending || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Approved</span>
                      <span className="text-green-400 font-medium">{stats?.submissions.approved || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Rejected</span>
                      <span className="text-red-400 font-medium">{stats?.submissions.rejected || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">User Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Users</span>
                      <span className="text-white font-medium">{stats?.users.total || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Creator Tier</span>
                      <span className="text-gray-400 font-medium">{stats?.users.creator || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Indie Tier</span>
                      <span className="text-green-400 font-medium">{stats?.users.indie || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Pro Tier</span>
                      <span className="text-purple-400 font-medium">{stats?.users.pro || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Database Status</span>
                      <Badge className="bg-green-500/20 text-green-400">Healthy</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Storage Status</span>
                      <Badge className="bg-green-500/20 text-green-400">Healthy</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">API Status</span>
                      <Badge className="bg-green-500/20 text-green-400">Healthy</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {user?.role === "master_dev" && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white text-red-400">Master Dev Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start border-blue-600 text-blue-400 bg-transparent"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Clear System Cache
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start border-green-600 text-green-400 bg-transparent"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export All Data
                    </Button>
                    <Separator className="bg-gray-700" />
                    <Button
                      variant="outline"
                      className="w-full justify-start border-red-600 text-red-400 bg-transparent"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Emergency Reset
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Tier Management Panel */}
      {selectedUserForEdit && (
        <TierManagementPanel
          user={selectedUserForEdit}
          isOpen={showTierPanel}
          onClose={() => {
            setShowTierPanel(false)
            setSelectedUserForEdit(null)
          }}
          onUpdate={handleUserUpdate}
        />
      )}
    </div>
  )
}
