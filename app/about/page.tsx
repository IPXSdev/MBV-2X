"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Music2,
  Award,
  Users,
  TrendingUp,
  Globe,
  Star,
  Mic,
  Radio,
  ExternalLink,
  ArrowRight,
  CheckCircle,
} from "lucide-react"

interface User {
  id: string
  email: string
  full_name: string
  tier: "creator" | "indie" | "pro"
  is_admin: boolean
  is_master_dev: boolean
}

const hosts = [
  {
    name: "Derryck 'Big Tank' Thornton",
    title: "Producer | Music Supervisor | Composer | Executive",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/big-tank.jpg-JSTEAnFE9vXWeKuANejMQ425iRKzFF.jpeg",
    bio: "Derryck 'Big Tank' Thornton is a dynamic force in the entertainment industry—an influential producer, music supervisor, and composer who seamlessly blends visionary artistry with strategic leadership. With an extraordinary career that spans across music, television, and film, Big Tank has crafted unforgettable soundtracks and shaped the sonic identity of culturally iconic projects.",
    achievements: [
      "Senior Vice President at Sony Music",
      "A&R Executive at EP Entertainment/Universal Music Group (2015-2018)",
      "A&R Executive at Geffen Records (2008-2011)",
      "Music Supervisor for BMF, Raising Kanan, Power (Starz)",
      "Music Supervisor for Dope Thief (Apple TV+)",
      "Collaborated with Rihanna, Missy Elliott, Ne-Yo, Christina Aguilera, Queen Latifah",
    ],
    specialties: ["Music Supervision", "A&R", "Executive Leadership", "Film & TV Soundtracks"],
  },
  {
    name: "Denaun 'Mr. Porter'",
    title: "2x Grammy Award Winning Producer | Songwriter | Composer",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mr-porter-O6soXC27cH1Aeoyma2uPojCT5h6O1i.png",
    bio: "Denaun has been on a transformational journey. Having shed his former alter ego, Kon Artis, the renowned emcee from Shady Records' multi-platinum selling Hip Hop group, D12, he stands as a multifaceted artist with a distinctive identity and powerful message encompassing his myriad talents: songwriter, composer, singer, performer, visionary, leader, innovator, and underdog.",
    achievements: [
      "2x Grammy Award Winning Producer",
      "Former member of D12 (Shady Records)",
      "Co-executive produced RIAA certified Gold album 'Hell: The Sequel'",
      "Executive produced Royce Da 5'9's 'Layers' (#1 Billboard R&B/Hip Hop)",
      "Film scoring for 'Fast 5', 'Waist Deep', 'Godfather of Harlem'",
      "Collaborated with Eminem, Swizz Beatz, DMX, Sting, Burt Bacharach",
    ],
    specialties: ["Music Production", "Film Scoring", "Hip Hop", "Multi-Genre Collaboration"],
  },
  {
    name: "Dana 'Rockwilder' Stinson",
    title: "Grammy Award-Winning Producer | Creative Visionary | Cultural Architect",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/rockwilder.jpg-ASuRodAXFunuyBsQ7GedurowlvbdRz.jpeg",
    bio: "Dana 'Rockwilder' Stinson is a Grammy Award-winning music producer and creative force whose signature sound has shaped the sonic identity of hip-hop, R&B, and pop for over two decades. Known for blending hard-hitting beats with soulful melodies and cutting-edge innovation, Rockwilder is the mastermind behind some of the most iconic records in modern music.",
    achievements: [
      "Grammy Award-Winning Producer",
      "Produced 'Lady Marmalade' (Christina Aguilera, Lil' Kim, Mýa, Pink, Missy Elliott)",
      "Produced 'Da Rockwilder' (Redman & Method Man)",
      "Produced 'Do It' (Missy Elliott)",
      "Worked with Jay-Z, Eminem, Dr. Dre, Busta Rhymes, Mary J. Blige, Janet Jackson",
      "Composed original score for cult-classic film 'How High'",
    ],
    specialties: ["Music Production", "AI Music Production", "Digital Branding", "Visual Storytelling"],
  },
]

const platformFeatures = [
  {
    icon: <Music2 className="w-8 h-8" />,
    title: "Music Sync Opportunities",
    description:
      "Connect your music with TV shows, films, commercials, and digital content through our extensive industry network.",
    color: "from-red-500 to-pink-500",
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "Industry Mentorship",
    description:
      "Get direct access to Grammy-winning producers and industry executives for personalized guidance and career development.",
    color: "from-purple-500 to-blue-500",
  },
  {
    icon: <TrendingUp className="w-8 h-8" />,
    title: "Artist Development",
    description:
      "Comprehensive programs to develop your sound, brand, and business acumen with proven industry strategies.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: <Globe className="w-8 h-8" />,
    title: "Global Distribution",
    description:
      "Leverage our partnerships with major labels and streaming platforms to get your music heard worldwide.",
    color: "from-green-500 to-emerald-500",
  },
]

const visionPoints = [
  "Democratize access to industry expertise and opportunities",
  "Bridge the gap between emerging artists and established professionals",
  "Create sustainable pathways for music industry success",
  "Foster innovation through technology and traditional artistry",
  "Build a community of creators, producers, and industry leaders",
  "Provide transparent, artist-friendly business practices",
]

export default function AboutPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/behind-the-scenes-studio.jpg-tNwQryZr1TfhBTGUSWsQ6OfhDHJW8o.jpeg')`,
          }}
        />
        <div className="absolute inset-0 bg-black/80" />
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-purple-500/20 to-blue-500/20" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-red-500/20 backdrop-blur-sm rounded-full px-6 py-3 border border-red-500/30 mb-6">
              <Radio className="w-5 h-5 text-red-400 animate-pulse" />
              <span className="text-red-400 font-semibold">ABOUT THE PLATFORM</span>
            </div>

            <h1 className="text-4xl md:text-7xl font-bold mb-6">
              The Man Behind{" "}
              <span className="bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                The Music
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto mb-8 leading-relaxed">
              Where industry legends meet emerging talent. A platform built by Grammy-winning producers and music
              industry executives to democratize access to opportunities, mentorship, and success in the music business.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-red-500 to-purple-500 hover:from-red-600 hover:to-purple-600 text-white px-8 py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <Users className="w-5 h-5 mr-2" />
                Join Our Community
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 bg-transparent"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Explore Opportunities
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Our Vision Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Our Vision</h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto mb-12">
            We believe that talent exists everywhere, but opportunities don't. Our mission is to change that by creating
            a bridge between emerging artists and the industry professionals who can help them succeed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {visionPoints.map((point, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-red-500 to-purple-500 rounded-full flex items-center justify-center mt-1">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <p className="text-gray-300 text-lg leading-relaxed">{point}</p>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 rounded-2xl p-8 md:p-12">
          <div className="text-center">
            <h3 className="text-2xl md:text-4xl font-bold mb-6">
              Transforming the Music Industry{" "}
              <span className="bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text text-transparent">
                One Artist at a Time
              </span>
            </h3>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Through our platform, we're not just connecting artists with opportunities—we're building the future of
              music. A future where creativity meets commerce, where talent meets opportunity, and where the next
              generation of music industry leaders are born.
            </p>
          </div>
        </div>
      </div>

      {/* Platform Features */}
      <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Platform Opportunities</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Discover the comprehensive suite of opportunities and services designed to accelerate your music career
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {platformFeatures.map((feature, index) => (
              <Card
                key={index}
                className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                <CardHeader className="pb-6">
                  <div
                    className={`w-16 h-16 rounded-full bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}
                  >
                    {feature.icon}
                  </div>
                  <CardTitle className="text-2xl font-bold text-white mb-2">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-lg leading-relaxed mb-6">{feature.description}</p>
                  <Button
                    variant="outline"
                    className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 bg-transparent"
                  >
                    Learn More
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Meet the Team */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Meet the Legends</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Our platform is powered by industry veterans with decades of experience and countless success stories
          </p>
        </div>

        <div className="space-y-16">
          {hosts.map((host, index) => (
            <Card
              key={index}
              className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 hover:border-red-500/50 transition-all duration-300"
            >
              <div className={`grid grid-cols-1 lg:grid-cols-${index % 2 === 0 ? "3" : "3"} gap-8 p-8`}>
                <div className={`${index % 2 === 1 ? "lg:order-2" : ""} flex flex-col items-center text-center`}>
                  <div className="relative mb-6">
                    <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-gradient-to-r from-red-500 to-purple-500 p-1">
                      <img
                        src={host.image || "/placeholder.svg"}
                        alt={host.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{host.name}</h3>
                  <p className="text-red-400 font-semibold text-lg mb-4">{host.title}</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {host.specialties.map((specialty, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="bg-purple-500/20 text-purple-400 border-purple-500/30"
                      >
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className={`lg:col-span-2 ${index % 2 === 1 ? "lg:order-1" : ""} space-y-6`}>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-4">Biography</h4>
                    <p className="text-gray-300 text-lg leading-relaxed">{host.bio}</p>
                  </div>

                  <div>
                    <h4 className="text-xl font-bold text-white mb-4">Key Achievements</h4>
                    <div className="space-y-3">
                      {host.achievements.map((achievement, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-red-500 to-purple-500 rounded-full flex items-center justify-center mt-1">
                            <Star className="w-3 h-3 text-white" />
                          </div>
                          <p className="text-gray-300 leading-relaxed">{achievement}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-red-500/10 via-purple-500/10 to-blue-500/10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Our Impact</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              The numbers speak for themselves - decades of industry experience and countless success stories
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-6xl font-bold text-red-400 mb-2">40M+</div>
              <div className="text-gray-400 text-lg">Records Sold</div>
            </div>
            <div>
              <div className="text-4xl md:text-6xl font-bold text-purple-400 mb-2">5</div>
              <div className="text-gray-400 text-lg">Grammy Awards</div>
            </div>
            <div>
              <div className="text-4xl md:text-6xl font-bold text-blue-400 mb-2">50+</div>
              <div className="text-gray-400 text-lg">Major TV/Film Credits</div>
            </div>
            <div>
              <div className="text-4xl md:text-6xl font-bold text-green-400 mb-2">30+</div>
              <div className="text-gray-400 text-lg">Years Combined Experience</div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Take Your Music Career{" "}
            <span className="bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text text-transparent">
              to the Next Level?
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
            Join thousands of artists who are already leveraging our platform to connect with industry professionals,
            access exclusive opportunities, and build sustainable music careers.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-red-500 to-purple-500 hover:from-red-600 hover:to-purple-600 text-white px-8 py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <Users className="w-5 h-5 mr-2" />
              Get Started Today
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 bg-transparent"
              onClick={() => window.open("/podcast", "_self")}
            >
              <Mic className="w-5 h-5 mr-2" />
              Listen to Our Podcast
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
