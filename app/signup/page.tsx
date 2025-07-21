import { SignUpForm } from "@/components/auth/sign-up-form"
import { getCurrentUser } from "@/lib/supabase/auth"
import { redirect } from "next/navigation"
import { Play, Star, Music, Award, Users, ArrowRight } from "lucide-react"
import { WaveformPlayer } from "@/components/ui/waveform-player"

export default async function SignUpPage() {
  const user = await getCurrentUser()

  // Redirect if already logged in
  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section with Media Player Visual */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Welcome Message & CTA */}
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden shadow-lg">
                    <img
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/holographic%20nav%20logo-qI8h2EHhrvruK8MhJfUE8k87DbX2xv.png"
                      alt="TMBM Logo"
                      className="w-full h-full object-cover scale-110"
                    />
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                    The Man Behind the Music
                  </span>
                </div>

                <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                    Your Music Journey
                  </span>
                  <br />
                  <span className="text-white">Starts Here</span>
                </h1>

                <p className="text-xl text-gray-300 leading-relaxed max-w-2xl">
                  Join thousands of artists who've discovered their breakthrough moment. Connect directly with
                  <span className="text-purple-400 font-semibold"> Grammy-winning producers</span> and industry legends
                  who've shaped the sound of modern music.
                </p>
              </div>

              {/* Benefits Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start space-x-4 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Music className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Direct Access</h3>
                    <p className="text-gray-400 text-sm">Submit directly to producers behind your favorite hits</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Real Placements</h3>
                    <p className="text-gray-400 text-sm">Get your music in TV shows, films, and major productions</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Exclusive Community</h3>
                    <p className="text-gray-400 text-sm">
                      Join a network of serious artists and industry professionals
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Play className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Industry Insights</h3>
                    <p className="text-gray-400 text-sm">Learn from exclusive podcast conversations and feedback</p>
                  </div>
                </div>
              </div>

              {/* Social Proof */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <span className="text-gray-300 font-medium">Trusted by 1000+ artists worldwide</span>
                </div>

                <div className="flex items-center space-x-6 text-sm text-gray-400">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>500+ successful placements</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <span>Grammy-winning producers</span>
                  </div>
                </div>
              </div>

              {/* Urgency CTA */}
              <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-700/50 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <ArrowRight className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg mb-2">Start with 2 Free Submissions</h3>
                    <p className="text-purple-200 text-sm mb-3">
                      Every new member gets 2 submission credits to start their journey. No payment required.
                    </p>
                    <p className="text-yellow-300 text-xs font-medium">
                      ⚡ Join now and submit your first track within minutes
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Media Player Visual & Form */}
            <div className="space-y-8">
              {/* Media Player Visual */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-t from-purple-600/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-64 object-cover rounded-2xl shadow-2xl group-hover:shadow-purple-500/30 transition-all duration-500 transform group-hover:scale-105"
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
                        <p className="text-white font-semibold text-sm">Industry Insights Podcast</p>
                        <p className="text-gray-300 text-xs">Exclusive conversations with music legends</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Waveform Player */}
              <WaveformPlayer trackTitle="Your Next Hit" artist="Submitted Artist" duration={180} />

              {/* Sign Up Form */}
              <SignUpForm />

              {/* Additional Encouragement */}
              <div className="text-center space-y-3">
                <p className="text-gray-400 text-sm">🔒 Your information is secure and will never be shared</p>
                <p className="text-purple-400 text-sm font-medium">
                  Ready to take your music career to the next level?
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Producer Showcase */}
      <div className="border-t border-gray-800 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Connect with Industry Legends</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              These Grammy-winning producers and music supervisors are waiting to discover your next hit
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Big Tank",
                role: "Producer & Music Supervisor",
                image:
                  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/big-tank.jpg-xE31OY2snwDBTIiSTMnhQLuIuJO5um.jpeg",
                credits: "BMF, Power, Raising Kanan",
              },
              {
                name: "Rockwilder",
                role: "Grammy-Winning Producer",
                image:
                  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/rockwilder.jpg-HjJq9vvv7hAyRf7me8lM3NKuBGYUkQ.jpeg",
                credits: "Lady Marmalade, Jay-Z, Eminem",
              },
              {
                name: "Mr. Porter",
                role: "Multi-Platinum Producer",
                image:
                  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mr-porter-hrLGzmZl4A5TslwAu7nsodLy7THcom.png",
                credits: "D12, Eminem, Jay Electronica",
              },
            ].map((producer, index) => (
              <div key={index} className="text-center group">
                <div className="relative mb-4 mx-auto w-32 h-32">
                  <img
                    src={producer.image || "/placeholder.svg"}
                    alt={producer.name}
                    className="w-full h-full object-cover rounded-full shadow-xl group-hover:shadow-purple-500/30 transition-all duration-300 transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-t from-purple-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <h3 className="text-white font-bold text-lg mb-1">{producer.name}</h3>
                <p className="text-purple-400 text-sm font-medium mb-2">{producer.role}</p>
                <p className="text-gray-400 text-xs">{producer.credits}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-300 text-lg mb-6">
              Your music could be the next big placement. Join today and start your journey.
            </p>
            <div className="inline-flex items-center space-x-2 text-green-400 font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>✅ Free to join • ✅ 2 submission credits included • ✅ Instant access</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
