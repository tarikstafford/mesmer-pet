import Link from 'next/link'
import { Sparkles, Heart, Brain, Dna, GamepadIcon, Users, Zap } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      {/* Navigation */}
      <nav className="absolute top-0 w-full z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Sparkles className="w-8 h-8" />
            <span className="text-2xl font-bold">Mesmer</span>
          </div>
          <Link
            href="/auth/login"
            className="px-6 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-full font-medium hover:bg-white/20 transition"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div className="text-white space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-sm">
                <Zap className="w-4 h-4 text-yellow-300" />
                <span>AI-Powered Virtual Pets</span>
              </div>

              <h1 className="text-6xl lg:text-7xl font-bold leading-tight">
                Your AR Pet
                <br />
                <span className="bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 text-transparent bg-clip-text">
                  Companion
                </span>
              </h1>

              <p className="text-xl text-purple-100 leading-relaxed max-w-xl">
                Raise, breed, and bond with AI-powered virtual pets in augmented reality.
                Each pet has unique genetics, personality, and can even teach your kids!
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/auth/register"
                  className="group px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-semibold text-lg shadow-lg shadow-purple-500/50 hover:shadow-purple-500/80 hover:scale-105 transition-all duration-200 flex items-center gap-2"
                >
                  Get Started Free
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </Link>

                <Link
                  href="#features"
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-full font-semibold text-lg hover:bg-white/20 transition"
                >
                  Learn More
                </Link>
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-4">
                <div>
                  <div className="text-3xl font-bold text-white">10K+</div>
                  <div className="text-purple-200 text-sm">Active Pets</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">30+</div>
                  <div className="text-purple-200 text-sm">Genetic Traits</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">20+</div>
                  <div className="text-purple-200 text-sm">Skills to Learn</div>
                </div>
              </div>
            </div>

            {/* Right: Hero Visual */}
            <div className="relative">
              <div className="relative w-full aspect-square max-w-lg mx-auto">
                {/* Glowing orb effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-pink-400/40 via-purple-400/40 to-indigo-400/40 rounded-full blur-2xl animate-pulse"></div>

                {/* Placeholder for 3D pet or hero image */}
                <div className="relative w-full h-full bg-gradient-to-br from-pink-300/20 via-purple-300/20 to-indigo-300/20 rounded-3xl backdrop-blur-sm border border-white/20 flex items-center justify-center overflow-hidden">
                  <div className="text-center text-white/50">
                    <Sparkles className="w-32 h-32 mx-auto mb-4 animate-bounce" />
                    <p className="text-lg">Your Pet Lives Here</p>
                  </div>
                </div>

                {/* Floating badges */}
                <div className="absolute -top-4 -left-4 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full text-sm font-semibold shadow-lg animate-bounce" style={{ animationDelay: '0.5s' }}>
                  🧬 Legendary Trait
                </div>
                <div className="absolute -bottom-4 -right-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full text-sm font-semibold shadow-lg animate-bounce" style={{ animationDelay: '1s' }}>
                  🎮 Interactive AR
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Why Choose Mesmer?
            </h2>
            <p className="text-xl text-purple-200 max-w-2xl mx-auto">
              The most advanced virtual pet experience combining AI, genetics, and AR
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">AI-Powered Minds</h3>
              <p className="text-purple-200 leading-relaxed">
                Each pet powered by GPT-4o-mini with unique personality traits.
                They remember conversations and grow with you.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform">
                <Dna className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Genetic Breeding</h3>
              <p className="text-purple-200 leading-relaxed">
                Breed pets with 50/50 trait inheritance and mutation system.
                Create legendary offspring across 4 rarity tiers.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Augmented Reality</h3>
              <p className="text-purple-200 leading-relaxed">
                See your pet in your real environment with WebXR.
                Interact, feed, and play with them anywhere.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform">
                <GamepadIcon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Educational Skills</h3>
              <p className="text-purple-200 leading-relaxed">
                Teach your pet math, chess, languages, and more.
                They can then tutor your children!
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Care & Bond</h3>
              <p className="text-purple-200 leading-relaxed">
                Feed, play, and nurture your pet. Watch stats change in real-time
                and build a genuine connection.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Social Breeding</h3>
              <p className="text-purple-200 leading-relaxed">
                Connect with friends, share pet profiles, and breed
                your pets together for unique offspring.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-indigo-500/20 backdrop-blur-sm rounded-3xl border border-white/20">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Meet Your Pet?
            </h2>
            <p className="text-xl text-purple-200 mb-8 max-w-2xl mx-auto">
              Join thousands of users raising AI-powered companions.
              Start your journey today—completely free!
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-bold text-lg shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/80 hover:scale-105 transition-all duration-200"
            >
              Create Your Pet
              <Sparkles className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-black/40 backdrop-blur-sm border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 text-white mb-4">
                <Sparkles className="w-6 h-6" />
                <span className="text-xl font-bold">Mesmer</span>
              </div>
              <p className="text-purple-300 text-sm">
                Your AI-powered AR pet companion
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-purple-300 text-sm">
                <li><Link href="#features" className="hover:text-white transition">Features</Link></li>
                <li><Link href="/marketplace" className="hover:text-white transition">Marketplace</Link></li>
                <li><Link href="/auth/register" className="hover:text-white transition">Get Started</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-purple-300 text-sm">
                <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3">Connect</h4>
              <ul className="space-y-2 text-purple-300 text-sm">
                <li><a href="https://github.com/tarikstafford/mesmer-pet" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">GitHub</a></li>
                <li><a href="#" className="hover:text-white transition">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition">Discord</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 text-center text-purple-300 text-sm">
            <p>© 2026 Mesmer. Built with ❤️ and AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
