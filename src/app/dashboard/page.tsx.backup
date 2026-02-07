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

// Dynamically import Chat Interface
const ChatInterface = dynamic(() => import('@/components/ChatInterface'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="text-gray-400">Loading chat...</div>
    </div>
  ),
})

// Dynamically import Family Tree (US-014)
const FamilyTree = dynamic(() => import('@/components/FamilyTree'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-8 rounded-lg border border-gray-700">
        <p className="text-white">Loading family tree...</p>
      </div>
    </div>
  ),
})

// Dynamically import Chess Board (US-019)
const ChessBoard = dynamic(() => import('@/components/ChessBoard'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg">
        <p className="text-gray-600">Loading chess board...</p>
      </div>
    </div>
  ),
})

// Dynamically import Engagement Panel (US-022)
const EngagementPanel = dynamic(() => import('@/components/EngagementPanel'), {
  ssr: false,
  loading: () => (
    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white">
      <p>Loading engagement data...</p>
    </div>
  ),
})

// Dynamically import Breeding Requests Panel (US-024)
const BreedingRequestsPanel = dynamic(() => import('@/components/BreedingRequestsPanel'), {
  ssr: false,
  loading: () => (
    <div className="bg-pink-50 rounded-lg p-6">
      <p>Loading breeding requests...</p>
    </div>
  ),
})

// Dynamically import AR Pet Viewer (US-005)
const ARPetViewer = dynamic(() => import('@/components/ARPetViewer'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="text-white">Loading AR viewer...</div>
    </div>
  ),
})

// Dynamically import Sync Status (US-025)
const SyncStatus = dynamic(() => import('@/components/SyncStatus'), {
  ssr: false,
  loading: () => null,
})

// Dynamically import Tutorial Overlay (US-029)
const TutorialOverlay = dynamic(() => import('@/components/TutorialOverlay'), {
  ssr: false,
  loading: () => null,
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
  isCritical: boolean // US-008: Critical state flag
  maxHealthPenalty: number // US-008: Max health penalty from recoveries
  personalitySummary?: string // US-011: Personality summary
}

interface RecoveryItem {
  id: string
  itemName: string
  description: string
  itemType: string
  quantity: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false) // US-027: Admin status
  const [successMessage, setSuccessMessage] = useState('')
  const [feedingPetId, setFeedingPetId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [recoveringPetId, setRecoveringPetId] = useState<string | null>(null) // US-008
  const [recoveryItems, setRecoveryItems] = useState<RecoveryItem[]>([]) // US-008
  const [chatOpenPetId, setChatOpenPetId] = useState<string | null>(null) // US-009
  const [familyTreePetId, setFamilyTreePetId] = useState<string | null>(null) // US-014
  const [chessOpenPetId, setChessOpenPetId] = useState<string | null>(null) // US-019
  const [arViewerPetId, setArViewerPetId] = useState<string | null>(null) // US-005: AR viewer state
  // US-023: Multi-Pet Management
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null) // For pet switcher
  const [bulkFeedingInProgress, setBulkFeedingInProgress] = useState(false)
  const [healthCheckInProgress, setHealthCheckInProgress] = useState(false)
  const [healthSummary, setHealthSummary] = useState<any>(null)
  // US-029: Tutorial state
  const [showTutorial, setShowTutorial] = useState(false)
  const [tutorialProgress, setTutorialProgress] = useState<any>(null)
  const [showBreedingInfo, setShowBreedingInfo] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/auth/login')
      return
    }

    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)

    // US-027: Check if user is an admin
    checkAdminStatus(parsedUser.id)

    // Check for success message
    const params = new URLSearchParams(window.location.search)
    if (params.get('petCreated') === 'true') {
      setSuccessMessage('Pet created successfully!')
      // Clear the URL parameter
      window.history.replaceState({}, '', '/dashboard')
    }
    if (params.get('breedSuccess') === 'true') {
      setSuccessMessage('Breeding successful! Your new pet has been born!')
      // Clear the URL parameter
      window.history.replaceState({}, '', '/dashboard')
    }

    // Fetch user's pets
    fetchPets(parsedUser.id)

    // US-008: Fetch user's recovery items
    fetchRecoveryItems(parsedUser.id)

    // US-029: Fetch tutorial progress
    fetchTutorialProgress(parsedUser.id)
  }, [router])

  // US-027: Check if user is an admin
  const checkAdminStatus = async (userId: string) => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) return

      const response = await fetch('/api/admin/skills/list', {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      // If the request succeeds, user is an admin
      setIsAdmin(response.ok && response.status !== 403)
    } catch (error) {
      // Not an admin or error occurred
      setIsAdmin(false)
    }
  }

  const fetchPets = async (userId: string) => {
    try {
      const response = await fetch(`/api/pets?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        const petsData = data.pets || []

        // US-007: Fetch warnings for each pet
        // US-011: Fetch personality summary for each pet
        const petsWithWarnings = await Promise.all(
          petsData.map(async (pet: Pet) => {
            try {
              const warningResponse = await fetch(`/api/warnings/${pet.id}`)
              const personalityResponse = await fetch(`/api/personality/${pet.id}`)

              const warningData = warningResponse.ok ? await warningResponse.json() : { warnings: [] }
              const personalityData = personalityResponse.ok ? await personalityResponse.json() : { personalitySummary: null }

              return {
                ...pet,
                warnings: warningData.warnings || [],
                personalitySummary: personalityData.personalitySummary
              }
            } catch (error) {
              console.error(`Failed to fetch data for pet ${pet.id}:`, error)
            }
            return { ...pet, warnings: [] }
          })
        )

        setPets(petsWithWarnings)

        // US-029: Track view_stats step when pets are viewed on dashboard
        if (petsWithWarnings.length > 0) {
          setTimeout(() => updateTutorialStep('view_stats'), 1000)
        }
      }
    } catch (error) {
      console.error('Failed to fetch pets:', error)
    } finally {
      setLoading(false)
    }
  }

  // US-008: Fetch user's recovery items
  const fetchRecoveryItems = async (userId: string) => {
    try {
      const response = await fetch(`/api/recovery-items/user/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setRecoveryItems(data.items || [])
      }
    } catch (error) {
      console.error('Failed to fetch recovery items:', error)
    }
  }

  // US-029: Fetch tutorial progress
  const fetchTutorialProgress = async (userId: string) => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) return

      const response = await fetch('/api/tutorial/progress', {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setTutorialProgress(data.progress)

        // Show tutorial if not completed and not skipped
        if (data.progress && !data.progress.completed && !data.progress.skipped) {
          setShowTutorial(true)
        }
      }
    } catch (error) {
      console.error('Failed to fetch tutorial progress:', error)
    }
  }

  // US-029: Handle tutorial actions
  const handleTutorialComplete = () => {
    setShowTutorial(false)
    setSuccessMessage('Tutorial completed! You earned 50 coins!')
    // Refresh pets in case tutorial created one
    if (user) {
      fetchPets(user.id)
    }
  }

  const handleTutorialSkip = () => {
    setShowTutorial(false)
  }

  // US-029: Update tutorial step
  const updateTutorialStep = async (step: string) => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token || !tutorialProgress || tutorialProgress.completed || tutorialProgress.skipped) {
        return
      }

      const response = await fetch('/api/tutorial/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ step }),
      })

      if (response.ok) {
        const data = await response.json()
        setTutorialProgress(data.progress)

        // If tutorial just completed, show reward message
        if (data.progress.completed && !tutorialProgress.completed) {
          setTimeout(() => {
            setShowTutorial(false)
            setSuccessMessage('Tutorial completed! You earned 50 coins!')
          }, 5000)
        }
      }
    } catch (error) {
      console.error('Failed to update tutorial step:', error)
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

      // US-029: Update tutorial progress
      updateTutorialStep('feed')
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

  // US-008: Handle pet recovery
  const handleRecoverPet = async (petId: string) => {
    if (!user) return

    setRecoveringPetId(petId)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await fetch('/api/pets/recover', {
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
        setErrorMessage(data.error || 'Failed to recover pet')
        return
      }

      // Refetch warnings after recovery
      const warningResponse = await fetch(`/api/warnings/${petId}`)
      const warningData = warningResponse.ok ? await warningResponse.json() : { warnings: [] }

      // Update the pet in the local state
      setPets((prevPets) =>
        prevPets.map((p) =>
          p.id === petId
            ? {
                ...p,
                health: data.pet.health,
                isCritical: data.pet.isCritical,
                maxHealthPenalty: data.pet.maxHealthPenalty,
                warnings: warningData.warnings,
              }
            : p
        )
      )

      // Refresh recovery items
      fetchRecoveryItems(user.id)

      setSuccessMessage(data.message)
    } catch (error) {
      console.error('Failed to recover pet:', error)
      setErrorMessage('An error occurred while recovering your pet')
    } finally {
      setRecoveringPetId(null)
    }
  }

  // US-023: Bulk feed all pets
  const handleFeedAllPets = async () => {
    if (!user) return

    setBulkFeedingInProgress(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await fetch('/api/pets/feed-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.error || 'Failed to feed pets')
        return
      }

      // Refresh pets to show updated stats
      await fetchPets(user.id)

      const { results } = data
      const messages = []
      if (results.successful.length > 0) {
        messages.push(`✅ Fed ${results.successful.length} pet(s) successfully`)
      }
      if (results.failed.length > 0) {
        messages.push(`❌ Failed to feed ${results.failed.length} pet(s)`)
      }
      if (results.skipped.length > 0) {
        messages.push(`⏭️ Skipped ${results.skipped.length} pet(s) (Critical state or cooldown)`)
      }

      setSuccessMessage(messages.join(' • '))
    } catch (error) {
      console.error('Failed to feed all pets:', error)
      setErrorMessage('An error occurred while feeding your pets')
    } finally {
      setBulkFeedingInProgress(false)
    }
  }

  // US-023: Check all pets' health
  const handleCheckAllHealth = async () => {
    if (!user) return

    setHealthCheckInProgress(true)
    setErrorMessage('')

    try {
      const response = await fetch(`/api/pets/health-check-all?userId=${user.id}`)
      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.error || 'Failed to check pet health')
        return
      }

      setHealthSummary(data.summary)
      setSuccessMessage(`Health check complete: ${data.summary.healthyCount}/${data.summary.totalPets} pets are healthy`)
    } catch (error) {
      console.error('Failed to check pet health:', error)
      setErrorMessage('An error occurred while checking pet health')
    } finally {
      setHealthCheckInProgress(false)
    }
  }

  // US-023: Handle pet selection from dropdown
  const handlePetSelection = (petId: string) => {
    setSelectedPetId(petId)
    // Scroll to the selected pet card
    const petElement = document.getElementById(`pet-card-${petId}`)
    if (petElement) {
      petElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Briefly highlight the selected pet
      petElement.classList.add('ring-4', 'ring-purple-500')
      setTimeout(() => {
        petElement.classList.remove('ring-4', 'ring-purple-500')
      }, 2000)
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
              <Link
                href="/marketplace"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                🛒 Skill Marketplace
              </Link>
              <Link
                href="/friends"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                👥 Friends
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition font-semibold"
                >
                  🔧 Admin
                </Link>
              )}
              <Link
                href="/settings/privacy"
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                🔒 Privacy
              </Link>
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

        {/* US-022: Daily Engagement Panel */}
        <div className="mb-8">
          <EngagementPanel userId={user.id} />
        </div>

        {/* US-024: Breeding Requests Panel */}
        <BreedingRequestsPanel />

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Your Pets</h2>
          <div className="flex gap-3">
            {pets.length < 10 && (
              <Link
                href="/pets/create"
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
              >
                + Create Pet
              </Link>
            )}
            {pets.length >= 2 && (
              <Link
                href="/breed"
                className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition font-semibold"
              >
                🐣 Breed Pets
              </Link>
            )}
            {/* US-029: Breeding info button for tutorial */}
            <button
              onClick={() => {
                setShowBreedingInfo(true);
                updateTutorialStep('learn_breeding');
              }}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
            >
              🧬 Learn About Breeding
            </button>
          </div>
        </div>

        {/* US-023: Multi-Pet Management Controls */}
        {pets.length > 1 && (
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Multi-Pet Management</h3>
            <div className="flex flex-col md:flex-row gap-4">
              {/* Pet Switcher Dropdown */}
              <div className="flex-1">
                <label htmlFor="pet-switcher" className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Switch to Pet:
                </label>
                <select
                  id="pet-switcher"
                  value={selectedPetId || ''}
                  onChange={(e) => handlePetSelection(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">-- Select a pet --</option>
                  {pets.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name} (Gen {pet.generation}) - Health: {pet.health}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bulk Actions */}
              <div className="flex gap-3 items-end">
                <button
                  onClick={handleFeedAllPets}
                  disabled={bulkFeedingInProgress}
                  className={`px-6 py-2 rounded-lg font-semibold transition ${
                    bulkFeedingInProgress
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {bulkFeedingInProgress ? '🔄 Feeding...' : '🍖 Feed All'}
                </button>
                <button
                  onClick={handleCheckAllHealth}
                  disabled={healthCheckInProgress}
                  className={`px-6 py-2 rounded-lg font-semibold transition ${
                    healthCheckInProgress
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {healthCheckInProgress ? '🔄 Checking...' : '🏥 Check All Health'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* US-023: Health Summary Display */}
        {healthSummary && (
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Health Check Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Healthy Pets */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">✅</span>
                  <span className="text-2xl font-bold text-green-700">{healthSummary.healthyCount}</span>
                </div>
                <h4 className="font-semibold text-green-800">Healthy</h4>
                {healthSummary.healthy.length > 0 && (
                  <ul className="mt-2 text-xs text-green-700">
                    {healthSummary.healthy.slice(0, 3).map((pet: any) => (
                      <li key={pet.id}>• {pet.name}</li>
                    ))}
                    {healthSummary.healthy.length > 3 && (
                      <li>• +{healthSummary.healthy.length - 3} more</li>
                    )}
                  </ul>
                )}
              </div>

              {/* Warning Pets */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">⚠️</span>
                  <span className="text-2xl font-bold text-yellow-700">{healthSummary.warning.length}</span>
                </div>
                <h4 className="font-semibold text-yellow-800">Need Attention</h4>
                {healthSummary.warning.length > 0 && (
                  <ul className="mt-2 text-xs text-yellow-700">
                    {healthSummary.warning.slice(0, 3).map((pet: any) => (
                      <li key={pet.id}>• {pet.name}: {pet.issues.join(', ')}</li>
                    ))}
                    {healthSummary.warning.length > 3 && (
                      <li>• +{healthSummary.warning.length - 3} more</li>
                    )}
                  </ul>
                )}
              </div>

              {/* Critical Pets */}
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">🚨</span>
                  <span className="text-2xl font-bold text-red-700">{healthSummary.critical.length}</span>
                </div>
                <h4 className="font-semibold text-red-800">Critical</h4>
                {healthSummary.critical.length > 0 && (
                  <ul className="mt-2 text-xs text-red-700">
                    {healthSummary.critical.slice(0, 3).map((pet: any) => (
                      <li key={pet.id}>• {pet.name} (Health: {pet.health})</li>
                    ))}
                    {healthSummary.critical.length > 3 && (
                      <li>• +{healthSummary.critical.length - 3} more</li>
                    )}
                  </ul>
                )}
              </div>
            </div>
            <button
              onClick={() => setHealthSummary(null)}
              className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              Close Summary
            </button>
          </div>
        )}

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
                <div key={pet.id} id={`pet-card-${pet.id}`} className={`bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition ${pet.isCritical ? 'border-4 border-red-500' : ''}`}>
                  {/* US-008: Critical State Banner */}
                  {pet.isCritical && (
                    <div className="mb-4 p-4 bg-red-600 text-white rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">💀</span>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold">CRITICAL STATE</h4>
                          <p className="text-sm text-red-100">Your pet needs immediate recovery!</p>
                        </div>
                      </div>
                      {recoveryItems.length > 0 ? (
                        <button
                          onClick={() => handleRecoverPet(pet.id)}
                          disabled={recoveringPetId === pet.id}
                          className={`w-full px-4 py-3 rounded-lg font-semibold transition ${
                            recoveringPetId === pet.id
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-white text-red-600 hover:bg-red-50'
                          }`}
                        >
                          {recoveringPetId === pet.id ? 'Recovering...' : `💊 Use Health Potion (${recoveryItems.find(i => i.itemName === 'Health Potion')?.quantity || 0} available)`}
                        </button>
                      ) : (
                        <div className="text-sm text-red-100">
                          No recovery items available. Purchase from marketplace (coming soon).
                        </div>
                      )}
                      {pet.maxHealthPenalty > 0 && (
                        <div className="mt-2 text-xs text-red-100">
                          ⚠️ Max health reduced by {pet.maxHealthPenalty}% due to previous recoveries
                        </div>
                      )}
                    </div>
                  )}

                  {/* US-007: Warning notifications */}
                  {pet.warnings && pet.warnings.length > 0 && !pet.isCritical && (
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

                {/* Feed Button - US-008: Disabled when Critical */}
                <div className="mt-4">
                  <button
                    onClick={() => handleFeedPet(pet.id)}
                    disabled={feedingPetId === pet.id || pet.isCritical}
                    className={`w-full px-4 py-3 rounded-lg font-semibold transition ${
                      feedingPetId === pet.id || pet.isCritical
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                    title={pet.isCritical ? 'Pet must be recovered before feeding' : ''}
                  >
                    {feedingPetId === pet.id ? 'Feeding...' : pet.isCritical ? '❌ Cannot Feed (Critical)' : '🍖 Feed Pet'}
                  </button>
                </div>

                {/* Chat Interface - US-009 */}
                <div className="mt-4">
                  <button
                    onClick={() => setChatOpenPetId(chatOpenPetId === pet.id ? null : pet.id)}
                    disabled={pet.isCritical}
                    className={`w-full px-4 py-3 rounded-lg font-semibold transition ${
                      pet.isCritical
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : chatOpenPetId === pet.id
                        ? 'bg-gray-600 text-white hover:bg-gray-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                    title={pet.isCritical ? 'Pet must be recovered before chatting' : ''}
                  >
                    {pet.isCritical ? '❌ Cannot Chat (Critical)' : chatOpenPetId === pet.id ? '▼ Close Chat' : '💬 Chat with ' + pet.name}
                  </button>
                </div>

                {chatOpenPetId === pet.id && user && (
                  <div className="mt-4">
                    <ChatInterface petId={pet.id} petName={pet.name} userId={user.id} />
                  </div>
                )}

                {/* Play Chess Button - US-019: Only show if pet has Chess Master skill */}
                {pet.petSkills.some(ps => ps.skill.skillName === 'Chess Master') && (
                  <div className="mt-4">
                    <button
                      onClick={() => setChessOpenPetId(chessOpenPetId === pet.id ? null : pet.id)}
                      disabled={pet.isCritical}
                      className={`w-full px-4 py-3 rounded-lg font-semibold transition ${
                        pet.isCritical
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : chessOpenPetId === pet.id
                          ? 'bg-gray-600 text-white hover:bg-gray-700'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                      title={pet.isCritical ? 'Pet must be recovered before playing chess' : ''}
                    >
                      {pet.isCritical ? '❌ Cannot Play (Critical)' : chessOpenPetId === pet.id ? '▼ Close Chess' : '♟️ Play Chess'}
                    </button>
                  </div>
                )}

                {/* View Family Tree Button - US-014 */}
                <div className="mt-4">
                  <button
                    onClick={() => setFamilyTreePetId(pet.id)}
                    className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
                  >
                    🌳 View Lineage
                  </button>
                </div>

                {/* View in AR Button - US-005 */}
                <div className="mt-4">
                  <button
                    onClick={() => setArViewerPetId(pet.id)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg font-semibold hover:from-pink-700 hover:to-purple-700 transition shadow-lg"
                  >
                    🔮 View in AR
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

                {/* Personality Traits - US-011: Enhanced with summary and visual bars */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Personality Profile</h4>

                  {/* Personality Summary Badge */}
                  {pet.personalitySummary && (
                    <div className="mb-3 p-2 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                      <p className="text-sm text-purple-800 font-medium text-center italic">
                        "{pet.personalitySummary}"
                      </p>
                    </div>
                  )}

                  {/* Personality Trait Bars */}
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 font-medium">😊 Friendliness</span>
                        <span className="font-semibold text-purple-600">{pet.friendliness}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-purple-400 to-purple-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${pet.friendliness}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 font-medium">⚡ Energy</span>
                        <span className="font-semibold text-yellow-600">{pet.energyTrait}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${pet.energyTrait}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 font-medium">🔍 Curiosity</span>
                        <span className="font-semibold text-blue-600">{pet.curiosity}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-blue-400 to-blue-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${pet.curiosity}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 font-medium">🕰️ Patience</span>
                        <span className="font-semibold text-teal-600">{pet.patience}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-teal-400 to-teal-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${pet.patience}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 font-medium">🎮 Playfulness</span>
                        <span className="font-semibold text-pink-600">{pet.playfulness}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-pink-400 to-pink-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${pet.playfulness}%` }}
                        />
                      </div>
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

      {/* Family Tree Modal - US-014 */}
      {familyTreePetId && (
        <FamilyTree
          petId={familyTreePetId}
          onClose={() => setFamilyTreePetId(null)}
        />
      )}

      {/* Chess Game Modal - US-019 */}
      {chessOpenPetId && user && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <ChessBoard
            petId={chessOpenPetId}
            userId={user.id}
            onClose={() => setChessOpenPetId(null)}
          />
        </div>
      )}

      {/* AR Pet Viewer - US-005, US-020 */}
      {arViewerPetId && user && (
        <ARPetViewer
          traitNames={
            pets
              .find(p => p.id === arViewerPetId)
              ?.petTraits.filter(pt => pt.trait.traitType === 'visual')
              .map(pt => pt.trait.traitName) || []
          }
          health={pets.find(p => p.id === arViewerPetId)?.health || 100}
          petName={pets.find(p => p.id === arViewerPetId)?.name || 'Pet'}
          petId={parseInt(arViewerPetId)}
          userId={user.id}
          onClose={() => setArViewerPetId(null)}
          onFeed={() => {
            // Refresh pets after feeding
            fetchPets(user.id);
          }}
          onChat={async (message: string) => {
            // Send message to chat API
            const response = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ petId: parseInt(arViewerPetId), userId: user.id, message })
            });
            const data = await response.json();
            return data.response || 'Sorry, I could not respond.';
          }}
        />
      )}

      {/* US-025: Cross-Platform Sync Status */}
      <SyncStatus userId={user.id} />

      {/* US-029: Tutorial Overlay */}
      {showTutorial && user && (
        <TutorialOverlay
          userId={user.id}
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialSkip}
        />
      )}

      {/* US-029: Breeding Info Modal */}
      {showBreedingInfo && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
            <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white p-6">
              <h2 className="text-2xl font-bold">🧬 How Breeding Works</h2>
            </div>
            <div className="p-8 space-y-4">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-800">Genetic Inheritance</h3>
                <p className="text-gray-600">
                  When you breed two pets, their offspring inherits genetic traits from both parents:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li><strong>50% from Parent 1, 50% from Parent 2</strong> - Traits are randomly selected from each parent</li>
                  <li><strong>15% Mutation Chance</strong> - Each trait has a chance to mutate into something new and unique</li>
                  <li><strong>Rarity Distribution</strong> - Legendary traits (5%), Rare (10%), Uncommon (25%), Common (60%)</li>
                  <li><strong>Personality Averaging</strong> - Personality traits are averaged from both parents with ±15 variance</li>
                </ul>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <h3 className="text-lg font-semibold text-gray-800">Breeding Requirements</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li><strong>Age:</strong> Both pets must be at least 7 days old</li>
                  <li><strong>Health:</strong> Both pets must have health above 50</li>
                  <li><strong>Cooldown:</strong> 7-day cooldown period between breeding sessions</li>
                  <li><strong>Pet Limit:</strong> You can own up to 10 pets at once (MVP)</li>
                </ul>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <h3 className="text-lg font-semibold text-gray-800">Getting Started</h3>
                <p className="text-gray-600">
                  To breed your first pet, create at least two pets and ensure they meet the requirements above.
                  Then click the "🐣 Breed Pets" button to select parents and create offspring with unique genetic combinations!
                </p>
              </div>

              <div className="pt-6 flex justify-end">
                <button
                  onClick={() => setShowBreedingInfo(false)}
                  className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition font-semibold"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
