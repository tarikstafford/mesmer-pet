'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PetCreationForm from '@/components/PetCreationForm'

export default function CreatePetPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    // Get userId from localStorage (where JWT is stored)
    const token = localStorage.getItem('authToken')
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

  const handleSubmit = async (petName: string) => {
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
        <div className="bg-white/80 backdrop-blur-lg p-8 rounded-3xl shadow-2xl">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            <p className="text-gray-800 font-medium">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 bg-white/90 backdrop-blur-xl p-10 rounded-3xl shadow-2xl w-full max-w-lg border border-white/20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl mb-4 shadow-lg shadow-purple-500/50">
            <span className="text-4xl">✨</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-transparent bg-clip-text mb-3">
            Create Your Pet
          </h1>
          <p className="text-gray-600 text-lg">
            Give your new companion a name! It will be generated with unique genetic traits.
          </p>
        </div>

        {/* Form Component */}
        <PetCreationForm
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
        />

        {/* Footer */}
        <div className="mt-8 space-y-4">
          <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl">
            <p className="text-green-800 font-bold text-sm flex items-center justify-center gap-2">
              <span className="text-xl">🎁</span>
              Your first pet is free! You can own up to 10 pets.
            </p>
          </div>

          <div className="text-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold transition"
            >
              <span>←</span>
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
