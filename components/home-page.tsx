"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Play, ArrowRight, Music, Award, Star } from "lucide-react"
import Link from "next/link"
import { YouTubeEmbed } from "./youtube-embed"

// Prevent Web3/MetaMask injection errors
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    if (
      event.reason?.message?.includes("MetaMask") ||
      event.reason?.message?.includes("Web3") ||
      event.reason?.message?.includes("ethereum")
    ) {
      event.preventDefault()
      console.warn("Prevented Web3/MetaMask error:", event.reason)
    }
  })
}

export function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          setIsLoggedIn(true)
        } else {
          setIsLoggedIn(false)
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        setIsLoggedIn(false)
      }
    }

    checkAuth()
  }, [])

  const handleSubmitMusic = () => {
    if (isLoggedIn) {
      window.location.href = "/submissions"
    } else {
      window.location.href = "/signup"
    }
  }

  const hosts = [
    {
      name: "Big Tank",
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/big-tank.jpg-xE31OY2snwDBTIiSTMnhQLuIuJO5um.jpeg",
      role: "Producer & Music Supervisor",
      bio: "Dynamic force in entertainment - producer, music supervisor, and composer who has collaborated with Rihanna, Missy Elliott, Ne-Yo, and Christina Aguilera. Former Senior VP at Sony Music with extensive TV/Film credits including BMF, Power, and Raising Kanan.",
    },
    {
      name: "Rockwilder",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/rockwilder.jpg-HjJq9vvv7hAyRf7me8lM3NKuBGYUkQ.jpeg",
      role: "Grammy-Winning Producer",
      bio: "Grammy Award-winning music producer whose signature sound has shaped hip-hop, R&B, and pop for over two decades. Known for iconic productions like 'Lady Marmalade' and collaborations with Jay-Z, Eminem, Dr. Dre, and Christina Aguilera.",
    },
    {
      name: "Mr. Porter",
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mr-porter-hrLGzmZl4A5TslwAu7nsodLy7THcom.png",
      role: "Multi-Platinum Producer",
      bio: "2x Grammy Award-winning producer and former D12 member. His revolutionary sound has contributed to nearly 40 million records sold, with collaborations spanning from Eminem and Jay Electronica to Sting and Burt Bacharach.",
    },
  ]

  const podcastEpisodes = [
    {
      videoId: "s_fqfPiJmb0",
      title: "Industry Insights Episode 1",
      description: "Behind the scenes with industry legends",
    },
    {
      videoId: "VLeqmbdnAUs",
      title: "Industry Insights Episode 2",
      description: "Exclusive conversations with top producers",
    },
    {
      videoId: "VjXv6SHHkEo",
      title: "Industry Insights Episode 3",
      description: "The future of music production",
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <video autoPlay muted loop playsInline className="w-full h-full object-cover opacity-50">
            <source
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Hero%20Section%20Video-iS9UnC2oKMHUlJkChli6geOlzzVGGd.mp4"
              type="video/mp4"
            />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent leading-tight">
            The Man Behind the Music
          </h1>
          <p className="text-xl md:text-2xl lg:text-3xl mb-12 text-gray-200 font-light max-w-3xl mx-auto">
            Submit your music. Get heard. Get placed.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button
              onClick={handleSubmitMusic}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-10 py-6 text-xl font-semibold rounded-full shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 transform hover:scale-105"
            >
              <Music className="mr-3 h-6 w-6" />
              Submit Your Music
            </Button>

            <Link href="/podcast">
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-white/40 text-white hover:bg-white/10 px-10 py-6 text-xl font-semibold rounded-full backdrop-blur-sm transition-all duration-300 transform hover:scale-105 bg-transparent hover:border-purple-400"
              >
                <Play className="mr-3 h-6 w-6" />
                Watch Podcast
              </Button>
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Featured Podcast Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Industry Talk. Exclusive Access.
            </h2>
            <p className="text-gray-400 text-xl max-w-3xl mx-auto">
              Behind-the-scenes conversations with the industry's most influential creators
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {podcastEpisodes.map((episode, index) => (
              <Card
                key={index}
                className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
              >
                <CardContent className="p-6">
                  <YouTubeEmbed videoId={episode.videoId} title={episode.title} className="mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">{episode.title}</h3>
                  <p className="text-gray-400">{episode.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/podcast">
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-xl hover:shadow-purple-500/25 transition-all duration-300"
              >
                View All Episodes
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Hosts Section */}
      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Meet the Creators Behind the Curtain
            </h2>
            <p className="text-gray-400 text-xl max-w-3xl mx-auto">
              Grammy-winning producers and industry legends sharing their expertise and connections
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {hosts.map((host, index) => (
              <div key={index} className="text-center group">
                <div className="relative mb-8 mx-auto w-80 h-80">
                  <img
                    src={host.image || "/placeholder.svg"}
                    alt={host.name}
                    className="w-full h-full object-cover rounded-2xl shadow-2xl group-hover:shadow-purple-500/30 transition-all duration-500 transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-purple-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <h3 className="text-3xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                  {host.name}
                </h3>
                <p className="text-purple-400 font-semibold mb-4 text-lg">{host.role}</p>

                <div className="max-h-0 overflow-hidden group-hover:max-h-40 transition-all duration-500 ease-in-out">
                  <p className="text-gray-400 leading-relaxed px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-200">
                    {host.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Placement Feature Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-4xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Your music in scenes like this?
              </h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Our placements include major TV and film networks like Starz. Get your music featured in the next big
                production.
              </p>

              <div className="flex items-center mb-8">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-6 w-6 text-yellow-400 fill-current" />
                  ))}
                </div>
                <span className="ml-3 text-gray-300">Trusted by 1000+ artists</span>
              </div>

              <Link href="/placements">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-10 py-6 text-xl font-semibold rounded-full shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
                >
                  <Award className="mr-3 h-6 w-6" />
                  Explore Placements
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </Link>
            </div>

            <div className="order-1 lg:order-2">
              <div className="relative group">
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full max-w-lg mx-auto rounded-2xl shadow-2xl group-hover:shadow-purple-500/30 transition-all duration-500 transform group-hover:scale-105"
                >
                  <source
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Placements%20Power%20Book%20II-3nb012sWKRHGZ1jYXjZeqMLWYCRL4F.mp4"
                    type="video/mp4"
                  />
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-purple-600/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 bg-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Ready to Get Your Music Heard?
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Join thousands of artists who trust industry legends to elevate their careers
          </p>
          <Button
            onClick={handleSubmitMusic}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-12 py-6 text-xl font-semibold rounded-full shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
          >
            <Music className="mr-3 h-6 w-6" />
            Start Your Journey Today
          </Button>
        </div>
      </section>
    </div>
  )
}
