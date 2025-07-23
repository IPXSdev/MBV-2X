"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Search, Filter, ExternalLink, Calendar, Music, Award, Star } from "lucide-react"
import Link from "next/link"

interface Placement {
  id: string
  title: string
  show: string
  network: string
  artist: string
  genre: string
  tier: "Creator" | "Indie" | "Pro"
  date: string
  image: string
  video?: string
  description: string
  episode?: string
  season?: string
}

const placements: Placement[] = [
  {
    id: "1",
    title: "Street Dreams",
    show: "Power Universe",
    network: "STARZ",
    artist: "Marcus Rivera",
    genre: "Hip-Hop",
    tier: "Pro",
    date: "2024-03-15",
    image: "/images/placements/power-universe-poster.webp",
    description:
      "High-energy track featured during a pivotal chase scene in the Power Universe. The song's intense beats perfectly matched the show's dramatic tension, leading to increased streaming and industry recognition.",
    episode: "Episode 8",
    season: "Season 4",
  },
  {
    id: "2",
    title: "Family Ties",
    show: "BMF: Black Mafia Family",
    network: "STARZ",
    artist: "Destiny Williams",
    genre: "R&B",
    tier: "Pro",
    date: "2024-02-28",
    image: "/images/placements/bmf-poster.jpg",
    description:
      "Soulful R&B track that played during an emotional family reunion scene. The placement generated significant buzz on social media and led to a record deal for the artist.",
    episode: "Episode 6",
    season: "Season 2",
  },
  {
    id: "3",
    title: "Power Moves",
    show: "Power Book II: Ghost",
    network: "STARZ",
    artist: "Jay Thompson",
    genre: "Trap",
    tier: "Indie",
    date: "2024-01-20",
    image: "/images/placements/power-universe-poster.webp",
    video: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Placements%20Power%20Book%20II-3cPVXmcXFDSZmtfdywnT9GchSWZWAX.mp4",
    description:
      "Trap anthem featured in the opening credits sequence. The placement resulted in over 2M streams within the first week and caught the attention of major labels.",
    episode: "Episode 3",
    season: "Season 4",
  },
  {
    id: "4",
    title: "Empire State",
    show: "Power Book III: Raising Kanan",
    network: "STARZ",
    artist: "Brooklyn Collective",
    genre: "Hip-Hop",
    tier: "Indie",
    date: "2023-12-10",
    image: "/images/placements/power-universe-poster.webp",
    description:
      "NYC-inspired hip-hop track that perfectly captured the show's 90s aesthetic. Featured during a key montage sequence showcasing the rise of the main character.",
    episode: "Episode 10",
    season: "Season 3",
  },
  {
    id: "5",
    title: "Chicago Nights",
    show: "Power Book IV: Force",
    network: "STARZ",
    artist: "Midwest Kings",
    genre: "Drill",
    tier: "Creator",
    date: "2023-11-05",
    image: "/images/placements/power-universe-poster.webp",
    description:
      "Chicago drill track that added authentic local flavor to the show's setting. The placement helped establish the artist's presence in the Chicago music scene.",
    episode: "Episode 7",
    season: "Season 2",
  },
  {
    id: "6",
    title: "Legacy",
    show: "BMF Documentary",
    network: "STARZ",
    artist: "Truth Speakers",
    genre: "Conscious Rap",
    tier: "Pro",
    date: "2023-10-15",
    image: "/images/placements/bmf-poster.jpg",
    description:
      "Powerful conscious rap track featured in the BMF documentary series. The placement highlighted the social impact themes and resonated strongly with viewers.",
    episode: "Documentary Special",
    season: "Season 1",
  },
]

export default function PlacementsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTier, setSelectedTier] = useState<string>("all")
  const [selectedGenre, setSelectedGenre] = useState<string>("all")

  const filteredPlacements = placements.filter((placement) => {
    const matchesSearch =
      placement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      placement.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      placement.show.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTier = selectedTier === "all" || placement.tier === selectedTier
    const matchesGenre = selectedGenre === "all" || placement.genre === selectedGenre

    return matchesSearch && matchesTier && matchesGenre
  })

  const genres = [...new Set(placements.map((p) => p.genre))]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-r from-purple-900/50 to-blue-900/50">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Award className="h-8 w-8 text-yellow-500" />
            <Badge variant="outline" className="border-yellow-500 text-yellow-500 px-4 py-2">
              50+ STARZ Placements
            </Badge>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Music Placements
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Discover how TMBM artists have landed their music on major STARZ productions including
            <span className="text-purple-400 font-semibold"> Power Universe</span>,
            <span className="text-blue-400 font-semibold"> BMF</span>, and more
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>Power Universe Featured</span>
            </div>
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4 text-purple-500" />
              <span>BMF Featured</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-blue-500" />
              <span>Industry Recognition</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-8 px-4 border-b border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search placements, artists, or shows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-900 border-gray-700 text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <Select value={selectedTier} onValueChange={setSelectedTier}>
                  <SelectTrigger className="w-32 bg-gray-900 border-gray-700">
                    <SelectValue placeholder="Tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="Creator">Creator</SelectItem>
                    <SelectItem value="Indie">Indie</SelectItem>
                    <SelectItem value="Pro">Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="w-32 bg-gray-900 border-gray-700">
                  <SelectValue placeholder="Genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  {genres.map((genre) => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Placements Grid */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPlacements.map((placement) => (
              <Card
                key={placement.id}
                className="bg-gray-900 border-gray-800 overflow-hidden hover:border-purple-500/50 transition-all duration-300 group"
              >
                <div className="relative">
                  <img
                    src={placement.image || "/placeholder.svg"}
                    alt={placement.show}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Tier Badge */}
                  <Badge
                    className={`absolute top-3 left-3 ${
                      placement.tier === "Pro"
                        ? "bg-purple-600"
                        : placement.tier === "Indie"
                          ? "bg-blue-600"
                          : "bg-green-600"
                    }`}
                  >
                    {placement.tier}
                  </Badge>

                  {/* Video Play Button */}
                  {placement.video && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button
                        size="lg"
                        className="rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30"
                        onClick={() => window.open(placement.video, "_blank")}
                      >
                        <Play className="h-6 w-6 text-white" />
                      </Button>
                    </div>
                  )}
                </div>

                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{placement.title}</h3>
                      <p className="text-purple-400 font-medium">{placement.artist}</p>
                    </div>
                    <Badge variant="outline" className="border-gray-600 text-gray-300">
                      {placement.genre}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <ExternalLink className="h-4 w-4" />
                      <span>
                        {placement.show} • {placement.network}
                      </span>
                    </div>

                    {placement.episode && (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {placement.season} • {placement.episode}
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-gray-300 text-sm mb-4 line-clamp-3">{placement.description}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{new Date(placement.date).toLocaleDateString()}</span>

                    {placement.video && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white bg-transparent"
                        onClick={() => window.open(placement.video, "_blank")}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Watch Clip
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPlacements.length === 0 && (
            <div className="text-center py-12">
              <Music className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No placements found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Get Your Music on STARZ?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join the artists who have successfully placed their music on major STARZ productions. Start your journey
            with TMBM today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700">
              <Link href="/submit">Submit Your Music</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent"
            >
              <Link href="/pricing">View Pricing Plans</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
