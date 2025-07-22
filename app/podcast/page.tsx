"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Volume2, Users, Clock, Star, Headphones, Music2, Mic, Radio, ExternalLink } from "lucide-react"

interface User {
  id: string
  email: string
  full_name: string
  tier: "creator" | "indie" | "pro"
  is_admin: boolean
  is_master_dev: boolean
}

interface Episode {
  id: string
  title: string
  description: string
  youtube_url: string
  thumbnail: string
  duration: string
  published_date: string
  view_count: string
  featured_guests: string[]
  topics: string[]
  episode_number: number
}

interface Host {
  name: string
  role: string
  bio: string
  image: string
  social: {
    instagram?: string
    twitter?: string
  }
}

const hosts: Host[] = [
  {
    name: "Big Tank",
    role: "Executive Producer & Host",
    bio: "Industry veteran with over 15 years of experience in music production and A&R. Known for discovering breakthrough artists and creating chart-topping hits across multiple genres.",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/big-tank.jpg-JSTEAnFE9vXWeKuANejMQ425iRKzFF.jpeg",
    social: {
      instagram: "@bigtankmusic",
      twitter: "@bigtankbeats",
    },
  },
  {
    name: "Mr. Porter",
    role: "Co-Host & Music Director",
    bio: "Grammy-nominated producer and songwriter who has worked with top-tier artists across multiple genres. Brings deep industry insights and technical expertise to every episode.",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mr-porter-O6soXC27cH1Aeoyma2uPojCT5h6O1i.png",
    social: {
      instagram: "@mrportermusic",
      twitter: "@porterbeats",
    },
  },
  {
    name: "Rockwilder",
    role: "Co-Host & Creative Director",
    bio: "Legendary producer behind countless hip-hop classics. Known for his innovative sound design and ability to spot emerging talent in the industry.",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/rockwilder.jpg-ASuRodAXFunuyBsQ7GedurowlvbdRz.jpeg",
    social: {
      instagram: "@rockwilder",
      twitter: "@rockwilderbeats",
    },
  },
]

const realEpisodes: Episode[] = [
  {
    id: "1",
    title: "The Man Behind The Music - Episode 1",
    description:
      "The inaugural episode of The Man Behind The Music podcast featuring Big Tank, Rockwilder, and Mr. Porter. Dive deep into the music industry with these legendary producers as they share their insights, experiences, and what it takes to make it in the music business.",
    youtube_url: "https://www.youtube.com/watch?v=VjXv6SHHkEo",
    thumbnail:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Podcast%20With%20Big%20Tank-3-jFozndWt9WQW6wgDAYb8V46XSqoHng.png",
    duration: "58:42",
    published_date: "2024-01-15",
    view_count: "25.3K",
    featured_guests: ["Big Tank", "Rockwilder", "Mr. Porter"],
    topics: ["Music Industry", "Producer Insights", "Behind The Scenes"],
    episode_number: 1,
  },
  {
    id: "2",
    title: "Industry Conversations - Episode 2",
    description:
      "The hosts continue their deep dive into the music industry, discussing current trends, artist development, and the evolution of music production. Get exclusive insights from three of the most respected names in hip-hop production.",
    youtube_url: "https://www.youtube.com/watch?v=s_fqfPiJmb0",
    thumbnail:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Podcast%20With%20Big%20Tank-3-jFozndWt9WQW6wgDAYb8V46XSqoHng.png",
    duration: "52:18",
    published_date: "2024-01-08",
    view_count: "18.7K",
    featured_guests: ["Big Tank", "Rockwilder", "Mr. Porter"],
    topics: ["Music Production", "Artist Development", "Industry Trends"],
    episode_number: 2,
  },
  {
    id: "3",
    title: "Hailey Kilgore on Acting and Singing as Jukebox in Raising Kanan",
    description:
      "Special guest Hailey Kilgore joins the podcast to discuss her dual role as both actress and singer, bringing the character Jukebox to life in the hit series Raising Kanan. An in-depth conversation about the intersection of acting and music performance.",
    youtube_url: "https://www.youtube.com/watch?v=VLeqmbdnAUs&t=3s",
    thumbnail:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Hailey%20Kilgore%20Snapshot-Cd04obfNGYBiRm8wUaiu7InwTpVl4O.png",
    duration: "45:32",
    published_date: "2024-01-01",
    view_count: "31.2K",
    featured_guests: ["Hailey Kilgore", "Big Tank", "Rockwilder", "Mr. Porter"],
    topics: ["Acting", "Music Performance", "Raising Kanan", "Character Development"],
    episode_number: 3,
  },
]

export default function PodcastPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [playingEpisode, setPlayingEpisode] = useState<string | null>(null)
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null)

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      }
    } catch (error) {
      console.error("Error fetching user:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePlayEpisode = (episodeId: string) => {
    if (playingEpisode === episodeId) {
      setPlayingEpisode(null)
    } else {
      setPlayingEpisode(episodeId)
    }
  }

  const openEpisodeModal = (episode: Episode) => {
    setSelectedEpisode(episode)
  }

  const closeEpisodeModal = () => {
    setSelectedEpisode(null)
  }

  const handleUpdateMedia = async () => {
    if (!user?.is_admin && !user?.is_master_dev) return

    try {
      const response = await fetch("/api/admin/media/sync", {
        method: "POST",
      })
      if (response.ok) {
        console.log("Media updated successfully")
      }
    } catch (error) {
      console.error("Error updating media:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section with Studio Background */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/behind-the-scenes-studio.jpg-tNwQryZr1TfhBTGUSWsQ6OfhDHJW8o.jpeg')`,
          }}
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-purple-500/20 to-blue-500/20" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-red-500/20 backdrop-blur-sm rounded-full px-6 py-3 border border-red-500/30 mb-6">
              <Radio className="w-5 h-5 text-red-400 animate-pulse" />
              <span className="text-red-400 font-semibold">LIVE PODCAST</span>
            </div>

            <h1 className="text-4xl md:text-7xl font-bold mb-6">
              The Man Behind{" "}
              <span className="bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                The Music
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto mb-8 leading-relaxed">
              Dive deep into the music industry with industry legends Big Tank, Mr. Porter, and Rockwilder. Get
              exclusive insights, behind-the-scenes stories, and discover what it takes to make it in music.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <div className="flex items-center gap-6 text-lg">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span className="text-blue-400 font-semibold">75K+ Subscribers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span className="text-yellow-400 font-semibold">4.9 Rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-semibold">Weekly Episodes</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-red-500 to-purple-500 hover:from-red-600 hover:to-purple-600 text-white px-8 py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
                onClick={() => window.open("https://www.youtube.com/@Themanbehindthemusicpodcast", "_blank")}
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Watch on YouTube
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 bg-transparent"
              >
                <Volume2 className="w-5 h-5 mr-2" />
                Listen on Spotify
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Update Panel */}
      {(user?.is_admin || user?.is_master_dev) && (
        <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  Admin Controls
                </Badge>
                <span className="text-gray-400">Manage podcast content</span>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 bg-transparent"
                  onClick={handleUpdateMedia}
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Update Media
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-green-500/30 text-green-400 hover:bg-green-500/10 bg-transparent"
                >
                  Manual Add
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Latest Episodes */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Latest Episodes</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Stay up-to-date with the latest industry insights, artist interviews, and music business deep dives
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {realEpisodes.map((episode) => (
            <Card
              key={episode.id}
              className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer group"
              onClick={() => openEpisodeModal(episode)}
            >
              <div className="relative">
                <img
                  src={episode.thumbnail || "/placeholder.svg"}
                  alt={episode.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300 rounded-t-lg" />

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <Button
                    size="lg"
                    className="bg-red-500 hover:bg-red-600 text-white rounded-full w-16 h-16 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(episode.youtube_url, "_blank")
                    }}
                  >
                    <Play className="w-8 h-8 ml-1" />
                  </Button>
                </div>

                {/* Episode Number Badge */}
                <div className="absolute top-4 left-4">
                  <Badge className="bg-red-500 text-white font-bold">EP {episode.episode_number}</Badge>
                </div>

                {/* Duration Badge */}
                <div className="absolute bottom-4 right-4">
                  <Badge variant="secondary" className="bg-black/60 text-white">
                    <Clock className="w-3 h-3 mr-1" />
                    {episode.duration}
                  </Badge>
                </div>
              </div>

              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                    {new Date(episode.published_date).toLocaleDateString()}
                  </Badge>
                  <div className="flex items-center gap-1 text-gray-400">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{episode.view_count}</span>
                  </div>
                </div>
                <CardTitle className="text-xl font-bold leading-tight group-hover:text-purple-400 transition-colors">
                  {episode.title}
                </CardTitle>
                <CardDescription className="text-gray-300 line-clamp-3">{episode.description}</CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Topics */}
                  <div className="flex flex-wrap gap-2">
                    {episode.topics.slice(0, 3).map((topic, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs"
                      >
                        {topic}
                      </Badge>
                    ))}
                  </div>

                  {/* Featured Guests */}
                  {episode.featured_guests.length > 0 && (
                    <div className="text-sm text-gray-400">
                      <span className="font-semibold">Guests: </span>
                      {episode.featured_guests.join(", ")}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All Episodes Button */}
        <div className="text-center mt-12">
          <Button
            size="lg"
            variant="outline"
            className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 bg-transparent px-8 py-4"
            onClick={() => window.open("https://www.youtube.com/@Themanbehindthemusicpodcast", "_blank")}
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            View All Episodes on YouTube
          </Button>
        </div>
      </div>

      {/* Featured Clip Section */}
      <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Featured Clips</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Catch the best moments and highlights from our latest episodes
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Hailey Kilgore Clip */}
            <Card className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 hover:border-red-500/50 transition-all duration-300">
              <div className="relative">
                <video
                  className="w-full h-64 object-cover rounded-t-lg"
                  poster="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Hailey%20Kilgore%20Snapshot-Cd04obfNGYBiRm8wUaiu7InwTpVl4O.png"
                  controls
                  preload="metadata"
                >
                  <source
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Podcast%20Cardi%20B%20Social%20Clip%203_26%20Edit-0KbYf73ION8EYfucgh6IFh6Qau8cA3.mp4"
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>
              </div>
              <CardHeader>
                <CardTitle className="text-xl font-bold">Hailey Kilgore on Jukebox Character</CardTitle>
                <CardDescription className="text-gray-300">
                  Exclusive interview discussing her role as Jukebox in Raising Kanan and the intersection of acting and
                  music performance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    Acting
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    Music Performance
                  </Badge>
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                    Raising Kanan
                  </Badge>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-red-500 to-purple-500 hover:from-red-600 hover:to-purple-600"
                  onClick={() => window.open("https://www.youtube.com/watch?v=VLeqmbdnAUs&t=3s", "_blank")}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Watch Full Episode
                </Button>
              </CardContent>
            </Card>

            {/* Podcast Promo */}
            <Card className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 hover:border-purple-500/50 transition-all duration-300">
              <div className="relative">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Podcast%20With%20Big%20Tank-3-jFozndWt9WQW6wgDAYb8V46XSqoHng.png"
                  alt="The Man Behind The Music Podcast"
                  className="w-full h-64 object-cover rounded-t-lg"
                />
              </div>
              <CardHeader>
                <CardTitle className="text-xl font-bold">New Episode Alert</CardTitle>
                <CardDescription className="text-gray-300">
                  Join Big Tank, Rockwilder, and Mr. Porter for in-depth conversations about the music industry,
                  production techniques, and artist development.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/30">
                    Music Industry
                  </Badge>
                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    Producer Insights
                  </Badge>
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                    Behind The Scenes
                  </Badge>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  onClick={() => window.open("https://www.youtube.com/@Themanbehindthemusicpodcast", "_blank")}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Subscribe to Channel
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Hosts Section */}
      <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Meet Your Hosts</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Industry legends bringing you unfiltered insights from decades of music industry experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {hosts.map((host, index) => (
              <Card
                key={index}
                className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 hover:border-red-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl text-center"
              >
                <CardHeader className="pb-6">
                  <div className="relative mx-auto mb-6">
                    <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-gradient-to-r from-red-500 to-purple-500 p-1">
                      <img
                        src={host.image || "/placeholder.svg"}
                        alt={host.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <Music2 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold mb-2 text-white">{host.name}</CardTitle>
                  <CardDescription className="text-red-400 font-semibold text-lg">{host.role}</CardDescription>
                </CardHeader>

                <CardContent>
                  <p className="text-gray-300 mb-6 leading-relaxed">{host.bio}</p>

                  <div className="flex justify-center gap-4">
                    {host.social.instagram && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-pink-500/30 text-pink-400 hover:bg-pink-500/10 bg-transparent"
                      >
                        Instagram
                      </Button>
                    )}
                    {host.social.twitter && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 bg-transparent"
                      >
                        Twitter
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Subscribe Section */}
      <div className="bg-gradient-to-r from-red-500/10 via-purple-500/10 to-blue-500/10 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Never Miss an Episode</h2>
          <p className="text-xl text-gray-300 mb-8">
            Subscribe to get notified when new episodes drop and gain access to exclusive behind-the-scenes content
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              size="lg"
              className="bg-gradient-to-r from-red-500 to-purple-500 hover:from-red-600 hover:to-purple-600 text-white px-8 py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
              onClick={() => window.open("https://www.youtube.com/@Themanbehindthemusicpodcast", "_blank")}
            >
              <Headphones className="w-5 h-5 mr-2" />
              Subscribe on YouTube
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 bg-transparent"
            >
              <Volume2 className="w-5 h-5 mr-2" />
              Listen on Spotify
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-red-400 mb-2">75K+</div>
              <div className="text-gray-400">YouTube Subscribers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400 mb-2">50+</div>
              <div className="text-gray-400">Episodes</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-400 mb-2">4.9</div>
              <div className="text-gray-400">Average Rating</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400 mb-2">Weekly</div>
              <div className="text-gray-400">New Content</div>
            </div>
          </div>
        </div>
      </div>

      {/* Episode Modal */}
      {selectedEpisode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              <img
                src={selectedEpisode.thumbnail || "/placeholder.svg"}
                alt={selectedEpisode.title}
                className="w-full h-64 object-cover rounded-t-lg"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white"
                onClick={closeEpisodeModal}
              >
                ✕
              </Button>

              {/* Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  size="lg"
                  className="bg-red-500 hover:bg-red-600 text-white rounded-full w-20 h-20 p-0"
                  onClick={() => {
                    window.open(selectedEpisode.youtube_url, "_blank")
                  }}
                >
                  <Play className="w-10 h-10 ml-1" />
                </Button>
              </div>
            </div>

            <div className="p-8">
              <div className="flex items-center gap-4 mb-4">
                <Badge className="bg-red-500 text-white font-bold">EP {selectedEpisode.episode_number}</Badge>
                <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                  {new Date(selectedEpisode.published_date).toLocaleDateString()}
                </Badge>
                <div className="flex items-center gap-1 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{selectedEpisode.duration}</span>
                </div>
              </div>

              <h3 className="text-3xl font-bold mb-4">{selectedEpisode.title}</h3>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">{selectedEpisode.description}</p>

              {selectedEpisode.featured_guests.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xl font-semibold mb-3">Featured Guests</h4>
                  <div className="space-y-2">
                    {selectedEpisode.featured_guests.map((guest, index) => (
                      <div key={index} className="text-gray-300">
                        • {guest}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h4 className="text-xl font-semibold mb-3">Topics Covered</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedEpisode.topics.map((topic, index) => (
                    <Badge key={index} variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  className="bg-gradient-to-r from-red-500 to-purple-500 hover:from-red-600 hover:to-purple-600 text-white"
                  onClick={() => window.open(selectedEpisode.youtube_url, "_blank")}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Watch on YouTube
                </Button>
                <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent">
                  Share Episode
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
