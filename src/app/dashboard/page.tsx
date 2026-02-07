'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/auth/login')
      return
    }

    setUser(JSON.parse(userData))
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    router.push('/')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-purple-600">Mesmer</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.name || user.email}!</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Dashboard</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-purple-500 pl-4">
              <p className="text-gray-600">
                <strong>Email:</strong> {user.email}
              </p>
              <p className="text-gray-600">
                <strong>Email Verified:</strong> {user.emailVerified ? 'Yes' : 'No'}
              </p>
              <p className="text-gray-600">
                <strong>User ID:</strong> {user.id}
              </p>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">🎉 Welcome to Mesmer!</h3>
              <p className="text-blue-700">
                Your account has been successfully created and you're now logged in.
                This dashboard will be expanded in future iterations with pet management features.
              </p>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">📝 Coming Soon</h3>
              <ul className="list-disc list-inside text-yellow-700 space-y-1">
                <li>Create and manage your AR pets</li>
                <li>View pet stats and personality traits</li>
                <li>Breed pets to create unique offspring</li>
                <li>Chat with your AI-powered pet companions</li>
                <li>View pets in augmented reality</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
