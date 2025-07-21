"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Play,
  Pause,
  Download,
  Star,
  Search,
  Users,
  Music,
  CheckCircle,
  Clock,
  Shield,
  Youtube,
  Plus,
  Trash2,
  Eye,
  Crown,
  Settings,
  TrendingUp,
  Award,
  Upload,
} from "lucide-react"
import type { User } from "@/lib/supabase/auth"

interface AdminPortalProps {
  user: User
}

interface Submission {
  id: string
  title: string
  artist: string
  email: string
  tier: string
  submittedAt: string
  status: "pending" | "reviewing" | "approved" | "rejected"
  rating?: number
  reviewedBy?: string
  notes?: string
  mood?: string
  playUrl?: string
}

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  grantedAt: string
  grantedBy: string
}

export function AdminPortal({ user }: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [filter, setFilter] = useState<"all" | "ranked" | "unranked" | "my-ranked">("unranked")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [isPlaying, setIsPlaying] = useState<string | null>(null)
  const [newAdminEmail, setNewAdminEmail] = useState("")
  const [newAdminRole, setNewAdminRole] = useState("admin")
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  // Mock data - replace with actual API calls
  useEffect(() => {
    // Mock submissions data
    setSubmissions([
      {
        id: "1",
        title: "Summer Vibes",
        artist: "DJ Producer",
        email: "producer@example.com",
        tier: "pro",
        submittedAt: "2024-01-20T10:30:00Z",
        status: "pending",
        playUrl: "/placeholder-audio.mp3",
      },
      {
        id: "2",
        title: "Night Drive",
        artist: "Beat Maker",
        email: "beats@example.com",
        tier: "creator",
        submittedAt: "2024-01-19T15:45:00Z",
        status: "approved",
        rating: 4,
        reviewedBy: user.email,
        notes: "Great production quality",
        mood: "chill",
      },
      {
        id: "3",
        title: "Energy Boost",
        artist: "Electronic Artist",
        email: "electronic@example.com",
        tier: "free",
        submittedAt: "2024-01-18T09:15:00Z",
        status: "reviewing",
        rating: 3,
        reviewedBy: "admin@example.com",
        mood: "energetic",
      },
    ])

    // Mock admin users data
    setAdmins([
      {
        id: "1",
        name: "Darion Harris",
        email: "2668harris@gmail.com",
        role: "master_dev",
        grantedAt: "2024-01-01T00:00:00Z",
        grantedBy: "System",
      },
      {
        id: "2",
        name: "IPXS Dev",
        email: "ipxsdev@gmail.com",
        role: "master_dev",
        grantedAt: "2024-01-01T00:00:00Z",
        grantedBy: "System",
      },
    ])
  }, [user.email])

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      submission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.email.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false

    switch (filter) {
      case "ranked":
        return submission.rating !== undefined
      case "unranked":
        return submission.rating === undefined
      case "my-ranked":
        return submission.reviewedBy === user.email
      default:
        return true
    }
  })

  const handlePlayPause = (submissionId: string) => {
    if (isPlaying === submissionId) {
      setIsPlaying(null)
    } else {
      setIsPlaying(submissionId)
    }
  }

  const handleReview = (submission: Submission) => {
    setSelectedSubmission(submission)
  }

  const handleSaveReview = async () => {
    if (!selectedSubmission) return

    setLoading(true)
    // Here you would save the review to your backend
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Mock API call

    setSubmissions((prev) => prev.map((sub) => (sub.id === selectedSubmission.id ? selectedSubmission : sub)))

    setSelectedSubmission(null)
    setLoading(false)
    setMessage("Review saved successfully!")
    setTimeout(() => setMessage(""), 3000)
  }

  const handleGrantAdmin = async () => {
    if (!newAdminEmail || !newAdminRole) return

    setLoading(true)
    // Here you would grant admin privileges via your backend
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Mock API call

    const newAdmin: AdminUser = {
      id: Date.now().toString(),
      name: newAdminEmail.split("@")[0],
      email: newAdminEmail,
      role: newAdminRole,
      grantedAt: new Date().toISOString(),
      grantedBy: user.email,
    }

    setAdmins((prev) => [...prev, newAdmin])
    setNewAdminEmail("")
    setNewAdminRole("admin")
    setLoading(false)
    setMessage("Admin privileges granted successfully!")
    setTimeout(() => setMessage(""), 3000)
  }

  const handleRevokeAdmin = async (adminId: string, adminEmail: string) => {
    // Protect Master Dev accounts
    if (adminEmail === "2668harris@gmail.com" || adminEmail === "ipxsdev@gmail.com") {
      setMessage("Cannot revoke Master Developer privileges!")
      setTimeout(() => setMessage(""), 3000)
      return
    }

    setLoading(true)
    // Here you would revoke admin privileges via your backend
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Mock API call

    setAdmins((prev) => prev.filter((admin) => admin.id !== adminId))
    setLoading(false)
    setMessage("Admin privileges revoked successfully!")
    setTimeout(() => setMessage(""), 3000)
  }

  const handleMediaUpdate = async () => {
    setLoading(true)
    // Here you would sync with YouTube API
    await new Promise((resolve) => setTimeout(resolve, 2000)) // Mock API call
    setLoading(false)
    setMessage("Media updated successfully!")
    setTimeout(() => setMessage(""), 3000)
  }

  const handleManualVideoAdd = async () => {
    if (!youtubeUrl) return

    setLoading(true)
    // Here you would add the video manually
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Mock API call
    setYoutubeUrl("")
    setLoading(false)
    setMessage("Video added successfully!")
    setTimeout(() => setMessage(""), 3000)
  }

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case "pro":
        return "bg-gradient-to-r from-purple-500 to-pink-500"
      case "creator":
        return "bg-gradient-to-r from-blue-500 to-cyan-500"
      case "free":
        return "bg-gradient-to-r from-gray-500 to-gray-600"
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600"
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-gradient-to-r from-green-500 to-emerald-500"
      case "rejected":
        return "bg-gradient-to-r from-red-500 to-rose-500"
      case "reviewing":
        return "bg-gradient-to-r from-yellow-500 to-orange-500"
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600"
    }
  }

  const stats = {
    totalSubmissions: submissions.length,
    pendingReviews: submissions.filter((s) => s.status === "pending").length,
    approvedTracks: submissions.filter((s) => s.status === "approved").length,
    activeAdmins: admins.length,
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Master Developer Quick Actions Panel */}
      {user.role === "master_dev" && (
        <div className="border-2 border-yellow-600/50 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 backdrop-blur-sm mx-4 mt-4 rounded-xl">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <Crown className="h-6 w-6 text-yellow-400 mr-3" />
              <h2 className="text-xl font-bold text-yellow-400">Master Developer Quick Actions</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => setActiveTab("admin-portal")}
                className="h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Shield className="h-5 w-5 mr-3" />
                Admin Portal
              </Button>
              <Button
                onClick={() => setActiveTab("dev-tools")}
                className="h-14 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-semibold rounded-xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Crown className="h-5 w-5 mr-3" />
                Dev Tools
              </Button>
              <Button
                onClick={() => setActiveTab("master-settings")}
                className="h-14 bg-gradient-to-r from-gray-100 to-white hover:from-gray-200 hover:to-gray-100 text-gray-900 font-semibold rounded-xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Settings className="h-5 w-5 mr-3 text-yellow-600" />
                Master Settings
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60 mt-4">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Admin Portal
              </h1>
              <p className="text-gray-400 mt-2">
                Welcome back, {user.name} • {user.role === "master_dev" ? "Master Developer" : "Admin"}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg border border-blue-500/30">
                <Shield className="h-5 w-5 text-blue-400" />
                <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
                  {user.role === "master_dev" ? "Master Dev" : "Admin"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div className="container mx-auto px-4 pt-4">
          <Alert className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-green-500/50 backdrop-blur-sm">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-200">{message}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl">
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="submissions"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg"
            >
              <Music className="h-4 w-4 mr-2" />
              Submissions
            </TabsTrigger>
            <TabsTrigger
              value="media"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg"
            >
              <Youtube className="h-4 w-4 mr-2" />
              Media
            </TabsTrigger>
            {user.role === "master_dev" && (
              <TabsTrigger
                value="privileges"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg"
              >
                <Shield className="h-4 w-4 mr-2" />
                Privileges
              </TabsTrigger>
            )}
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700/50 backdrop-blur-sm hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-200">Total Submissions</CardTitle>
                  <div className="p-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg">
                    <Music className="h-4 w-4 text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.totalSubmissions}</div>
                  <p className="text-xs text-gray-400">All time submissions</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700/50 backdrop-blur-sm hover:shadow-lg hover:shadow-yellow-500/10 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-200">Pending Reviews</CardTitle>
                  <div className="p-2 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-lg">
                    <Clock className="h-4 w-4 text-yellow-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.pendingReviews}</div>
                  <p className="text-xs text-gray-400">Awaiting review</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700/50 backdrop-blur-sm hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-200">Approved Tracks</CardTitle>
                  <div className="p-2 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.approvedTracks}</div>
                  <p className="text-xs text-gray-400">Successfully approved</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700/50 backdrop-blur-sm hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-200">Active Admins</CardTitle>
                  <div className="p-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg">
                    <Users className="h-4 w-4 text-purple-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.activeAdmins}</div>
                  <p className="text-xs text-gray-400">Admin users</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Award className="h-5 w-5 mr-2 text-yellow-400" />
                  Recent Activity
                </CardTitle>
                <CardDescription className="text-gray-400">Latest submissions and reviews</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {submissions.slice(0, 5).map((submission) => (
                    <div
                      key={submission.id}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-700/30 to-gray-800/30 rounded-xl border border-gray-600/30 hover:border-gray-500/50 transition-all duration-300"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                          <Music className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{submission.title}</p>
                          <p className="text-sm text-gray-400">by {submission.artist}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={getTierBadgeColor(submission.tier) + " text-white border-0"}>
                          {submission.tier}
                        </Badge>
                        <Badge className={getStatusBadgeColor(submission.status) + " text-white border-0"}>
                          {submission.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Submissions Tab */}
          <TabsContent value="submissions" className="space-y-6">
            {/* Filters and Search */}
            <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search submissions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-gray-700/50 border-gray-600/50 text-white backdrop-blur-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={filter === "all" ? "default" : "outline"}
                      onClick={() => setFilter("all")}
                      className={
                        filter === "all"
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0"
                          : "border-gray-600/50 hover:bg-gray-700/50 bg-transparent"
                      }
                    >
                      All
                    </Button>
                    <Button
                      variant={filter === "unranked" ? "default" : "outline"}
                      onClick={() => setFilter("unranked")}
                      className={
                        filter === "unranked"
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0"
                          : "border-gray-600/50 hover:bg-gray-700/50 bg-transparent"
                      }
                    >
                      Unranked
                    </Button>
                    <Button
                      variant={filter === "ranked" ? "default" : "outline"}
                      onClick={() => setFilter("ranked")}
                      className={
                        filter === "ranked"
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0"
                          : "border-gray-600/50 hover:bg-gray-700/50 bg-transparent"
                      }
                    >
                      Ranked
                    </Button>
                    <Button
                      variant={filter === "my-ranked" ? "default" : "outline"}
                      onClick={() => setFilter("my-ranked")}
                      className={
                        filter === "my-ranked"
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0"
                          : "border-gray-600/50 hover:bg-gray-700/50 bg-transparent"
                      }
                    >
                      My Ranked
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submissions List */}
            <div className="grid gap-4">
              {filteredSubmissions.map((submission) => (
                <Card
                  key={submission.id}
                  className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700/50 backdrop-blur-sm hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 hover:scale-[1.02]"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Album Art */}
                        <div className="relative group">
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                            <Music className="h-8 w-8 text-white" />
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute inset-0 w-16 h-16 rounded-xl bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-all duration-300"
                            onClick={() => handlePlayPause(submission.id)}
                          >
                            {isPlaying === submission.id ? (
                              <Pause className="h-6 w-6 text-white" />
                            ) : (
                              <Play className="h-6 w-6 text-white" />
                            )}
                          </Button>
                        </div>

                        {/* Track Info */}
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-lg">{submission.title}</h3>
                          <p className="text-gray-300">by {submission.artist}</p>
                          <p className="text-sm text-gray-400">{submission.email}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(submission.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Badges and Actions */}
                      <div className="flex items-center space-x-4">
                        <div className="flex flex-col items-end space-y-3">
                          <div className="flex space-x-2">
                            <Badge className={getTierBadgeColor(submission.tier) + " text-white border-0 shadow-lg"}>
                              {submission.tier}
                            </Badge>
                            <Badge
                              className={getStatusBadgeColor(submission.status) + " text-white border-0 shadow-lg"}
                            >
                              {submission.status}
                            </Badge>
                          </div>
                          {submission.rating && (
                            <div className="flex items-center space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < submission.rating! ? "text-yellow-400 fill-current" : "text-gray-600"
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col space-y-2">
                          <Button
                            size="sm"
                            onClick={() => handleReview(submission)}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 shadow-lg"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 border-0 shadow-lg"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Youtube className="h-5 w-5 mr-2 text-red-500" />
                    Auto-Sync YouTube
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Automatically sync latest episodes from the YouTube channel
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={handleMediaUpdate}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 border-0 shadow-lg"
                  >
                    {loading ? "Syncing..." : "Update Media"}
                  </Button>
                  <p className="text-sm text-gray-500">Last sync: Never</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Plus className="h-5 w-5 mr-2 text-green-500" />
                    Manual Video Add
                  </CardTitle>
                  <CardDescription className="text-gray-400">Manually add a specific YouTube video</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="youtube-url" className="text-white">
                      YouTube URL
                    </Label>
                    <Input
                      id="youtube-url"
                      placeholder="https://youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      className="bg-gray-700/50 border-gray-600/50 text-white backdrop-blur-sm"
                    />
                  </div>
                  <Button
                    onClick={handleManualVideoAdd}
                    disabled={loading || !youtubeUrl}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 border-0 shadow-lg"
                  >
                    {loading ? "Adding..." : "Add Video"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Privileges Tab (Master Dev Only) */}
          {user.role === "master_dev" && (
            <TabsContent value="privileges" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Plus className="h-5 w-5 mr-2 text-green-500" />
                      Grant Admin Privileges
                    </CardTitle>
                    <CardDescription className="text-gray-400">Add new admin users to the platform</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="admin-email" className="text-white">
                        Email Address
                      </Label>
                      <Input
                        id="admin-email"
                        type="email"
                        placeholder="user@example.com"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        className="bg-gray-700/50 border-gray-600/50 text-white backdrop-blur-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="admin-role" className="text-white">
                        Role
                      </Label>
                      <Select value={newAdminRole} onValueChange={setNewAdminRole}>
                        <SelectTrigger className="bg-gray-700/50 border-gray-600/50 text-white backdrop-blur-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600">
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="content_reviewer">Content Reviewer</SelectItem>
                          <SelectItem value="limited_admin">Limited Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={handleGrantAdmin}
                      disabled={loading || !newAdminEmail}
                      className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 border-0 shadow-lg"
                    >
                      {loading ? "Granting..." : "Grant Privileges"}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Users className="h-5 w-5 mr-2 text-blue-500" />
                      Current Admins
                    </CardTitle>
                    <CardDescription className="text-gray-400">Manage existing admin users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {admins.map((admin) => (
                        <div
                          key={admin.id}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-700/30 to-gray-800/30 rounded-xl border border-gray-600/30"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                              {admin.role === "master_dev" ? (
                                <Crown className="h-5 w-5 text-white" />
                              ) : (
                                <Shield className="h-5 w-5 text-white" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-white">{admin.name}</p>
                              <p className="text-sm text-gray-400">{admin.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge
                              className={
                                admin.role === "master_dev"
                                  ? "bg-gradient-to-r from-yellow-600 to-orange-600 text-white border-0"
                                  : "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0"
                              }
                            >
                              {admin.role === "master_dev" ? "Master Dev" : "Admin"}
                            </Badge>
                            {admin.role !== "master_dev" && (
                              <Button
                                size="sm"
                                onClick={() => handleRevokeAdmin(admin.id, admin.email)}
                                disabled={loading}
                                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 border-0 shadow-lg"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* Dev Tools Tab (Master Dev Only) */}
          {user.role === "master_dev" && (
            <TabsContent value="dev-tools" className="space-y-6">
              <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Crown className="h-5 w-5 mr-2 text-yellow-400" />
                    Developer Tools
                  </CardTitle>
                  <CardDescription className="text-gray-400">Advanced development and testing tools</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">Database Tools</h3>
                      <div className="space-y-2">
                        <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 border-0 shadow-lg">
                          <Upload className="h-4 w-4 mr-2" />
                          Seed Test Data
                        </Button>
                        <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0 shadow-lg">
                          <Settings className="h-4 w-4 mr-2" />
                          Reset Database
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">Testing Tools</h3>
                      <div className="space-y-2">
                        <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 border-0 shadow-lg">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Run Tests
                        </Button>
                        <Button className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 border-0 shadow-lg">
                          <Eye className="h-4 w-4 mr-2" />
                          View Logs
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Master Settings Tab (Master Dev Only) */}
          {user.role === "master_dev" && (
            <TabsContent value="master-settings" className="space-y-6">
              <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Settings className="h-5 w-5 mr-2 text-yellow-400" />
                    Master Settings
                  </CardTitle>
                  <CardDescription className="text-gray-400">System-wide configuration and settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400">Master settings panel coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Review Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 border-gray-700/50 backdrop-blur-sm w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-white">Review Submission</CardTitle>
              <CardDescription className="text-gray-400">
                {selectedSubmission.title} by {selectedSubmission.artist}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Rating */}
              <div>
                <Label className="text-white">Rating</Label>
                <div className="flex items-center space-x-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setSelectedSubmission({
                          ...selectedSubmission,
                          rating: star,
                        })
                      }
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= (selectedSubmission.rating || 0) ? "text-yellow-400 fill-current" : "text-gray-600"
                        }`}
                      />
                    </Button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <Label className="text-white">Status</Label>
                <Select
                  value={selectedSubmission.status}
                  onValueChange={(value) =>
                    setSelectedSubmission({
                      ...selectedSubmission,
                      status: value as any,
                    })
                  }
                >
                  <SelectTrigger className="bg-gray-700/50 border-gray-600/50 text-white backdrop-blur-sm mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Mood */}
              <div>
                <Label className="text-white">Mood/Emotion</Label>
                <Input
                  placeholder="e.g., energetic, chill, dark"
                  value={selectedSubmission.mood || ""}
                  onChange={(e) =>
                    setSelectedSubmission({
                      ...selectedSubmission,
                      mood: e.target.value,
                    })
                  }
                  className="bg-gray-700/50 border-gray-600/50 text-white backdrop-blur-sm mt-2"
                />
              </div>

              {/* Notes */}
              <div>
                <Label className="text-white">Review Notes</Label>
                <Textarea
                  placeholder="Add your review notes here..."
                  value={selectedSubmission.notes || ""}
                  onChange={(e) =>
                    setSelectedSubmission({
                      ...selectedSubmission,
                      notes: e.target.value,
                    })
                  }
                  className="bg-gray-700/50 border-gray-600/50 text-white backdrop-blur-sm mt-2"
                  rows={4}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => setSelectedSubmission(null)}
                  className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 border-0"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveReview}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 shadow-lg"
                >
                  {loading ? "Saving..." : "Save Review"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
