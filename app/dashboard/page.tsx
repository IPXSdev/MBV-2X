import { getCurrentUser } from "@/lib/supabase/auth"
import { redirect } from "next/navigation"
import { Upload, Clock, Trophy, User, Settings, Star, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MasterDevQuickActions } from "@/components/admin/MasterDevQuickActions"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "creator":
        return "bg-gray-500"
      case "indie":
        return "bg-blue-500"
      case "pro":
        return "bg-gradient-to-r from-purple-500 to-pink-500"
      default:
        return "bg-gray-500"
    }
  }

  const getTierDisplayName = (tier: string) => {
    switch (tier) {
      case "creator":
        return "Creator"
      case "indie":
        return "Indie"
      case "pro":
        return "Pro"
      default:
        return "Creator"
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}</h1>
          <p className="text-gray-400">Manage your music submissions and track your progress</p>
        </div>

        {/* Master Developer Quick Actions Bar */}
        <MasterDevQuickActions user={user} className="mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Submit Music Card */}
          <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Upload className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-1">Submit Music</h3>
                  <p className="text-gray-400 text-sm mb-3">Upload your track for professional review</p>
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    disabled={user.submissionCredits === 0}
                  >
                    {user.submissionCredits > 0 ? "Upload Track" : "No Credits Available"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Track Status Card */}
          <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-1">Track Status</h3>
                  <p className="text-gray-400 text-sm mb-3">Check your submission reviews</p>
                  <Button
                    variant="outline"
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    View Submissions
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievements Card */}
          <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-1">Achievements</h3>
                  <p className="text-gray-400 text-sm mb-3">View your placement success</p>
                  <Button
                    variant="outline"
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    View Achievements
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Account Information */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Account Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <Badge className={`${getTierColor(user.tier)} text-white`}>{getTierDisplayName(user.tier)}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Submissions:</span>
                <span className="text-purple-400 font-bold text-xl">{user.submissionCredits}</span>
              </div>

              {/* Creator Tier Info */}
              {user.tier === "creator" && (
                <div className="bg-gray-700 rounded-lg p-4 mt-4">
                  <h4 className="text-white font-semibold mb-2">Creator Tier (Free)</h4>
                  <p className="text-gray-300 text-sm mb-3">You're on the free Creator tier with access to:</p>
                  <ul className="text-gray-300 text-sm space-y-1 mb-4">
                    <li>• View select podcast clips</li>
                    <li>• Behind-the-scenes sneak peeks</li>
                    <li>• Music placement announcements</li>
                  </ul>
                  <p className="text-yellow-400 text-sm font-medium">
                    Upgrade to Indie ($19.99/mo) or Pro ($24.99/mo) to submit music for review!
                  </p>
                </div>
              )}

              <div className="space-y-3 pt-4">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Star className="h-4 w-4 mr-2" />
                  Upgrade to Indie or Pro
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-orange-500 text-orange-400 hover:bg-orange-900/20 bg-transparent"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Buy Submission Packs
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
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
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8 text-gray-500" />
                </div>
                <h3 className="text-gray-400 font-medium mb-2">No activity yet</h3>
                <p className="text-gray-500 text-sm mb-6 max-w-sm">
                  Upgrade to Indie or Pro to start submitting music and see your activity here!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}