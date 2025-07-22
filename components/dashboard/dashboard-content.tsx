"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Upload,
  Clock,
  Trophy,
  User,
  ActivityIcon,
  Settings,
  Star,
  Zap,
  Crown,
  LogOut,
  Music,
  CheckCircle,
  TrendingUp,
  Play,
  Pause,
  Shield,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from "lucide-react"
import type { Database } from "@/lib/supabase/database.types"
import { formatRelativeTime, getTierInfo, getStatusColor, getStatusBadgeColor, formatCurrency } from "@/lib/utils"

interface DashboardContentProps {
  user: Database["public"]["Tables"]["users"]["Row"]
}

interface Submission {
  id: string
  title: string
  artist_name: string
  genre: string
  status: "pending" | "in_review" | "approved" | "rejected"
  admin_rating?: number
  admin_feedback?: string
  created_at: string
  updated_at: string
}

interface UserActivity {
  id: string
  type: "submission" | "review" | "achievement" | "upgrade"
  title: string
  description: string
  timestamp: string
  status?: string
  metadata?: any
}

interface CreditPack {
  id: string
  name: string
  credits: number
  price: number
  popular?: boolean
  savings?: string
}

const creditPacks: CreditPack[] = [
  {
    id: "silver",
    name: "Silver Pack",
    credits: 1,
    price: 4.99,
  },
  {
    id: "gold",
    name: "Gold Pack",
    credits: 2,
    price: 9.99,
    popular: true,
    savings: "Save $0.50",
  },
  {
    id: "platinum",
    name: "Platinum Pack",
    credits: 4,
    price: 17.99,
    savings: "Save $2.00",
  },
]

export function DashboardContent({ user }: DashboardContentProps) {
  const [loading, setLoading] = useState(false)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [recentActivity, setRecentActivity] = useState<UserActivity[]>([])
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showCreditPackModal, setShowCreditPackModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      setLoading(true)

      // Load submissions
      const submissionsResponse = await fetch("/api/user/submissions")
      if (submissionsResponse.ok) {
        const submissionsData = await submissionsResponse.json()
        setSubmissions(submissionsData.submissions || [])
      }

      // Load recent activity
      const activityResponse = await fetch("/api/user/activity")
      if (activityResponse.ok) {
        const activityData = await activityResponse.json()
        setRecentActivity(activityData.activity || [])
      }
    } catch (error) {
      console.error("Error loading user data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setLoading(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitMusic = () => {
    if (user.submission_credits === 0 && user.tier === "creator") {
      setShowUpgradeModal(true)
    } else if (user.submission_credits === 0) {
      setShowCreditPackModal(true)
    } else {
      router.push("/submit")
    }
  }

  const handleUpgradePlan = () => {
    router.push("/pricing")
  }

  const handleBuyCredits = () => {
    setShowCreditPackModal(true)
  }

  const handlePurchaseCreditPack = async (packId: string) => {
    try {
      setLoading(true)
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "credit_pack",
          packId,
          successUrl: `${window.location.origin}/dashboard?success=credits`,
          cancelUrl: `${window.location.origin}/dashboard`,
        }),
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      }
    } catch (error) {
      console.error("Error purchasing credits:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePlayAudio = (submissionId: string) => {
    if (currentlyPlaying === submissionId && isPlaying) {
      setIsPlaying(false)
      setCurrentlyPlaying(null)
    } else {
      setCurrentlyPlaying(submissionId)
      setIsPlaying(true)
      // In a real implementation, you would integrate with an audio player
    }
  }

  const tierInfo = getTierInfo(user.tier)
  const TierIcon = user.tier === "creator" ? User : user.tier === "indie" ? Star : Crown
  const creditsProgress = user.tier === "creator" ? 0 : (user.submission_credits / tierInfo.monthlyCredits) * 100

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "submission":
        return Music
      case "review":
        return CheckCircle
      case "achievement":
        return Trophy
      case "upgrade":
        return Crown
      default:
        return ActivityIcon
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "submission":
        return "text-blue-400"
      case "review":
        return "text-green-400"
      case "achievement":
        return "text-yellow-400"
      case "upgrade":
        return "text-purple-400"
      default:
        return "text-gray-400"
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-gray-400">Welcome back, {user.name}</p>
          </div>
          <div className="flex items-center space-x-4">
            {["admin", "master_dev"].includes(user.role) && (
              <Button onClick={() => router.push("/admin")} className="bg-purple-600 hover:bg-purple-700">
                <Shield className="h-4 w-4 mr-2" />
                Admin Portal
              </Button>
            )}
            <Button
              onClick={handleLogout}
              variant="outline"
              disabled={loading}
              className="border-gray-600 text-white hover:bg-gray-800 bg-transparent"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {loading ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Submit Music Card */}
          <Card className="bg-gray-800 border-gray-700 relative overflow-hidden group hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20" />
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                <Upload className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-white">Submit Music</CardTitle>
              <CardDescription className="text-gray-300">Upload your track for professional review</CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <Button
                onClick={handleSubmitMusic}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white transform hover:scale-105 transition-all duration-200"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Track
              </Button>
              {user.submission_credits === 0 && (
                <p className="text-xs text-yellow-400 mt-2 text-center animate-pulse">
                  {user.tier === "creator" ? "Upgrade to submit music" : "Buy credits to submit"}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Track Status Card */}
          <Card className="bg-gray-800 border-gray-700 relative overflow-hidden group hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-orange-500/20" />
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-white">Track Status</CardTitle>
              <CardDescription className="text-gray-300">Check your submission reviews</CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">Total Submissions</span>
                <Badge className="bg-blue-500 text-white">{submissions.length}</Badge>
              </div>
              <Button
                variant="outline"
                className="w-full border-gray-600 text-white hover:bg-gray-700 bg-transparent transform hover:scale-105 transition-all duration-200"
                onClick={() => router.push("/submissions")}
              >
                <Clock className="h-4 w-4 mr-2" />
                View Submissions
              </Button>
            </CardContent>
          </Card>

          {/* Achievements Card */}
          <Card className="bg-gray-800 border-gray-700 relative overflow-hidden group hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-yellow-500/20" />
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-white">Achievements</CardTitle>
              <CardDescription className="text-gray-300">View your placement success</CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">Success Rate</span>
                <Badge className="bg-green-500 text-white">
                  {submissions.length > 0
                    ? Math.round((submissions.filter((s) => s.status === "approved").length / submissions.length) * 100)
                    : 0}
                  %
                </Badge>
              </div>
              <Button
                variant="outline"
                className="w-full border-gray-600 text-white hover:bg-gray-700 bg-transparent transform hover:scale-105 transition-all duration-200"
                onClick={() => router.push("/achievements")}
              >
                <Trophy className="h-4 w-4 mr-2" />
                View Achievements
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Account Information */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-gray-400" />
                <CardTitle className="text-white">Account Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Details */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Name:</span>
                  <span className="text-white font-medium">{user.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Email:</span>
                  <span className="text-white font-medium">{user.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Plan:</span>
                  <Badge className={`${tierInfo.color} text-white`}>
                    <TierIcon className="h-3 w-3 mr-1" />
                    {tierInfo.name}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Credits:</span>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`font-bold text-lg ${user.submission_credits === 0 ? "text-red-400" : "text-green-400"}`}
                    >
                      {user.submission_credits === 999999 ? "∞" : user.submission_credits}
                    </span>
                    {user.tier !== "creator" && user.submission_credits !== 999999 && (
                      <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                          style={{ width: `${Math.min(creditsProgress, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                {submissions.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Submissions:</span>
                    <span className="text-purple-400 font-bold">{submissions.length}</span>
                  </div>
                )}
              </div>

              <Separator className="bg-gray-700" />

              {/* Tier Information */}
              {user.tier === "creator" && (
                <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-4 border border-blue-500/20">
                  <div className="flex items-center mb-2">
                    <Sparkles className="h-4 w-4 text-blue-400 mr-2" />
                    <h4 className="text-white font-medium">Creator Tier (Free)</h4>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">You're on the free Creator tier with access to:</p>
                  <ul className="space-y-1 text-sm text-gray-300 mb-4">
                    {tierInfo.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="h-3 w-3 text-green-400 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {tierInfo.upgradeText && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3">
                      <p className="text-yellow-400 text-sm font-medium">{tierInfo.upgradeText}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {user.submission_credits === 0 && user.tier !== "pro" && (
                  <div className="text-center p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-orange-400 mx-auto mb-2" />
                    <p className="text-orange-400 text-sm font-medium">Need submission credits?</p>
                  </div>
                )}

                {user.tier !== "pro" && (
                  <Button
                    onClick={handleUpgradePlan}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transform hover:scale-105 transition-all duration-200"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Upgrade Plan
                  </Button>
                )}

                {user.tier !== "pro" && (
                  <Button
                    onClick={handleBuyCredits}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white transform hover:scale-105 transition-all duration-200"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Buy Credit Packs
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="w-full border-gray-600 text-white hover:bg-gray-700 bg-transparent transform hover:scale-105 transition-all duration-200"
                  onClick={() => router.push("/settings")}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Account Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <ActivityIcon className="h-5 w-5 text-gray-400" />
                <CardTitle className="text-white">Recent Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.slice(0, 5).map((activity) => {
                    const ActivityIconComponent = getActivityIcon(activity.type)
                    return (
                      <div
                        key={activity.id}
                        className="flex items-start space-x-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors duration-200"
                      >
                        <div className="flex-shrink-0">
                          <div className={`p-2 rounded-full bg-gray-600 ${getActivityColor(activity.type)}`}>
                            <ActivityIconComponent className="h-4 w-4" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium">{activity.title}</p>
                          <p className="text-gray-400 text-xs">{activity.description}</p>
                          <p className="text-gray-500 text-xs mt-1">{formatRelativeTime(activity.timestamp)}</p>
                        </div>
                        {activity.status && (
                          <Badge
                            variant="outline"
                            className={`text-xs border-current ${getStatusColor(activity.status)}`}
                          >
                            {activity.status}
                          </Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="relative">
                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <div className="absolute -top-1 -right-1">
                      <Sparkles className="h-4 w-4 text-blue-400 animate-pulse" />
                    </div>
                  </div>
                  <p className="text-gray-400 font-medium">No activity yet</p>
                  <p className="text-gray-500 text-sm mt-2">
                    {user.tier === "creator"
                      ? "Upgrade to Indie or Pro to start submitting music and see your activity here!"
                      : "Submit your first track to get started"}
                  </p>
                  <Button
                    onClick={handleSubmitMusic}
                    className="mt-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  >
                    <Music className="h-4 w-4 mr-2" />
                    Get Started
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Submissions */}
        {submissions.length > 0 && (
          <Card className="bg-gray-800 border-gray-700 mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Music className="h-5 w-5 text-gray-400" />
                  <CardTitle className="text-white">Recent Submissions</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/submissions")}
                  className="border-gray-600 text-white hover:bg-gray-700 bg-transparent"
                >
                  View All
                  <ExternalLink className="h-3 w-3 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {submissions.slice(0, 3).map((submission) => (
                  <div
                    key={submission.id}
                    className="flex items-center space-x-4 p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors duration-200"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <Music className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium truncate">{submission.title}</h4>
                      <p className="text-gray-400 text-sm">by {submission.artist_name}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={`${getStatusBadgeColor(submission.status)} text-white text-xs`}>
                          {submission.status.replace("_", " ")}
                        </Badge>
                        <span className="text-gray-500 text-xs">{formatRelativeTime(submission.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {submission.admin_rating && (
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-yellow-400 text-sm font-medium">{submission.admin_rating}</span>
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePlayAudio(submission.id)}
                        className="border-gray-600 bg-transparent hover:bg-gray-600"
                      >
                        {currentlyPlaying === submission.id && isPlaying ? (
                          <Pause className="h-3 w-3" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Master Dev Alert */}
        {user.role === "master_dev" && (
          <Alert className="bg-gradient-to-r from-red-900/50 to-purple-900/50 border-red-500/50 mt-6">
            <Crown className="h-4 w-4" />
            <AlertDescription className="text-red-200">
              <strong>Master Developer Access:</strong> You have unlimited access to all platform features with{" "}
              {user.submission_credits === 999999 ? "unlimited" : user.submission_credits} submission credits.
            </AlertDescription>
          </Alert>
        )}

        {/* Credit Pack Modal */}
        {showCreditPackModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="bg-gray-800 border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-orange-400" />
                  Buy Submission Credits
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Choose a credit pack to submit more music for review
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  {creditPacks.map((pack) => (
                    <div
                      key={pack.id}
                      className={`relative p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ${
                        pack.popular
                          ? "border-purple-500 bg-gradient-to-r from-purple-500/10 to-pink-500/10"
                          : "border-gray-600 bg-gray-700/50 hover:border-gray-500"
                      }`}
                      onClick={() => handlePurchaseCreditPack(pack.id)}
                    >
                      {pack.popular && (
                        <div className="absolute -top-2 left-4">
                          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                            Most Popular
                          </Badge>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white font-medium">{pack.name}</h3>
                          <p className="text-gray-400 text-sm">
                            {pack.credits} submission credit{pack.credits > 1 ? "s" : ""}
                          </p>
                          {pack.savings && <p className="text-green-400 text-xs font-medium">{pack.savings}</p>}
                        </div>
                        <div className="text-right">
                          <div className="text-white font-bold text-lg">{formatCurrency(pack.price)}</div>
                          <div className="text-gray-400 text-sm">
                            {formatCurrency(pack.price / pack.credits)} per credit
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setShowCreditPackModal(false)} className="border-gray-600">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Upgrade Modal */}
        {showUpgradeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="bg-gray-800 border-gray-700 w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Star className="h-5 w-5 mr-2 text-purple-400" />
                  Upgrade Required
                </CardTitle>
                <CardDescription className="text-gray-400">
                  You need to upgrade your plan to submit music
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4">
                  <Crown className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                  <p className="text-white mb-2">Creator tier doesn't include submissions</p>
                  <p className="text-gray-400 text-sm">
                    Upgrade to Indie ($19.99/mo) or Pro ($24.99/mo) to start submitting your music for professional
                    review
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowUpgradeModal(false)}
                    className="flex-1 border-gray-600"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpgradePlan}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    Upgrade Now
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
