import { requireAuth } from "@/lib/supabase/auth"
import { Music, Star, TrendingUp, Users, Database } from "lucide-react"

export default async function DashboardPage() {
  const user = await requireAuth()

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Tier Status */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">Current Tier</h3>
              <Star className="h-5 w-5 text-purple-400" />
            </div>
            <div
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                user.tier === "free"
                  ? "bg-gray-700 text-gray-300"
                  : user.tier === "creator"
                    ? "bg-blue-700 text-blue-200"
                    : "bg-purple-700 text-purple-200"
              }`}
            >
              {user.tier.charAt(0).toUpperCase() + user.tier.slice(1)} Tier
            </div>
          </div>

          {/* Submission Credits */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">Credits</h3>
              <Music className="h-5 w-5 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-purple-400">{user.submissionCredits}</div>
            <p className="text-sm text-gray-400">Remaining</p>
          </div>

          {/* Account Status */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">Status</h3>
              <Users className="h-5 w-5 text-green-400" />
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-400 text-sm">Active</span>
            </div>
            <p className="text-sm text-gray-400 mt-1">Since {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>

          {/* Role Badge */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">Role</h3>
              <TrendingUp className="h-5 w-5 text-yellow-400" />
            </div>
            <div
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                user.role === "master_dev"
                  ? "bg-yellow-700 text-yellow-200"
                  : user.role === "admin"
                    ? "bg-red-700 text-red-200"
                    : "bg-gray-700 text-gray-300"
              }`}
            >
              {user.role === "master_dev" ? "Master Dev" : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 disabled:opacity-50">
              Submit New Track
            </button>
            <button className="border border-gray-600 text-white hover:bg-gray-800 px-6 py-3 rounded-lg font-medium transition-all duration-300 disabled:opacity-50">
              Upgrade Plan (Coming Soon)
            </button>
            {(user.role === "admin" || user.role === "master_dev") && (
              <a
                href="/admin"
                className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 text-center block"
              >
                Admin Portal
              </a>
            )}
          </div>
        </div>

        {/* Master Dev Info */}
        {user.role === "master_dev" && (
          <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-700/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-300 mb-2">Master Developer Access</h3>
            <p className="text-yellow-200/80 text-sm mb-4">
              You have full platform access with unlimited submission credits and admin privileges.
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
                  <li>• Unlimited submission credits</li>
                  <li>• Full admin portal access</li>
                  <li>• User management capabilities</li>
                  <li>• File storage access</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
