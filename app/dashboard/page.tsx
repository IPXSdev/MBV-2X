import { requireAuth } from "@/lib/supabase/auth"
import {
  Music,
  Star,
  TrendingUp,
  Database,
  Upload,
  Clock,
  Trophy,
  User,
  Settings,
  CreditCard,
  Activity,
} from "lucide-react"

export default async function DashboardPage() {
  const user = await requireAuth()

  // Mock recent activity data - in production this would come from the database
  const recentActivity = [
    {
      id: 1,
      type: "submission",
      title: "Track submitted for review",
      description: `Your track 'Summer Vibes' is being reviewed`,
      timestamp: "2 hours ago",
      icon: Music,
      color: "text-blue-400",
    },
    {
      id: 2,
      type: "feedback",
      title: "Feedback received",
      description: "Professional feedback available for 'Night Drive'",
      timestamp: "1 day ago",
      icon: Star,
      color: "text-yellow-400",
    },
    {
      id: 3,
      type: "sync",
      title: "Sync opportunity",
      description: "Your track matched with a commercial project",
      timestamp: "3 days ago",
      icon: TrendingUp,
      color: "text-green-400",
    },
  ]

  // Determine tier display name
  const getTierDisplayName = (tier: string) => {
    switch (tier) {
      case "free":
        return "Creator"
      case "creator":
        return "Indie"
      case "pro":
        return "Pro"
      default:
        return "Creator"
    }
  }

  // Determine tier color
  const getTierColor = (tier: string) => {
    switch (tier) {
      case "free":
        return "bg-gray-700 text-gray-300"
      case "creator":
        return "bg-blue-700 text-blue-200"
      case "pro":
        return "bg-purple-700 text-purple-200"
      default:
        return "bg-gray-700 text-gray-300"
    }
  }

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-4">
            Welcome back, {user.name}!
          </h1>
          <p className="text-gray-400">Your music submission dashboard</p>
          <div className="flex items-center justify-center mt-2">
            <Database className="h-4 w-4 text-green-400 mr-2" />
            <span className="text-xs text-green-400">✅ Connected to Supabase Database</span>
          </div>
        </div>

        {/* Top Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Submit Music Card */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 hover:bg-gray-800 transition-all duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-4">
                <Upload className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Submit Music</h3>
              <p className="text-gray-400 text-sm mb-4">Upload your track for professional review</p>

              {user.submissionCredits > 0 ? (
                <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300">
                  Upload Track
                </button>
              ) : (
                <div className="w-full">
                  <div className="bg-gray-800 border border-gray-600 text-gray-400 px-6 py-3 rounded-lg font-medium text-center mb-2">
                    <Upload className="h-4 w-4 inline mr-2" />
                    No Submissions Available
                  </div>
                  <p className="text-xs text-gray-500">
                    {user.tier === "free"
                      ? "Creator tier includes no monthly submissions. Upgrade to Indie or Pro to submit music."
                      : "Purchase submission packs or upgrade to submit"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Track Status Card */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 hover:bg-gray-800 transition-all duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-600 to-red-600 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Track Status</h3>
              <p className="text-gray-400 text-sm mb-4">Check your submission reviews</p>

              <button className="w-full border border-gray-600 text-white hover:bg-gray-800 px-6 py-3 rounded-lg font-medium transition-all duration-300">
                <Clock className="h-4 w-4 inline mr-2" />
                View Submissions
              </button>
            </div>
          </div>

          {/* Achievements Card */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 hover:bg-gray-800 transition-all duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-600 to-red-600 rounded-full flex items-center justify-center mb-4">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Achievements</h3>
              <p className="text-gray-400 text-sm mb-4">View your placement success</p>

              <button className="w-full border border-gray-600 text-white hover:bg-gray-800 px-6 py-3 rounded-lg font-medium transition-all duration-300">
                <Trophy className="h-4 w-4 inline mr-2" />
                View Achievements
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section - Account Info & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Account Information */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center mb-6">
              <User className="h-6 w-6 text-purple-400 mr-3" />
              <h3 className="text-xl font-semibold text-white">Account Information</h3>
            </div>

            <div className="space-y-4 mb-6">
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
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getTierColor(user.tier)}`}>
                  {getTierDisplayName(user.tier)}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Submissions:</span>
                <span
                  className={`font-bold text-2xl ${user.submissionCredits > 0 ? "text-purple-400" : "text-red-400"}`}
                >
                  {user.submissionCredits}
                </span>
              </div>
            </div>

            {/* Creator Tier Messaging */}
            {user.tier === "free" && (
              <div className="mb-6 p-4 bg-gray-800 border border-gray-600 rounded-lg">
                <h4 className="text-white font-medium mb-2">Creator Tier (Free)</h4>
                <p className="text-gray-400 text-sm mb-3">You're on the free Creator tier with access to:</p>
                <ul className="text-gray-400 text-sm space-y-1 mb-4">
                  <li>• View select podcast clips</li>
                  <li>• Behind-the-scenes sneak peeks</li>
                  <li>• Music placement announcements</li>
                </ul>
                <p className="text-yellow-400 text-sm font-medium">
                  Upgrade to Indie ($19.99/mo) or Pro ($24.99/mo) to submit music for review!
                </p>
              </div>
            )}

            {/* Submissions messaging for other tiers */}
            {user.tier !== "free" && user.submissionCredits === 0 && (
              <div className="mb-6">
                <p className="text-center text-gray-400 text-sm mb-4">Need more submissions?</p>
              </div>
            )}

            <div className="space-y-3">
              <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center">
                <Star className="h-4 w-4 mr-2" />
                {user.tier === "free" ? "Upgrade to Indie or Pro" : "Upgrade Plan"}
              </button>

              <button className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center">
                <CreditCard className="h-4 w-4 mr-2" />
                Buy Submission Packs
              </button>

              <button className="w-full border border-gray-600 text-white hover:bg-gray-800 px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center">
                <Settings className="h-4 w-4 mr-2" />
                Account Settings
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center mb-6">
              <Activity className="h-6 w-6 text-blue-400 mr-3" />
              <h3 className="text-xl font-semibold text-white">Recent Activity</h3>
            </div>

            {user.tier === "free" ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">No activity yet</p>
                <p className="text-gray-500 text-sm">
                  Upgrade to Indie or Pro to start submitting music and see your activity here!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => {
                  const IconComponent = activity.icon
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-4 p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
                    >
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center`}
                      >
                        <IconComponent className={`h-5 w-5 ${activity.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium text-sm">{activity.title}</h4>
                        <p className="text-gray-400 text-sm mt-1">{activity.description}</p>
                        <p className="text-gray-500 text-xs mt-2">{activity.timestamp}</p>
                      </div>
                    </div>
                  )
                })}

                {recentActivity.length === 0 && (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No recent activity</p>
                    <p className="text-gray-500 text-sm mt-1">Submit your first track to get started!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Master Dev Info */}
        {user.role === "master_dev" && (
          <div className="mt-8 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-yellow-300 mb-2">Master Developer Access</h3>
            <p className="text-yellow-200/80 text-sm mb-4">
              You have full platform access with unlimited submissions and admin privileges.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black/30 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Database Info</h4>
                <div className="text-xs text-gray-300 space-y-1">
                  <p>• User ID: {user.id}</p>
                  <p>• Stored in Supabase</p>
                  <p>• Session-based auth</p>
                  <p>• Row-level security enabled</p>
                </div>
              </div>
              <div className="bg-black/30 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Privileges</h4>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>• Unlimited submissions</li>
                  <li>• Full admin portal access</li>
                  <li>• User management capabilities</li>
                  <li>• File storage access</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 flex space-x-4">
              <a
                href="/admin"
                className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300"
              >
                Admin Portal
              </a>
              <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300">
                Test All Tiers
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
