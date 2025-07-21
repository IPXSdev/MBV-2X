import { SignInForm } from "@/components/auth/sign-in-form"
import { getCurrentUser } from "@/lib/supabase/auth"
import { redirect } from "next/navigation"
import { Music, Award, Users, ArrowRight, Star, Play } from "lucide-react"
import { WaveformPlayer } from "@/components/ui/waveform-player"

export default async function LoginPage() {
  // Check if user is already logged in
  const user = await getCurrentUser()
  if (user) {
    console.log("User already logged in, redirecting to dashboard")
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-bl from-blue-900/20 via-black to-purple-900/20" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Sign In Form */}
            <div className="space-y-8 order-2 lg:order-1">
              <div className="text-center lg:text-left space-y-4">
                <div className="flex items-center justify-center lg:justify-start space-x-3 mb-6">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden shadow-lg">
                    <img
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/holographic%20nav%20logo-qI8h2EHhrvruK8MhJfUE8k87DbX2xv.png"
                      alt="TMBM Logo"
                      className="w-full h-full object-cover scale-110"
                    />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                    The Man Behind the Music
                  </span>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-blue-200 via-white to-purple-200 bg-clip-text text-transparent">
                    Welcome Back
                  </span>
                  <br />
                  <span className="text-white">to Your Studio</span>
                </h1>

                <p className="text-lg text-gray-300 leading-relaxed">
                  Continue building your legacy with{" "}
                  <span className="text-blue-400 font-semibold">Grammy-winning producers</span> and industry legends.
                </p>
              </div>

              <SignInForm />

              <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700/50 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <ArrowRight className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg mb-2">Your Dashboard Awaits</h3>
                    <p className="text-blue-200 text-sm mb-3">
                      Access your submissions, check feedback, and discover new placement opportunities.
                    </p>
                    <p className="text-cyan-300 text-xs font-medium">⚡ Your submission credits are ready</p>
                  </div>
                </div>
              </div>

              <div className="text-center space-y-3">
                <p className="text-gray-400 text-sm">🔒 Secure login with industry-grade encryption</p>
                <p className="text-blue-400 text-sm font-medium">
                  Don't have an account?{" "}
                  <a href="/signup" className="text-purple-400 hover:text-purple-300 underline">
                    Join the community
                  </a>
                </p>
              </div>
            </div>

            {/* Right Side - Content & Media */}
            <div className="space-y-8 order-1 lg:order-2">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-64 object-cover rounded-2xl shadow-2xl group-hover:shadow-blue-500/30 transition-all duration-500 transform group-hover:scale-105"
                >
                  <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/media%20player%20visual-AL4Yf9WIU1HtEWbeiS5rvOTJhhjCvL.mp4" type="video/mp4" />
                </video>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                        <Play className="h-5 w-5 text-white ml-0.5" fill="currentColor" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">The Man Behind the Music</p>
                        <p className="text-gray-300 text-xs">Exclusive conversations with music legends</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <WaveformPlayer trackTitle="Last Submission" artist="Your Track" duration={195} />

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start space-x-3 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Music className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">Active</h3>
                    <p className="text-gray-400 text-xs">Submissions</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Award className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">New</h3>
                    <p className="text-gray-400 text-xs">Opportunities</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">Community</h3>
                    <p className="text-gray-400 text-xs">Updates</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-600 to-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Play className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">Latest</h3>
                    <p className="text-gray-400 text-xs">Podcast</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-white font-semibold text-lg">Platform Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-gray-900/30 rounded-lg border border-gray-800">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-300 text-sm">New placement in "Power Book III" - 2 hours ago</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-900/30 rounded-lg border border-gray-800">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-300 text-sm">Big Tank reviewed 15 new submissions - 4 hours ago</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-900/30 rounded-lg border border-gray-800">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-300 text-sm">New podcast episode released - 1 day ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Recent Success Stories</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              See what our community members have achieved with their submissions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                achievement: "TV Placement",
                show: "Power Book II: Ghost",
                artist: "Marcus J.",
                description: "Hip-hop track placed in season finale",
                badge: "🏆 Recent Placement",
              },
              {
                achievement: "Producer Feedback",
                show: "Direct from Rockwilder",
                artist: "Sarah M.",
                description: "Received detailed feedback and collaboration offer",
                badge: "💬 Producer Response",
              },
              {
                achievement: "Sync Deal",
                show: "Major Commercial",
                artist: "The Collective",
                description: "30-second sync for national brand campaign",
                badge: "💰 Sync Success",
              },
            ].map((story, index) => (
              <div
                key={index}
                className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 hover:bg-gray-900/70 transition-all duration-300"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-bold text-lg">{story.achievement}</h3>
                    <span className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2 py-1 rounded-full">
                      {story.badge}
                    </span>
                  </div>
                  <div>
                    <p className="text-blue-400 font-medium">{story.show}</p>
                    <p className="text-gray-400 text-sm">by {story.artist}</p>
                  </div>
                  <p className="text-gray-300 text-sm">{story.description}</p>
                  <div className="flex items-center space-x-2">
                    <div className="flex -space-x-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <span className="text-gray-400 text-xs">Verified success</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-300 text-lg mb-6">
              Your success story could be next. Log in and continue your journey.
            </p>
            <div className="inline-flex items-center space-x-2 text-green-400 font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>✅ Secure platform • ✅ Industry connections • ✅ Real opportunities</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
