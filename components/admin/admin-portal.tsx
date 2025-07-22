"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Users,
  Music,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Play,
  Star,
  MessageSquare,
  Settings,
  Shield,
  Upload,
  Youtube,
  Edit,
  Eye,
  RefreshCw,
  Home,
  Trash2,
  Download,
  BarChart3,
  Activity,
  Database,
  Server,
  Zap,
  Crown,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  FileText,
  Headphones,
  Pause,
  CreditCard,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { formatRelativeTime, formatDuration } from "@/lib/utils"

interface User {
  id: string
  email: string
  name: string
  tier: string
  role: string
  submission_credits: number
  is_verified: boolean
  created_at: string
  updated_at: string
}

interface Submission {
  id: string
  status: string
  created_at: string
  updated_at: string
  users: { name: string; email: string }
  tracks: { title: string; artist: string; duration: number; file_url: string }
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

interface Media {
  id: string
  title: string
  description: string
  media_type: string
  youtube_url?: string
  file_url?: string
  thumbnail_url?: string
  is_public: boolean
  created_at: string
}

export function AdminPortal({ user }: { user: any }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  // Filters and search
  const [submissionFilter, setSubmissionFilter] = useState("all")
  const [submissionSearch, setSubmissionSearch] = useState("")
  const [userFilter, setUserFilter] = useState("all")
  const [userSearch, setUserSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // Review modal state
  const [reviewingSubmission, setReviewingSubmission] = useState<Submission | null>(null)
  const [reviewFeedback, setReviewFeedback] = useState("")
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewStatus, setReviewStatus] = useState("")
  const [reviewTags, setReviewTags] = useState<string[]>([])

  // Media management
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [mediaTitle, setMediaTitle] = useState("")
  const [mediaDescription, setMediaDescription] = useState("")
  const [uploadingMedia, setUploadingMedia] = useState(false)

  // User editing
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editUserTier, setEditUserTier] = useState("")
  const [editUserRole, setEditUserRole] = useState("")
  const [editUserCredits, setEditUserCredits] = useState(0)
  const [editUserVerified, setEditUserVerified] = useState(false)

  // Audio player state
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // Bulk actions and selection
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState("")

  useEffect(() => {
    loadData()
  }, [submissionFilter, submissionSearch, userFilter, userSearch, currentPage])

  const loadData = async () => {
    try {
      setLoading(true)
      setError("")

      // Load stats
      const statsRes = await fetch("/api/admin/stats")
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      } else {
        console.error("Failed to load stats:", await statsRes.text())
      }

      // Load submissions
      const submissionsRes = await fetch(
        `/api/admin/submissions?status=${submissionFilter}&search=${encodeURIComponent(submissionSearch)}&page=${currentPage}&limit=10`,
      )
      if (submissionsRes.ok) {
        const submissionsData = await submissionsRes.json()
        setSubmissions(submissionsData.submissions || [])
      } else {
        console.error("Failed to load submissions:", await submissionsRes.text())
      }

      // Load users
      const usersRes = await fetch(
        `/api/admin/users?role=${userFilter}&search=${encodeURIComponent(userSearch)}&page=${currentPage}&limit=10`,
      )
      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users || [])
      } else {
        console.error("Failed to load users:", await usersRes.text())
      }

      // Load media
      const mediaRes = await fetch("/api/admin/media")
      if (mediaRes.ok) {
        const mediaData = await mediaRes.json()
        setMedia(mediaData.media || [])
      } else {
        console.error("Failed to load media:", await mediaRes.text())
      }
    } catch (err) {
      console.error("Error loading admin data:", err)
      setError("Failed to load admin data")
    } finally {
      setLoading(false)
    }
  }

  const handleReviewSubmission = async () => {
    if (!reviewingSubmission || !reviewStatus) return

    try {
      setLoading(true)
      const response = await fetch(`/api/admin/submissions/${reviewingSubmission.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: reviewStatus,
          feedback: reviewFeedback,
          rating: reviewRating || null,
          tags: reviewTags,
        }),
      })

      if (response.ok) {
        setSuccess("Review submitted successfully")
        setReviewingSubmission(null)
        setReviewFeedback("")
        setReviewRating(0)
        setReviewStatus("")
        setReviewTags([])
        loadData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to submit review")
      }
    } catch (err) {
      setError("Error submitting review")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSubmission = async (submissionId: string) => {
    if (!confirm("Are you sure you want to delete this submission? This action cannot be undone.")) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/admin/submissions/${submissionId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setSuccess("Submission deleted successfully")
        loadData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to delete submission")
      }
    } catch (err) {
      setError("Error deleting submission")
    } finally {
      setLoading(false)
    }
  }

  const handleBulkAction = async (action: string, submissionIds: string[]) => {
    if (submissionIds.length === 0) {
      setError("Please select submissions to perform bulk action")
      return
    }

    if (!confirm(`Are you sure you want to ${action} ${submissionIds.length} submission(s)?`)) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch("/api/admin/submissions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          submissionIds,
        }),
      })

      if (response.ok) {
        setSuccess(`Bulk ${action} completed successfully`)
        setSelectedSubmissions([])
        loadData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || `Failed to perform bulk ${action}`)
      }
    } catch (err) {
      setError(`Error performing bulk ${action}`)
    } finally {
      setLoading(false)
    }
  }

  const handleExportSubmissions = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/submissions/export", {
        method: "GET",
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `submissions-export-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        setSuccess("Submissions exported successfully")
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to export submissions")
      }
    } catch (err) {
      setError("Error exporting submissions")
    } finally {
      setLoading(false)
    }
  }

  const handleSyncYouTube = async () => {
    if (!youtubeUrl || !mediaTitle) {
      setError("YouTube URL and title are required")
      return
    }

    try {
      setUploadingMedia(true)
      const response = await fetch("/api/admin/media/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtube_url: youtubeUrl,
          title: mediaTitle,
          description: mediaDescription,
        }),
      })

      if (response.ok) {
        setSuccess("YouTube video synced successfully")
        setYoutubeUrl("")
        setMediaTitle("")
        setMediaDescription("")
        loadData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to sync YouTube video")
      }
    } catch (err) {
      setError("Error syncing YouTube video")
    } finally {
      setUploadingMedia(false)
    }
  }

  const handleEditUser = async () => {
    if (!editingUser) return

    try {
      setLoading(true)
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: editUserTier,
          role: editUserRole,
          submission_credits: editUserCredits,
          is_verified: editUserVerified,
        }),
      })

      if (response.ok) {
        setSuccess("User updated successfully")
        setEditingUser(null)
        loadData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to update user")
      }
    } catch (err) {
      setError("Error updating user")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setSuccess("User deleted successfully")
        loadData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to delete user")
      }
    } catch (err) {
      setError("Error deleting user")
    } finally {
      setLoading(false)
    }
  }

  const handlePlayAudio = (url: string, submissionId: string) => {
    if (currentlyPlaying === submissionId && isPlaying) {
      setIsPlaying(false)
      setCurrentlyPlaying(null)
    } else {
      setCurrentlyPlaying(submissionId)
      setIsPlaying(true)
      // In a real implementation, you would integrate with an audio player
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-500",
      in_review: "bg-blue-500",
      approved: "bg-green-500",
      rejected: "bg-red-500",
    }
    return (
      <Badge className={`${variants[status as keyof typeof variants]} text-white`}>{status.replace("_", " ")}</Badge>
    )
  }

  const getTierBadge = (tier: string) => {
    const variants = {
      creator: "bg-gray-500",
      indie: "bg-blue-500",
      pro: "bg-gradient-to-r from-purple-500 to-pink-500",
    }
    return <Badge className={`${variants[tier as keyof typeof variants]} text-white`}>{tier.toUpperCase()}</Badge>
  }

  const getRoleBadge = (role: string) => {
    const variants = {
      user: "bg-gray-500",
      admin: "bg-orange-500",
      master_dev: "bg-red-500",
    }
    return (
      <Badge className={`${variants[role as keyof typeof variants]} text-white`}>
        {role === "master_dev" ? "MASTER DEV" : role.toUpperCase()}
      </Badge>
    )
  }

  const clearMessages = () => {
    setError("")
    setSuccess("")
  }

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mr-3" />
            <span className="text-xl">Loading Admin Portal...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Portal</h1>
              <p className="text-gray-400">
                Welcome back, {user.name} • {user.role === "master_dev" ? "Master Developer" : "Administrator"}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push("/dashboard")}
                variant="outline"
                className="border-gray-600 text-white"
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button onClick={loadData} className="bg-blue-600 hover:bg-blue-700">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert className="bg-red-900/50 border-red-700 mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-200 flex items-center justify-between">
              {error}
              <Button onClick={clearMessages} variant="ghost" size="sm" className="text-red-200 hover:text-red-100">
                ×
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-900/50 border-green-700 mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-200 flex items-center justify-between">
              {success}
              <Button onClick={clearMessages} variant="ghost" size="sm" className="text-green-200 hover:text-green-100">
                ×
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Dashboard */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Submissions</CardTitle>
                <Music className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.submissions?.total || 0}</div>
                <div className="flex items-center space-x-2 text-xs text-gray-400 mt-2">
                  <span className="text-yellow-400">{stats.submissions?.pending || 0} pending</span>
                  <span>•</span>
                  <span className="text-green-400">{stats.submissions?.approved || 0} approved</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Users</CardTitle>
                <Users className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.users?.total || 0}</div>
                <div className="flex items-center space-x-2 text-xs text-gray-400 mt-2">
                  <span className="text-blue-400">{(stats.users?.indie || 0) + (stats.users?.pro || 0)} paid</span>
                  <span>•</span>
                  <span className="text-gray-400">{stats.users?.creator || 0} free</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Recent Activity</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.activity?.recentSubmissions || 0}</div>
                <div className="text-xs text-gray-400 mt-2">Submissions (30 days)</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Review Queue</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {(stats.submissions?.pending || 0) + (stats.submissions?.in_review || 0)}
                </div>
                <div className="text-xs text-gray-400 mt-2">Awaiting review</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="submissions" className="space-y-6">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="submissions" className="data-[state=active]:bg-gray-700">
              <Music className="h-4 w-4 mr-2" />
              Submissions
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-gray-700">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="media" className="data-[state=active]:bg-gray-700">
              <Youtube className="h-4 w-4 mr-2" />
              Media
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gray-700">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            {user.role === "master_dev" && (
              <TabsTrigger value="system" className="data-[state=active]:bg-gray-700">
                <Shield className="h-4 w-4 mr-2" />
                System
              </TabsTrigger>
            )}
          </TabsList>

          {/* Submissions Tab */}
          <TabsContent value="submissions" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Submission Management</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search submissions..."
                    value={submissionSearch}
                    onChange={(e) => setSubmissionSearch(e.target.value)}
                    className="w-64 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <Select value={submissionFilter} onValueChange={setSubmissionFilter}>
                  <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleExportSubmissions} variant="outline" className="border-gray-600 bg-transparent">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedSubmissions.length > 0 && (
              <Card className="bg-blue-900/20 border-blue-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200">{selectedSubmissions.length} submission(s) selected</span>
                    <div className="flex items-center space-x-2">
                      <Select value={bulkAction} onValueChange={setBulkAction}>
                        <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
                          <SelectValue placeholder="Bulk Action" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="approve">Approve All</SelectItem>
                          <SelectItem value="reject">Reject All</SelectItem>
                          <SelectItem value="pending">Mark Pending</SelectItem>
                          <SelectItem value="in_review">Mark In Review</SelectItem>
                          <SelectItem value="delete">Delete All</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => handleBulkAction(bulkAction, selectedSubmissions)}
                        disabled={!bulkAction}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Apply
                      </Button>
                      <Button onClick={() => setSelectedSubmissions([])} variant="outline" className="border-gray-600">
                        Clear
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4">
              {submissions.length === 0 ? (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6 text-center">
                    <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No submissions found</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {submissionFilter !== "all" || submissionSearch
                        ? "Try adjusting your filters"
                        : "Submissions will appear here when users start uploading"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                submissions.map((submission) => (
                  <Card key={submission.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <input
                          type="checkbox"
                          checked={selectedSubmissions.includes(submission.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSubmissions([...selectedSubmissions, submission.id])
                            } else {
                              setSelectedSubmissions(selectedSubmissions.filter((id) => id !== submission.id))
                            }
                          }}
                          className="mt-1 rounded border-gray-600 bg-gray-700"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-3">
                            <h3 className="text-lg font-semibold text-white">{submission.tracks.title}</h3>
                            {getStatusBadge(submission.status)}
                            <Badge className="bg-gray-600 text-white text-xs">ID: {submission.id.slice(0, 8)}</Badge>
                          </div>
                          <div className="text-gray-400 space-y-1">
                            <p className="flex items-center">
                              <Headphones className="h-4 w-4 mr-2" />
                              Artist: {submission.tracks.artist}
                            </p>
                            <p className="flex items-center">
                              <Mail className="h-4 w-4 mr-2" />
                              Submitted by: {submission.users.name} ({submission.users.email})
                            </p>
                            <p className="flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              Duration: {formatDuration(submission.tracks.duration)}
                            </p>
                            <p className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              Submitted: {formatRelativeTime(submission.created_at)}
                            </p>
                            {submission.updated_at !== submission.created_at && (
                              <p className="flex items-center">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Last updated: {formatRelativeTime(submission.updated_at)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-2">
                            <Button
                              onClick={() => handlePlayAudio(submission.tracks.file_url, submission.id)}
                              variant="outline"
                              size="sm"
                              className="border-gray-600 bg-transparent"
                            >
                              {currentlyPlaying === submission.id && isPlaying ? (
                                <Pause className="h-4 w-4 mr-1" />
                              ) : (
                                <Play className="h-4 w-4 mr-1" />
                              )}
                              {currentlyPlaying === submission.id && isPlaying ? "Pause" : "Play"}
                            </Button>
                            <Button
                              onClick={() => window.open(submission.tracks.file_url, "_blank")}
                              variant="outline"
                              size="sm"
                              className="border-gray-600 bg-transparent"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              onClick={() => {
                                setReviewingSubmission(submission)
                                setReviewStatus(submission.status)
                              }}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                            <Button
                              onClick={() => handleDeleteSubmission(submission.id)}
                              variant="destructive"
                              size="sm"
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {Math.min((currentPage - 1) * 10 + 1, submissions.length)} to{" "}
                {Math.min(currentPage * 10, submissions.length)} of {submissions.length} submissions
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                  className="border-gray-600"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-400">Page {currentPage}</span>
                <Button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={submissions.length < 10}
                  variant="outline"
                  size="sm"
                  className="border-gray-600"
                >
                  Next
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">User Management</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-64 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="user">Users</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                    <SelectItem value="master_dev">Master Devs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4">
              {users.length === 0 ? (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6 text-center">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No users found</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {userFilter !== "all" || userSearch
                        ? "Try adjusting your filters"
                        : "Users will appear here when they sign up"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                users.map((userData) => (
                  <Card key={userData.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-3">
                            <h3 className="text-lg font-semibold text-white">{userData.name}</h3>
                            {getTierBadge(userData.tier)}
                            {getRoleBadge(userData.role)}
                            {userData.is_verified ? (
                              <Badge className="bg-green-500 text-white">
                                <UserCheck className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-500 text-white">
                                <UserX className="h-3 w-3 mr-1" />
                                Unverified
                              </Badge>
                            )}
                          </div>
                          <div className="text-gray-400 space-y-1">
                            <p className="flex items-center">
                              <Mail className="h-4 w-4 mr-2" />
                              Email: {userData.email}
                            </p>
                            <p className="flex items-center">
                              <CreditCard className="h-4 w-4 mr-2" />
                              Credits:{" "}
                              {userData.submission_credits === 999999 ? "Unlimited" : userData.submission_credits}
                            </p>
                            <p className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              Joined: {formatRelativeTime(userData.created_at)}
                            </p>
                            <p className="flex items-center">
                              <Activity className="h-4 w-4 mr-2" />
                              Last updated: {formatRelativeTime(userData.updated_at)}
                            </p>
                          </div>
                        </div>
                        {user.role === "master_dev" && (
                          <div className="flex items-center space-x-2">
                            <Button
                              onClick={() => {
                                setEditingUser(userData)
                                setEditUserTier(userData.tier)
                                setEditUserRole(userData.role)
                                setEditUserCredits(userData.submission_credits)
                                setEditUserVerified(userData.is_verified)
                              }}
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            {userData.role !== "master_dev" && (
                              <Button
                                onClick={() => handleDeleteUser(userData.id)}
                                variant="destructive"
                                className="bg-red-600 hover:bg-red-700"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Youtube className="h-5 w-5 mr-2 text-red-500" />
                    Sync YouTube Video
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Add YouTube videos to the platform media library
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white">YouTube URL</Label>
                    <Input
                      placeholder="https://youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Title</Label>
                    <Input
                      placeholder="Video title"
                      value={mediaTitle}
                      onChange={(e) => setMediaTitle(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Description</Label>
                    <Textarea
                      placeholder="Video description"
                      value={mediaDescription}
                      onChange={(e) => setMediaDescription(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white min-h-32"
                    />
                  </div>
                  <Button
                    onClick={handleSyncYouTube}
                    className="w-full bg-red-600 hover:bg-red-700"
                    disabled={uploadingMedia}
                  >
                    {uploadingMedia ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <Youtube className="h-4 w-4 mr-2" />
                        Sync YouTube Video
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="h-5 w-5 mr-2 text-blue-500" />
                    Upload Custom Media
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Upload custom audio, video, or image files
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 mb-2">Drag and drop files here</p>
                    <p className="text-sm text-gray-500">or click to browse</p>
                    <Button variant="outline" className="mt-4 border-gray-600 bg-transparent">
                      Choose Files
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Media Library */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Media Library</CardTitle>
                <CardDescription className="text-gray-400">Manage uploaded media files</CardDescription>
              </CardHeader>
              <CardContent>
                {media.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No media files found</p>
                    <p className="text-sm text-gray-500 mt-2">Upload or sync media to get started</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {media.map((item) => (
                      <Card key={item.id} className="bg-gray-700 border-gray-600">
                        <CardContent className="p-4">
                          <div className="aspect-video bg-gray-600 rounded-lg mb-3 flex items-center justify-center">
                            {item.media_type === "youtube" ? (
                              <Youtube className="h-8 w-8 text-red-500" />
                            ) : (
                              <FileText className="h-8 w-8 text-gray-400" />
                            )}
                          </div>
                          <h4 className="font-semibold text-white truncate">{item.title}</h4>
                          <p className="text-sm text-gray-400 mt-1 line-clamp-2">{item.description}</p>
                          <div className="flex items-center justify-between mt-3">
                            <Badge className="bg-blue-500 text-white text-xs">{item.media_type.toUpperCase()}</Badge>
                            <div className="flex space-x-1">
                              <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-gray-400 hover:text-red-400">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
                    Submission Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">Analytics coming soon</p>
                    <p className="text-sm text-gray-500 mt-2">Detailed charts and insights will be available here</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                    User Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">Growth metrics coming soon</p>
                    <p className="text-sm text-gray-500 mt-2">User registration and engagement data</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-purple-500" />
                    Platform Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">Activity metrics coming soon</p>
                    <p className="text-sm text-gray-500 mt-2">Real-time platform usage statistics</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Tab (Master Dev Only) */}
          {user.role === "master_dev" && (
            <TabsContent value="system" className="space-y-6">
              <Card className="bg-gradient-to-r from-red-900/50 to-purple-900/50 border-red-500/50">
                <CardHeader>
                  <CardTitle className="flex items-center text-red-400">
                    <Shield className="h-5 w-5 mr-2" />
                    Master Developer System Console
                  </CardTitle>
                  <CardDescription className="text-red-300">
                    Advanced system controls and database management
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">System Controls</h3>
                      <div className="space-y-2">
                        <Button
                          onClick={() => router.push("/admin/settings")}
                          className="w-full bg-orange-600 hover:bg-orange-700"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          System Settings
                        </Button>
                        <Button
                          onClick={async () => {
                            setLoading(true)
                            try {
                              await fetch("/api/admin/system/clear-cache", { method: "POST" })
                              setSuccess("All caches cleared successfully")
                            } catch (err) {
                              setError("Failed to clear caches")
                            } finally {
                              setLoading(false)
                            }
                          }}
                          className="w-full bg-purple-600 hover:bg-purple-700"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Clear All Caches
                        </Button>
                        <Button
                          onClick={() => router.push("/admin/database")}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          <Database className="h-4 w-4 mr-2" />
                          Database Tools
                        </Button>
                        <Button
                          onClick={() => router.push("/admin/server-status")}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <Server className="h-4 w-4 mr-2" />
                          Server Status
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">Emergency Controls</h3>
                      <div className="space-y-2">
                        <Button
                          onClick={() => router.push("/admin/performance")}
                          className="w-full bg-yellow-600 hover:bg-yellow-700"
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Performance Monitor
                        </Button>
                        <Button
                          onClick={async () => {
                            setLoading(true)
                            try {
                              const response = await fetch("/api/admin/system/export-data")
                              const blob = await response.blob()
                              const url = window.URL.createObjectURL(blob)
                              const a = document.createElement("a")
                              a.href = url
                              a.download = `system-export-${new Date().toISOString().split("T")[0]}.zip`
                              document.body.appendChild(a)
                              a.click()
                              window.URL.revokeObjectURL(url)
                              document.body.removeChild(a)
                              setSuccess("System data exported successfully")
                            } catch (err) {
                              setError("Failed to export system data")
                            } finally {
                              setLoading(false)
                            }
                          }}
                          className="w-full bg-indigo-600 hover:bg-indigo-700"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export Data
                        </Button>
                        <Button
                          onClick={() => {
                            if (
                              confirm(
                                "Are you sure you want to perform an emergency reset? This will restart all services.",
                              )
                            ) {
                              setLoading(true)
                              fetch("/api/admin/system/emergency-reset", { method: "POST" })
                                .then(() => setSuccess("Emergency reset initiated"))
                                .catch(() => setError("Failed to initiate emergency reset"))
                                .finally(() => setLoading(false))
                            }
                          }}
                          className="w-full bg-red-600 hover:bg-red-700"
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Emergency Reset
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Alert className="bg-yellow-900/50 border-yellow-700">
                    <Crown className="h-4 w-4" />
                    <AlertDescription className="text-yellow-200">
                      <strong>Master Developer Access:</strong> You have unrestricted access to all system functions.
                      Use these controls responsibly as they can affect the entire platform.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Review Modal */}
        {reviewingSubmission && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="bg-gray-800 border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="text-white">Review: {reviewingSubmission.tracks.title}</CardTitle>
                <CardDescription className="text-gray-400">
                  by {reviewingSubmission.tracks.artist} • Submitted by {reviewingSubmission.users.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-white">Review Status</Label>
                  <Select value={reviewStatus} onValueChange={setReviewStatus}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_review">In Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white">Rating (1-5)</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className={`${
                          star <= reviewRating ? "text-yellow-400" : "text-gray-600"
                        } hover:text-yellow-400 transition-colors`}
                      >
                        <Star className="h-6 w-6 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-white">Feedback</Label>
                  <Textarea
                    placeholder="Provide detailed feedback..."
                    value={reviewFeedback}
                    onChange={(e) => setReviewFeedback(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white min-h-32"
                  />
                </div>
                <div>
                  <Label className="text-white">Tags (comma separated)</Label>
                  <Input
                    placeholder="e.g., catchy, needs mixing, great vocals"
                    value={reviewTags.join(", ")}
                    onChange={(e) =>
                      setReviewTags(
                        e.target.value
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter(Boolean),
                      )
                    }
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setReviewingSubmission(null)
                      setReviewFeedback("")
                      setReviewRating(0)
                      setReviewStatus("")
                      setReviewTags([])
                    }}
                    className="border-gray-600"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReviewSubmission}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!reviewStatus}
                  >
                    Submit Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="bg-gray-800 border-gray-700 w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-white">Edit User: {editingUser.name}</CardTitle>
                <CardDescription className="text-gray-400">{editingUser.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-white">Tier</Label>
                  <Select value={editUserTier} onValueChange={setEditUserTier}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="creator">Creator</SelectItem>
                      <SelectItem value="indie">Indie</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white">Role</Label>
                  <Select value={editUserRole} onValueChange={setEditUserRole}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="master_dev">Master Dev</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white">Submission Credits</Label>
                  <Input
                    type="number"
                    value={editUserCredits}
                    onChange={(e) => setEditUserCredits(Number.parseInt(e.target.value) || 0)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="verified"
                    checked={editUserVerified}
                    onChange={(e) => setEditUserVerified(e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700"
                  />
                  <Label htmlFor="verified" className="text-white">
                    Verified Account
                  </Label>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setEditingUser(null)} className="border-gray-600">
                    Cancel
                  </Button>
                  <Button onClick={handleEditUser} className="bg-purple-600 hover:bg-purple-700">
                    Update User
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
