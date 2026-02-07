'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Dynamically import 3D model to avoid SSR issues
const PetModel3D = dynamic(() => import('@/components/PetModel3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="text-gray-400">Loading 3D model...</div>
    </div>
  ),
})

interface Trait {
  id: string
  traitName: string
  traitType: string
  rarity: string
  description: string
}

interface PetTrait {
  trait: Trait
  inheritanceSource: string
}

interface Pet {
  id: string
  name: string
  health: number
  hunger: number
  happiness: number
  energy: number
  friendliness: number
  energyTrait: number
  curiosity: number
  patience: number
  playfulness: number
  generation: number
  createdAt: string
  petTraits: PetTrait[]
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/auth/login')
      return
    }

    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)

    // Check for success message
    const params = new URLSearchParams(window.location.search)
    if (params.get('petCreated') === 'true') {
      setSuccessMessage('Pet created successfully!')
      // Clear the URL parameter
      window.history.replaceState({}, '', '/dashboard')
    }

    // Fetch user's pets
    fetchPets(parsedUser.id)
  }, [router])

  const fetchPets = async (userId: string) => {
    try {
      const response = await fetch(`/api/pets?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setPets(data.pets || [])
      }
    } catch (error) {
      console.error('Failed to fetch pets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    router.push('/')
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'text-yellow-600 bg-yellow-100'
      case 'rare':
        return 'text-purple-600 bg-purple-100'
      case 'uncommon':
        return 'text-blue-600 bg-blue-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (!user || loading) {
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
        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {successMessage}
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Your Pets</h2>
          {pets.length < 10 && (
            <Link
              href="/pets/create"
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
            >
              + Create Pet
            </Link>
          )}
        </div>

        {pets.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-6xl mb-4">🐾</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No pets yet!</h3>
            <p className="text-gray-600 mb-6">
              Create your first AI-powered AR pet and start your adventure.
            </p>
            <Link
              href="/pets/create"
              className="inline-block px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
            >
              Create Your First Pet
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map((pet) => {
              const visualTraitNames = pet.petTraits
                .filter((pt) => pt.trait.traitType === 'visual')
                .map((pt) => pt.trait.traitName);

              return (
                <div key={pet.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
                  {/* 3D Pet Model */}
                  <div className="mb-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg overflow-hidden">
                    <Suspense fallback={<div className="w-full h-64 flex items-center justify-center"><div className="text-gray-400">Loading...</div></div>}>
                      <PetModel3D traitNames={visualTraitNames} width={350} height={280} autoRotate={true} />
                    </Suspense>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-2xl font-bold text-gray-800">{pet.name}</h3>
                    <p className="text-sm text-gray-500">Generation {pet.generation}</p>
                  </div>

                {/* Stats */}
                <div className="space-y-2 mb-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Health</span>
                      <span className="font-semibold text-green-600">{pet.health}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${pet.health}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Happiness</span>
                      <span className="font-semibold text-yellow-600">{pet.happiness}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ width: `${pet.happiness}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Energy</span>
                      <span className="font-semibold text-blue-600">{pet.energy}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${pet.energy}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Hunger</span>
                      <span className="font-semibold text-red-600">{pet.hunger}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${pet.hunger}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Traits */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Genetic Traits</h4>
                  <div className="flex flex-wrap gap-2">
                    {pet.petTraits.slice(0, 4).map((petTrait) => (
                      <span
                        key={petTrait.trait.id}
                        className={`text-xs px-2 py-1 rounded-full font-semibold ${getRarityColor(
                          petTrait.trait.rarity
                        )}`}
                        title={petTrait.trait.description}
                      >
                        {petTrait.trait.traitName}
                      </span>
                    ))}
                    {pet.petTraits.length > 4 && (
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-semibold">
                        +{pet.petTraits.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Created date */}
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-500">
                    Created {new Date(pet.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              );
            })}
          </div>
        )}

        {pets.length >= 10 && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              <strong>Maximum pet limit reached!</strong> You can own up to 10 pets in MVP.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
