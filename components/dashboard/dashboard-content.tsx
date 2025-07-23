"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { MasterDevPanel } from "./master-dev-panel"
import { Music, Upload, Clock, Trophy, Settings, Star, TrendingUp, Zap } from "lucide-react"
import Link from "next/link"

interface DashboardUser {
  id: string
  name: string
  email: string
  role: string
  tier?: string
  submission_credits?: number
}

interface DashboardContentProps {
  user?: DashboardUser | null
  loading?: boolean
}

function getTierInfo(tier: string) {
  switch (tier) {
    case "creator":
      return {
        name: "Creator",
        color: "bg-gray-600 text-white",
        maxCredits: 0,
        description: "Perfect for getting started",
      }
    case "indie":
      return {
        name: "Indie",
        color: "bg-blue-600 text-white",
        maxCredits: 3,
        description: "For independent artists",
      }
    case "pro":
      return {
        name: "Pro",
        color: "bg-gradient-to-r from-purple-600 to-pink-600 text-white",
        maxCredits: 5,
        description: "For professional musicians",
      }
    default:
      return {
        name: "Creator",
        color: "bg-gray-600 text-white",
        maxCredits: 0,
        description: "Perfect for getting started",
      }
  }
}

export function DashboardContent({ user, loading }: DashboardContentProps) {
  const [recentActivity, setRecentActivity] = useState([
    {
      id: 1,
      type: "submission",
      title: "Track submitted for review",
      description: "Your track 'Summer Vibes' is being reviewed",
      time: "2 hours ago",
      icon: Music,
      iconColor: "text-blue-400",
    },
    {
      id: 2,
      type: "feedback",
      title: "Feedback received",
      description: "Professional feedback available for 'Night Drive'",
      time: "1 day ago",
      icon: Star,
      iconColor: "text-yellow-400",
    },
    {
      id: 3,
      type: "sync",
      title: "Sync opportunity",
      description: "Your track matched with a commercial project",
      time: "3 days ago",
      icon: TrendingUp,
      iconColor: "text-green-400",
    },
  ])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Please log in to access your dashboard.</p>
        </div>
      </div>
    )
  }

  const tierInfo = getTierInfo(user?.tier || "creator")
  const currentCredits = user?.submission_credits || 0

  // Check if this is a master dev account (only for specific emails)
  const isMasterDev = user.role === "master_dev" && (user.email.includes("2668") || user.email.includes("ipxs"))

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Welcome back, {user?.name || "User"}!</h1>
          <p className="text-gray-400 mt-2">Manage your music submissions and track your progress</p>
        </div>

        {/* Master Dev Panel - Only shown for specific master_dev accounts */}
        {isMasterDev && (
          <div className="mb-8">
            <MasterDevPanel user={user} />
          </div>
        )}

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Submit Music Card */}
          <Card className="bg-gray-800 border-gray-700 hover:border-blue-500/50 transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Submit Music</h3>
              <p className="text-gray-400 text-sm mb-4">Upload your track for professional review</p>
              {currentCredits > 0 ? (
                <Link href="/submit">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">Submit Track</Button>
                </Link>
              ) : (
                <Button className="w-full bg-gray-600 cursor-not-allowed" disabled>
                  <Upload className="h-4 w-4 mr-2" />
                  No Credits Available
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Track Status Card */}
          <Card className="bg-gray-800 border-gray-700 hover:border-red-500/50 transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Track Status</h3>
              <p className="text-gray-400 text-sm mb-4">Check your submission reviews</p>
              <Link href="/submissions">
                <Button className="w-full bg-red-600 hover:bg-red-700">
                  <Clock className="h-4 w-4 mr-2" />
                  View Submissions
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Achievements Card */}
          <Card className="bg-gray-800 border-gray-700 hover:border-orange-500/50 transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Achievements</h3>
              <p className="text-gray-400 text-sm mb-4">View your placement success</p>
              <Button className="w-full bg-orange-600 hover:bg-orange-700">
                <Trophy className="h-4 w-4 mr-2" />
                View Achievements
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Account Information */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Settings className="h-5 w-5 mr-2" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Name:</span>
                  <span className="text-white font-medium">{user?.name || "Not available"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Email:</span>
                  <span className="text-white font-medium">{user?.email || "Not available"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Plan:</span>
                  <Badge className={tierInfo.color}>{tierInfo.name}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Credits:</span>
                  <span className={`font-bold text-lg ${currentCredits === 0 ? "text-red-400" : "text-white"}`}>
                    {currentCredits}
                  </span>
                </div>
              </div>

              <Separator className="bg-gray-700" />

              <div className="space-y-3">
                <p className="text-gray-400 text-sm">Need submission credits?</p>
                <div className="space-y-2">
                  <Link href="/pricing">
                    <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                      <Star className="h-4 w-4 mr-2" />
                      Upgrade Plan
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                      <Zap className="h-4 w-4 mr-2" />
                      Buy Credit Packs
                    </Button>
                  </Link>
                </div>
              </div>

              <Separator className="bg-gray-700" />

              <Button className="w-full bg-gray-700 hover:bg-gray-600 text-white">
                <Settings className="h-4 w-4 mr-2" />
                Account Settings
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity) => {
                const Icon = activity.icon
                return (
                  <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-700/50 rounded-lg">
                    <div
                      className={`w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center ${activity.iconColor}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold text-sm">{activity.title}</h4>
                      <p className="text-gray-400 text-sm">{activity.description}</p>
                      <p className="text-gray-500 text-xs mt-1">{activity.time}</p>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
