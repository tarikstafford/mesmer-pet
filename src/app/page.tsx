import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
      <div className="text-center text-white">
        <h1 className="text-6xl font-bold mb-4">Mesmer</h1>
        <p className="text-xl mb-8">Your AR Pet Companion</p>
        <div className="space-x-4">
          <Link
            href="/auth/register"
            className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition inline-block"
          >
            Get Started
          </Link>
          <Link
            href="/auth/login"
            className="px-6 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition inline-block"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
