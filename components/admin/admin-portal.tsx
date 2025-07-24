"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TierManagementPanel } from "@/components/admin/tier-management-panel"
import { EnhancedAudioPlayer } from "@/components/player/enhanced-audio-player"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  Users,
  FileText,
  BarChart3,
  Settings,
  RefreshCw,
  Edit,
  Shield,
  Crown,
  Play,
  Star,
  Clock,
  ChevronUp,
  ChevronDown,
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
  file_path?: string
  audio_url?: string
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
  submissions: { total: number; pending: number; approved: number; rejected: number; in_review: number }
  users: { total: number; creator: number; indie: number; pro: number; admins: number }
  activity: { recentSubmissions: number; recentUsers: number }
}

export function AdminPortal() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("submissions")

  // User management states
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [userFilter, setUserFilter] = useState("all")
  const [tierFilter, setTierFilter] = useState("all")
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<AdminUser | null>(null)
  const [showTierPanel, setShowTierPanel] = useState(false)

  // Submission management states
  const [rankedFilter, setRankedFilter] = useState("unranked")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [playingSubmission, setPlayingSubmission] = useState<Submission | null>(null)
  const [reviewingSubmission, setReviewingSubmission] = useState<Submission | null>(null)
  const [reviewData, setReviewData] = useState({ rating: 0, feedback: "", status: "pending" })
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "created_at",
    direction: "desc",
  })

  useEffect(() => {
    if (activeTab === "submissions") {
      fetchSubmissions(currentPage)
    }
  }, [activeTab, rankedFilter, statusFilter, currentPage, user])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchSubmissions = async (page = 1) => {
    setLoading(true)
    try {
      const rankedFilterQuery = rankedFilter === "my_ranked" && user ? `my_ranked&userId=${user.id}` : rankedFilter
      const res = await fetch(
        `/api/admin/submissions?rankedFilter=${rankedFilterQuery}&statusFilter=${statusFilter}&page=${page}&limit=10`,
      )
      if (!res.ok) throw new Error("Failed to fetch submissions")
      const data = await res.json()
      setSubmissions(data.submissions || [])
      setTotalPages(data.pagination.totalPages || 1)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [usersRes, statsRes] = await Promise.all([fetch("/api/admin/users"), fetch("/api/admin/stats")])
      if (usersRes.ok) setUsers((await usersRes.json()).users || [])
      if (statsRes.ok) setStats(await statsRes.json())
      await fetchSubmissions(1)
    } catch (error) {
      setError("Failed to load admin data.")
    } finally {
      setLoading(false)
    }
  }

  const handleReviewSubmit = async () => {
    if (!reviewingSubmission) return
    try {
      const response = await fetch(`/api/admin/submissions/${reviewingSubmission.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: reviewData.rating,
          feedback: reviewData.feedback,
          status: reviewData.status,
          reviewer_id: user?.id,
        }),
      })
      if (!response.ok) throw new Error("Failed to submit review")
      toast({ title: "Success", description: "Review submitted successfully." })
      setReviewingSubmission(null)
      fetchSubmissions(currentPage)
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" })
    }
  }

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const sortedSubmissions = useMemo(() => {
    const sortableItems = [...submissions]
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const valA = sortConfig.key.includes(".")
          ? sortConfig.key.split(".").reduce((o, i) => (o as any)?.[i], a)
          : a[sortConfig.key as keyof Submission]
        const valB = sortConfig.key.includes(".")
          ? sortConfig.key.split(".").reduce((o, i) => (o as any)?.[i], b)
          : b[sortConfig.key as keyof Submission]

        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1
        return 0
      })
    }
    return sortableItems
  }, [submissions, sortConfig])

  const StarRating = ({
    rating,
    setRating,
    readOnly = false,
  }: { rating: number; setRating?: (r: number) => void; readOnly?: boolean }) => (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${readOnly ? "" : "cursor-pointer"} h-5 w-5 ${
            rating >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-600"
          }`}
          onClick={() => !readOnly && setRating?.(star)}
        />
      ))}
    </div>
  )

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "pro":
        return "bg-purple-500/20 text-purple-400"
      case "indie":
        return "bg-green-500/20 text-green-400"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  if (loading && !submissions.length) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <Button onClick={() => fetchData()} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>

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
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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

          <TabsContent value="submissions">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Submission Management</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Select value={rankedFilter} onValueChange={setRankedFilter}>
                      <SelectTrigger className="w-36 bg-gray-700 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="unranked">Unranked</SelectItem>
                        <SelectItem value="ranked">Ranked</SelectItem>
                        <SelectItem value="my_ranked">My Ranked</SelectItem>
                        <SelectItem value="all">All</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-36 bg-gray-700 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="all">All Statuses</SelectItem>
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
                        {[
                          { key: "track_title", label: "Track" },
                          { key: "users.username", label: "User" },
                          { key: "users.tier", label: "Tier" },
                          { key: "created_at", label: "Submitted" },
                          { key: "status", label: "Status" },
                          { key: "admin_rating", label: "Rating" },
                        ].map((h) => (
                          <th
                            key={h.key}
                            className="text-left p-3 text-gray-300 cursor-pointer"
                            onClick={() => requestSort(h.key)}
                          >
                            <div className="flex items-center">
                              {h.label}
                              {sortConfig?.key === h.key &&
                                (sortConfig.direction === "asc" ? (
                                  <ChevronUp className="h-4 w-4 ml-1" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 ml-1" />
                                ))}
                            </div>
                          </th>
                        ))}
                        <th className="text-left p-3 text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedSubmissions.map((s) => (
                        <tr key={s.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                          <td className="p-3 font-medium text-white">{s.track_title}</td>
                          <td className="p-3 text-gray-300">{s.users?.username}</td>
                          <td className="p-3">
                            <Badge className={getTierBadge(s.users?.tier || "creator")}>{s.users?.tier}</Badge>
                          </td>
                          <td className="p-3 text-gray-400">{new Date(s.created_at).toLocaleDateString()}</td>
                          <td className="p-3">
                            <Badge
                              variant={
                                s.status === "approved"
                                  ? "default"
                                  : s.status === "rejected"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {s.status}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <StarRating rating={s.admin_rating || 0} readOnly />
                          </td>
                          <td className="p-3">
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-gray-400 hover:text-white"
                                onClick={() => setPlayingSubmission(s)}
                                disabled={!s.audio_url}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-gray-400 hover:text-white"
                                onClick={() => {
                                  setReviewingSubmission(s)
                                  setReviewData({
                                    rating: s.admin_rating || 0,
                                    feedback: s.admin_feedback || "",
                                    status: s.status,
                                  })
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-400">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">{/* User table can be added here */}</TabsContent>
          <TabsContent value="analytics">{/* Analytics components can be added here */}</TabsContent>
          <TabsContent value="system">{/* System components can be added here */}</TabsContent>
        </Tabs>

        <Dialog open={!!playingSubmission} onOpenChange={() => setPlayingSubmission(null)}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>{playingSubmission?.track_title}</DialogTitle>
              <DialogDescription>{playingSubmission?.artist_name}</DialogDescription>
            </DialogHeader>
            {playingSubmission?.audio_url && (
              <EnhancedAudioPlayer
                src={playingSubmission.audio_url}
                title={playingSubmission.track_title}
                artist={playingSubmission.artist_name}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!reviewingSubmission} onOpenChange={() => setReviewingSubmission(null)}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>Review: {reviewingSubmission?.track_title}</DialogTitle>
              <DialogDescription>by {reviewingSubmission?.artist_name}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="rating">Rating (1-5 Stars)</Label>
                <StarRating rating={reviewData.rating} setRating={(r) => setReviewData((d) => ({ ...d, rating: r }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={reviewData.status}
                  onValueChange={(s) => setReviewData((d) => ({ ...d, status: s as any }))}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback / Notes</Label>
                <Textarea
                  id="feedback"
                  value={reviewData.feedback}
                  onChange={(e) => setReviewData((d) => ({ ...d, feedback: e.target.value }))}
                  className="bg-gray-700 border-gray-600"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewingSubmission(null)}>
                Cancel
              </Button>
              <Button onClick={handleReviewSubmit} className="bg-blue-600 hover:bg-blue-700">
                Submit Review
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {selectedUserForEdit && (
          <TierManagementPanel
            user={selectedUserForEdit}
            isOpen={showTierPanel}
            onClose={() => {
              setShowTierPanel(false)
              setSelectedUserForEdit(null)
            }}
            onUpdate={() => {
              setShowTierPanel(false)
              setSelectedUserForEdit(null)
              fetchData()
            }}
          />
        )}
      </div>
    </div>
  )
}
