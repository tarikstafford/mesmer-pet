'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CreatePetPage() {
  const router = useRouter()
  const [petName, setPetName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    // Get userId from localStorage (where JWT is stored)
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }

    // Decode JWT to get userId (simple decoding, no verification needed client-side)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setUserId(payload.userId)
    } catch (err) {
      console.error('Invalid token:', err)
      router.push('/auth/login')
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!userId) {
      setError('User not authenticated')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/pets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: petName,
          userId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create pet')
        setLoading(false)
        return
      }

      // US-029: Update tutorial step for pet creation
      const authToken = localStorage.getItem('authToken')
      if (authToken) {
        try {
          await fetch('/api/tutorial/update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({ step: 'create_pet' }),
          })
        } catch (tutorialError) {
          // Non-blocking, continue even if tutorial update fails
          console.error('Failed to update tutorial:', tutorialError)
        }
      }

      // Redirect to dashboard with success
      router.push('/dashboard?petCreated=true')
    } catch (err) {
      console.error('Pet creation error:', err)
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="bg-white p-8 rounded-lg shadow-xl">
          <p className="text-gray-800">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">Create Your Pet</h1>
        <p className="text-center text-gray-600 mb-6">
          Give your new companion a name! It will be generated with unique genetic traits.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="petName" className="block text-sm font-medium text-gray-700 mb-2">
              Pet Name
            </label>
            <input
              id="petName"
              type="text"
              required
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              maxLength={50}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 text-lg"
              placeholder="e.g., Sparkle, Shadow, Luna"
            />
            <p className="text-xs text-gray-500 mt-1">
              Choose a unique name for your pet (max 50 characters)
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✨ Random genetic traits will be generated</li>
              <li>🎨 Visual traits (color, patterns, accessories)</li>
              <li>💫 Personality traits (friendliness, energy, curiosity)</li>
              <li>🧬 Each pet is unique based on genetics!</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-lg"
          >
            {loading ? 'Creating Your Pet...' : 'Create Pet'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Your first pet is free! You can own up to 10 pets.
          </p>
        </div>
      </div>
    </div>
  )
}
