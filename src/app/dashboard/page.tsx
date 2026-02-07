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

interface Skill {
  id: string
  skillName: string
  category: string
  description: string
}

interface PetSkill {
  skill: Skill
  proficiency: number
  activatedDate: string
}

interface PetWarning {
  type: string
  severity: string
  message: string
  timestamp: string
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
  parent1Id: string | null
  parent2Id: string | null
  createdAt: string
  lastInteractionAt: string | null
  petTraits: PetTrait[]
  petSkills: PetSkill[]
  warnings?: PetWarning[] // US-007: Active warnings for this pet
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState('')
  const [feedingPetId, setFeedingPetId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

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
        const petsData = data.pets || []

        // US-007: Fetch warnings for each pet
        const petsWithWarnings = await Promise.all(
          petsData.map(async (pet: Pet) => {
            try {
              const warningResponse = await fetch(`/api/warnings/${pet.id}`)
              if (warningResponse.ok) {
                const warningData = await warningResponse.json()
                return { ...pet, warnings: warningData.warnings || [] }
              }
            } catch (error) {
              console.error(`Failed to fetch warnings for pet ${pet.id}:`, error)
            }
            return { ...pet, warnings: [] }
          })
        )

        setPets(petsWithWarnings)
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

  // Color-code stats based on value: green >70, yellow 40-70, red <40
  const getStatColor = (value: number) => {
    if (value > 70) return { bar: 'bg-green-500', text: 'text-green-600' }
    if (value >= 40) return { bar: 'bg-yellow-500', text: 'text-yellow-600' }
    return { bar: 'bg-red-500', text: 'text-red-600' }
  }

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return 'Never'
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const handleFeedPet = async (petId: string) => {
    if (!user) return

    setFeedingPetId(petId)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await fetch('/api/pets/feed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          petId,
          userId: user.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.error || 'Failed to feed pet')
        return
      }

      // US-007: Refetch warnings after feeding
      const warningResponse = await fetch(`/api/warnings/${petId}`)
      const warningData = warningResponse.ok ? await warningResponse.json() : { warnings: [] }

      // Update the pet in the local state
      setPets((prevPets) =>
        prevPets.map((p) =>
          p.id === petId
            ? {
                ...p,
                hunger: data.pet.hunger,
                happiness: data.pet.happiness,
                health: data.pet.health,
                warnings: warningData.warnings,
              }
            : p
        )
      )
      setSuccessMessage(data.message)
    } catch (error) {
      console.error('Failed to feed pet:', error)
      setErrorMessage('An error occurred while feeding your pet')
    } finally {
      setFeedingPetId(null)
    }
  }

  // US-007: Get warning styling
  const getWarningStyle = (severity: string) => {
    if (severity === 'critical') {
      return {
        bg: 'bg-red-100',
        border: 'border-red-400',
        text: 'text-red-900',
        icon: '🚨',
      }
    }
    return {
      bg: 'bg-yellow-100',
      border: 'border-yellow-400',
      text: 'text-yellow-900',
      icon: '⚠️',
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

        {errorMessage && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {errorMessage}
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
                  {/* US-007: Warning notifications */}
                  {pet.warnings && pet.warnings.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {pet.warnings.map((warning, index) => {
                        const style = getWarningStyle(warning.severity)
                        return (
                          <div
                            key={index}
                            className={`p-3 ${style.bg} border ${style.border} ${style.text} rounded-lg text-sm font-semibold flex items-center gap-2`}
                          >
                            <span className="text-lg">{style.icon}</span>
                            <span>{warning.message}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* 3D Pet Model - US-007: Pass health for sick appearance */}
                  <div className="mb-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg overflow-hidden">
                    <Suspense fallback={<div className="w-full h-64 flex items-center justify-center"><div className="text-gray-400">Loading...</div></div>}>
                      <PetModel3D traitNames={visualTraitNames} health={pet.health} width={350} height={280} autoRotate={true} />
                    </Suspense>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-2xl font-bold text-gray-800">{pet.name}</h3>
                    <p className="text-sm text-gray-500">Generation {pet.generation}</p>
                  </div>

                {/* Stats with dynamic color-coding */}
                <div className="space-y-2 mb-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Health</span>
                      <span className={`font-semibold ${getStatColor(pet.health).text}`}>{pet.health}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${getStatColor(pet.health).bar} h-2 rounded-full transition-all`}
                        style={{ width: `${pet.health}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Happiness</span>
                      <span className={`font-semibold ${getStatColor(pet.happiness).text}`}>{pet.happiness}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${getStatColor(pet.happiness).bar} h-2 rounded-full transition-all`}
                        style={{ width: `${pet.happiness}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Energy</span>
                      <span className={`font-semibold ${getStatColor(pet.energy).text}`}>{pet.energy}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${getStatColor(pet.energy).bar} h-2 rounded-full transition-all`}
                        style={{ width: `${pet.energy}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Hunger</span>
                      <span className={`font-semibold ${getStatColor(100 - pet.hunger).text}`}>{pet.hunger}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${getStatColor(100 - pet.hunger).bar} h-2 rounded-full transition-all`}
                        style={{ width: `${pet.hunger}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Feed Button */}
                <div className="mt-4">
                  <button
                    onClick={() => handleFeedPet(pet.id)}
                    disabled={feedingPetId === pet.id}
                    className={`w-full px-4 py-3 rounded-lg font-semibold transition ${
                      feedingPetId === pet.id
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {feedingPetId === pet.id ? 'Feeding...' : '🍖 Feed Pet'}
                  </button>
                </div>

                {/* Visual Traits */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Visual Traits</h4>
                  <div className="flex flex-wrap gap-2">
                    {pet.petTraits.filter(pt => pt.trait.traitType === 'visual').slice(0, 4).map((petTrait) => (
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
                  </div>
                </div>

                {/* Personality Traits */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Personality</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Friendliness:</span>
                      <span className="font-semibold">{pet.friendliness}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Energy:</span>
                      <span className="font-semibold">{pet.energyTrait}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Curiosity:</span>
                      <span className="font-semibold">{pet.curiosity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Patience:</span>
                      <span className="font-semibold">{pet.patience}</span>
                    </div>
                    <div className="flex justify-between col-span-2">
                      <span className="text-gray-600">Playfulness:</span>
                      <span className="font-semibold">{pet.playfulness}</span>
                    </div>
                  </div>
                </div>

                {/* Active Skills */}
                {pet.petSkills.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Active Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {pet.petSkills.map((petSkill) => (
                        <span
                          key={petSkill.skill.id}
                          className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold"
                          title={`${petSkill.skill.description} (Proficiency: ${petSkill.proficiency})`}
                        >
                          {petSkill.skill.skillName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lineage and timestamps */}
                <div className="mt-4 pt-4 border-t space-y-1">
                  <p className="text-xs text-gray-500">
                    <span className="font-semibold">Generation:</span> {pet.generation}
                    {(pet.parent1Id || pet.parent2Id) && (
                      <span className="ml-2 text-gray-400">(Bred from parents)</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    <span className="font-semibold">Created:</span> {new Date(pet.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    <span className="font-semibold">Last interaction:</span> {formatTimestamp(pet.lastInteractionAt)}
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
