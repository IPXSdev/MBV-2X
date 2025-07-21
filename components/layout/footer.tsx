import Link from "next/link"
import { Music, Mail, Phone, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-lg">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/holographic%20nav%20logo-qI8h2EHhrvruK8MhJfUE8k87DbX2xv.png"
                  alt="TMBM Logo"
                  className="w-full h-full object-cover scale-110"
                />
              </div>
              <span className="text-white font-bold text-xl bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                The Man Behind the Music
              </span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              Submit your music to Grammy-winning producers and industry legends. Get your tracks placed in major TV
              shows, films, and productions.
            </p>
            <div className="flex items-center space-x-2 text-purple-400">
              <Music className="h-5 w-5" />
              <span className="text-sm">Trusted by 1000+ artists worldwide</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { href: "/", label: "Home" },
                { href: "/about", label: "About" },
                { href: "/podcast", label: "Podcast" },
                { href: "/placements", label: "Placements" },
                { href: "/pricing", label: "Pricing" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-white transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3 text-gray-400">
                <Mail className="h-4 w-4" />
                <span className="text-sm">info@tmbm.com</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-400">
                <Phone className="h-4 w-4" />
                <span className="text-sm">+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-400">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">Los Angeles, CA</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">© 2024 The Man Behind the Music. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
