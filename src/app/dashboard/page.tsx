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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
          <div className="text-white text-lg">Loading your pets...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Modern Navigation */}
      <nav className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-purple-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl font-bold">M</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 text-transparent bg-clip-text">
                Mesmer
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/marketplace"
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full hover:from-purple-600 hover:to-indigo-600 transition font-medium shadow-lg shadow-purple-500/30"
              >
                🛒 Marketplace
              </Link>
              <Link
                href="/friends"
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full hover:from-blue-600 hover:to-cyan-600 transition font-medium shadow-lg shadow-blue-500/30"
              >
                👥 Friends
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-full hover:from-orange-600 hover:to-red-700 transition font-semibold shadow-lg shadow-orange-500/30"
                >
                  🔧 Admin
                </Link>
              )}
              <Link
                href="/settings/privacy"
                className="px-4 py-2 bg-white/50 backdrop-blur-sm border border-gray-300 text-gray-700 rounded-full hover:bg-white/80 transition font-medium"
              >
                🔒 Privacy
              </Link>
              <div className="hidden md:block px-4 py-2 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full">
                <span className="text-gray-700 font-medium">👋 {user.name || user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-full hover:from-red-600 hover:to-pink-700 transition font-medium shadow-lg shadow-red-500/30"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-2xl shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">✓</span>
              </div>
              <span className="text-green-800 font-medium">{successMessage}</span>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-300 rounded-2xl shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">✕</span>
              </div>
              <span className="text-red-800 font-medium">{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Daily Engagement Panel */}
        <div className="mb-8">
          <EngagementPanel userId={user.id} />
        </div>

        {/* Breeding Requests Panel */}
        <BreedingRequestsPanel />

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-transparent bg-clip-text mb-2">
              Your Pets
            </h2>
            <p className="text-gray-600">Manage and interact with your AI companions</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {pets.length < 10 && (
              <Link
                href="/pets/create"
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full hover:from-pink-600 hover:to-purple-600 transition font-semibold shadow-lg shadow-purple-500/40 hover:scale-105"
              >
                ✨ Create Pet
              </Link>
            )}
            {pets.length >= 2 && (
              <Link
                href="/breed"
                className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full hover:from-rose-600 hover:to-pink-600 transition font-semibold shadow-lg shadow-pink-500/40 hover:scale-105"
              >
                🐣 Breed Pets
              </Link>
            )}
            <button
              onClick={() => {
                setShowBreedingInfo(true);
                updateTutorialStep('learn_breeding');
              }}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full hover:from-indigo-600 hover:to-purple-600 transition font-semibold shadow-lg shadow-indigo-500/40 hover:scale-105"
            >
              🧬 Learn Breeding
            </button>
          </div>
        </div>

        {/* Multi-Pet Management Controls - US-023 */}
        {pets.length > 1 && (
          <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-purple-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">🎮</span>
              Multi-Pet Management
            </h3>
            <div className="flex flex-col md:flex-row gap-4">
              {/* Pet Switcher Dropdown */}
              <div className="flex-1">
                <label htmlFor="pet-switcher" className="block text-sm font-semibold text-gray-700 mb-2">
                  Quick Switch to Pet:
                </label>
                <select
                  id="pet-switcher"
                  value={selectedPetId || ''}
                  onChange={(e) => handlePetSelection(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition"
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
                  className={`px-6 py-3 rounded-xl font-semibold transition shadow-lg ${
                    bulkFeedingInProgress
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-green-500/40 hover:scale-105'
                  }`}
                >
                  {bulkFeedingInProgress ? '🔄 Feeding...' : '🍖 Feed All'}
                </button>
                <button
                  onClick={handleCheckAllHealth}
                  disabled={healthCheckInProgress}
                  className={`px-6 py-3 rounded-xl font-semibold transition shadow-lg ${
                    healthCheckInProgress
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 shadow-blue-500/40 hover:scale-105'
                  }`}
                >
                  {healthCheckInProgress ? '🔄 Checking...' : '🏥 Check All Health'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Health Summary Display - US-023 */}
        {healthSummary && (
          <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-purple-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Health Check Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Healthy Pets */}
              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl shadow-lg hover:shadow-xl transition">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">✅</span>
                  <span className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 text-transparent bg-clip-text">{healthSummary.healthyCount}</span>
                </div>
                <h4 className="font-bold text-green-800 mb-2">Healthy</h4>
                {healthSummary.healthy.length > 0 && (
                  <ul className="mt-2 text-xs text-green-700 space-y-1">
                    {healthSummary.healthy.slice(0, 3).map((pet: any) => (
                      <li key={pet.id} className="font-medium">• {pet.name}</li>
                    ))}
                    {healthSummary.healthy.length > 3 && (
                      <li className="font-semibold">• +{healthSummary.healthy.length - 3} more</li>
                    )}
                  </ul>
                )}
              </div>

              {/* Warning Pets */}
              <div className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl shadow-lg hover:shadow-xl transition">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">⚠️</span>
                  <span className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 text-transparent bg-clip-text">{healthSummary.warning.length}</span>
                </div>
                <h4 className="font-bold text-yellow-800 mb-2">Need Attention</h4>
                {healthSummary.warning.length > 0 && (
                  <ul className="mt-2 text-xs text-yellow-700 space-y-1">
                    {healthSummary.warning.slice(0, 3).map((pet: any) => (
                      <li key={pet.id} className="font-medium">• {pet.name}: {pet.issues.join(', ')}</li>
                    ))}
                    {healthSummary.warning.length > 3 && (
                      <li className="font-semibold">• +{healthSummary.warning.length - 3} more</li>
                    )}
                  </ul>
                )}
              </div>

              {/* Critical Pets */}
              <div className="p-6 bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-300 rounded-2xl shadow-lg hover:shadow-xl transition">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">🚨</span>
                  <span className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 text-transparent bg-clip-text">{healthSummary.critical.length}</span>
                </div>
                <h4 className="font-bold text-red-800 mb-2">Critical</h4>
                {healthSummary.critical.length > 0 && (
                  <ul className="mt-2 text-xs text-red-700 space-y-1">
                    {healthSummary.critical.slice(0, 3).map((pet: any) => (
                      <li key={pet.id} className="font-medium">• {pet.name} (Health: {pet.health})</li>
                    ))}
                    {healthSummary.critical.length > 3 && (
                      <li className="font-semibold">• +{healthSummary.critical.length - 3} more</li>
                    )}
                  </ul>
                )}
              </div>
            </div>
            <button
              onClick={() => setHealthSummary(null)}
              className="w-full px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition font-semibold border border-gray-300"
            >
              Close Summary
            </button>
          </div>
        )}

        {/* Empty State or Pet Cards Grid */}
        {pets.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-12 text-center border border-purple-100">
            <div className="text-8xl mb-6 animate-bounce">🐾</div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 text-transparent bg-clip-text mb-4">No pets yet!</h3>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
              Create your first AI-powered AR pet and start your adventure with a unique companion.
            </p>
            <Link
              href="/pets/create"
              className="inline-block px-10 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full hover:from-pink-600 hover:to-purple-600 transition font-bold text-lg shadow-lg shadow-purple-500/40 hover:scale-105"
            >
              ✨ Create Your First Pet
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map((pet) => {
              const visualTraitNames = pet.petTraits
                .filter((pt) => pt.trait.traitType === 'visual')
                .map((pt) => pt.trait.traitName);

              return (
                <div
                  key={pet.id}
                  id={`pet-card-${pet.id}`}
                  className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] overflow-hidden ${
                    pet.isCritical ? 'ring-4 ring-red-500 ring-opacity-70' : 'border border-purple-100'
                  }`}
                >
                  <div className="p-6">
                    {/* Critical State Banner */}
                    {pet.isCritical && (
                      <div className="mb-6 p-5 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-2xl shadow-lg">
                        <div className="flex items-center gap-4 mb-4">
                          <span className="text-4xl animate-pulse">💀</span>
                          <div className="flex-1">
                            <h4 className="text-xl font-bold">CRITICAL STATE</h4>
                            <p className="text-sm text-red-100">Immediate recovery needed!</p>
                          </div>
                        </div>
                        {recoveryItems.length > 0 ? (
                          <button
                            onClick={() => handleRecoverPet(pet.id)}
                            disabled={recoveringPetId === pet.id}
                            className={`w-full px-4 py-3 rounded-xl font-bold transition ${
                              recoveringPetId === pet.id
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-white text-red-600 hover:bg-red-50 shadow-lg'
                            }`}
                          >
                            {recoveringPetId === pet.id ? '🔄 Recovering...' : `💊 Use Health Potion (${recoveryItems.find(i => i.itemName === 'Health Potion')?.quantity || 0} available)`}
                          </button>
                        ) : (
                          <div className="text-sm text-red-100 bg-red-700/30 p-3 rounded-lg">
                            No recovery items available. Purchase from marketplace.
                          </div>
                        )}
                        {pet.maxHealthPenalty > 0 && (
                          <div className="mt-3 text-xs text-red-100 bg-red-700/30 p-2 rounded-lg">
                            ⚠️ Max health reduced by {pet.maxHealthPenalty}% due to previous recoveries
                          </div>
                        )}
                      </div>
                    )}

                    {/* Warning Notifications */}
                    {pet.warnings && pet.warnings.length > 0 && !pet.isCritical && (
                      <div className="mb-4 space-y-2">
                        {pet.warnings.map((warning, index) => {
                          const style = getWarningStyle(warning.severity)
                          return (
                            <div
                              key={index}
                              className={`p-3 ${style.bg} border-2 ${style.border} ${style.text} rounded-xl text-sm font-bold flex items-center gap-3 shadow-sm`}
                            >
                              <span className="text-xl">{style.icon}</span>
                              <span>{warning.message}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* 3D Pet Model */}
                    <div className="mb-6 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-2xl overflow-hidden shadow-inner border-2 border-purple-200">
                      <Suspense fallback={
                        <div className="w-full h-72 flex items-center justify-center">
                          <div className="text-gray-400 animate-pulse">Loading 3D model...</div>
                        </div>
                      }>
                        <PetModel3D traitNames={visualTraitNames} health={pet.health} width={350} height={280} autoRotate={true} />
                      </Suspense>
                    </div>

                    {/* Pet Name & Generation */}
                    <div className="mb-5">
                      <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">{pet.name}</h3>
                      <p className="text-sm text-gray-500 font-medium">Generation {pet.generation}</p>
                    </div>

                    {/* Stats */}
                    <div className="space-y-3 mb-6">
                      <div>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-gray-700 font-semibold">Health</span>
                          <span className={`font-bold ${getStatColor(pet.health).text}`}>{pet.health}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                          <div
                            className={`${getStatColor(pet.health).bar} h-3 rounded-full transition-all duration-500 shadow-sm`}
                            style={{ width: `${pet.health}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-gray-700 font-semibold">Happiness</span>
                          <span className={`font-bold ${getStatColor(pet.happiness).text}`}>{pet.happiness}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                          <div
                            className={`${getStatColor(pet.happiness).bar} h-3 rounded-full transition-all duration-500 shadow-sm`}
                            style={{ width: `${pet.happiness}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-gray-700 font-semibold">Energy</span>
                          <span className={`font-bold ${getStatColor(pet.energy).text}`}>{pet.energy}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                          <div
                            className={`${getStatColor(pet.energy).bar} h-3 rounded-full transition-all duration-500 shadow-sm`}
                            style={{ width: `${pet.energy}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-gray-700 font-semibold">Hunger</span>
                          <span className={`font-bold ${getStatColor(100 - pet.hunger).text}`}>{pet.hunger}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                          <div
                            className={`${getStatColor(100 - pet.hunger).bar} h-3 rounded-full transition-all duration-500 shadow-sm`}
                            style={{ width: `${pet.hunger}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3 mb-6">
                      {/* Feed Button */}
                      <button
                        onClick={() => handleFeedPet(pet.id)}
                        disabled={feedingPetId === pet.id || pet.isCritical}
                        className={`w-full px-4 py-3 rounded-xl font-bold transition shadow-lg ${
                          feedingPetId === pet.id || pet.isCritical
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-green-500/40 hover:scale-105'
                        }`}
                        title={pet.isCritical ? 'Pet must be recovered before feeding' : ''}
                      >
                        {feedingPetId === pet.id ? '🔄 Feeding...' : pet.isCritical ? '❌ Cannot Feed (Critical)' : '🍖 Feed Pet'}
                      </button>

                      {/* Chat Button */}
                      <button
                        onClick={() => setChatOpenPetId(chatOpenPetId === pet.id ? null : pet.id)}
                        disabled={pet.isCritical}
                        className={`w-full px-4 py-3 rounded-xl font-bold transition shadow-lg ${
                          pet.isCritical
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : chatOpenPetId === pet.id
                            ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800 shadow-gray-500/40'
                            : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 shadow-blue-500/40 hover:scale-105'
                        }`}
                        title={pet.isCritical ? 'Pet must be recovered before chatting' : ''}
                      >
                        {pet.isCritical ? '❌ Cannot Chat (Critical)' : chatOpenPetId === pet.id ? '▼ Close Chat' : '💬 Chat with ' + pet.name}
                      </button>
                    </div>

                    {/* Chat Interface */}
                    {chatOpenPetId === pet.id && user && (
                      <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200 shadow-inner">
                        <ChatInterface petId={pet.id} petName={pet.name} userId={user.id} />
                      </div>
                    )}

                    {/* Chess Button */}
                    {pet.petSkills.some(ps => ps.skill.skillName === 'Chess Master') && (
                      <div className="mb-3">
                        <button
                          onClick={() => setChessOpenPetId(chessOpenPetId === pet.id ? null : pet.id)}
                          disabled={pet.isCritical}
                          className={`w-full px-4 py-3 rounded-xl font-bold transition shadow-lg ${
                            pet.isCritical
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : chessOpenPetId === pet.id
                              ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800 shadow-gray-500/40'
                              : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 shadow-purple-500/40 hover:scale-105'
                          }`}
                          title={pet.isCritical ? 'Pet must be recovered before playing chess' : ''}
                        >
                          {pet.isCritical ? '❌ Cannot Play (Critical)' : chessOpenPetId === pet.id ? '▼ Close Chess' : '♟️ Play Chess'}
                        </button>
                      </div>
                    )}

                    {/* Additional Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {/* View Lineage Button */}
                      <button
                        onClick={() => setFamilyTreePetId(pet.id)}
                        className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-bold hover:from-indigo-600 hover:to-purple-600 transition shadow-lg shadow-indigo-500/40 hover:scale-105"
                      >
                        🌳 Lineage
                      </button>

                      {/* View in AR Button */}
                      <button
                        onClick={() => setArViewerPetId(pet.id)}
                        className="px-4 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-bold hover:from-pink-600 hover:to-rose-600 transition shadow-lg shadow-pink-500/40 hover:scale-105"
                      >
                        🔮 View AR
                      </button>
                    </div>

                    {/* Visual Traits */}
                    <div className="border-t-2 border-purple-100 pt-5 mt-5">
                      <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <span>✨</span> Visual Traits
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {pet.petTraits.filter(pt => pt.trait.traitType === 'visual').slice(0, 4).map((petTrait) => (
                          <span
                            key={petTrait.trait.id}
                            className={`text-xs px-3 py-1.5 rounded-full font-bold shadow-sm ${getRarityColor(
                              petTrait.trait.rarity
                            )}`}
                            title={petTrait.trait.description}
                          >
                            {petTrait.trait.traitName}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Personality Profile */}
                    <div className="border-t-2 border-purple-100 pt-5 mt-5">
                      <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <span>🧠</span> Personality Profile
                      </h4>

                      {/* Personality Summary */}
                      {pet.personalitySummary && (
                        <div className="mb-4 p-3 bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300 rounded-xl">
                          <p className="text-sm text-purple-900 font-semibold text-center italic">
                            "{pet.personalitySummary}"
                          </p>
                        </div>
                      )}

                      {/* Personality Trait Bars */}
                      <div className="space-y-2.5">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600 font-semibold">😊 Friendliness</span>
                            <span className="font-bold text-purple-600">{pet.friendliness}/100</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 shadow-inner">
                            <div
                              className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${pet.friendliness}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600 font-semibold">⚡ Energy</span>
                            <span className="font-bold text-yellow-600">{pet.energyTrait}/100</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 shadow-inner">
                            <div
                              className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${pet.energyTrait}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600 font-semibold">🔍 Curiosity</span>
                            <span className="font-bold text-blue-600">{pet.curiosity}/100</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 shadow-inner">
                            <div
                              className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${pet.curiosity}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600 font-semibold">🕰️ Patience</span>
                            <span className="font-bold text-teal-600">{pet.patience}/100</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 shadow-inner">
                            <div
                              className="bg-gradient-to-r from-teal-400 to-teal-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${pet.patience}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600 font-semibold">🎮 Playfulness</span>
                            <span className="font-bold text-pink-600">{pet.playfulness}/100</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 shadow-inner">
                            <div
                              className="bg-gradient-to-r from-pink-400 to-pink-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${pet.playfulness}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Active Skills */}
                    {pet.petSkills.length > 0 && (
                      <div className="border-t-2 border-purple-100 pt-5 mt-5">
                        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                          <span>🎯</span> Active Skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {pet.petSkills.map((petSkill) => (
                            <span
                              key={petSkill.skill.id}
                              className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 font-bold border border-blue-300 shadow-sm"
                              title={`${petSkill.skill.description} (Proficiency: ${petSkill.proficiency})`}
                            >
                              {petSkill.skill.skillName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lineage and Timestamps */}
                    <div className="mt-6 pt-5 border-t-2 border-purple-100 space-y-2">
                      <p className="text-xs text-gray-600 flex justify-between">
                        <span className="font-semibold">Generation:</span>
                        <span>{pet.generation} {(pet.parent1Id || pet.parent2Id) && <span className="text-gray-400">(Bred)</span>}</span>
                      </p>
                      <p className="text-xs text-gray-600 flex justify-between">
                        <span className="font-semibold">Created:</span>
                        <span>{new Date(pet.createdAt).toLocaleDateString()}</span>
                      </p>
                      <p className="text-xs text-gray-600 flex justify-between">
                        <span className="font-semibold">Last interaction:</span>
                        <span>{formatTimestamp(pet.lastInteractionAt)}</span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Max Pet Limit Warning */}
        {pets.length >= 10 && (
          <div className="mt-8 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl shadow-lg">
            <div className="flex items-center gap-4">
              <span className="text-4xl">⚠️</span>
              <div>
                <p className="text-yellow-900 font-bold text-lg">
                  Maximum pet limit reached!
                </p>
                <p className="text-yellow-800 text-sm">
                  You can own up to 10 pets in MVP. Consider breeding or managing your existing pets.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Family Tree Modal */}
      {familyTreePetId && (
        <FamilyTree
          petId={familyTreePetId}
          onClose={() => setFamilyTreePetId(null)}
        />
      )}

      {/* Chess Game Modal */}
      {chessOpenPetId && user && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <ChessBoard
            petId={chessOpenPetId}
            userId={user.id}
            onClose={() => setChessOpenPetId(null)}
          />
        </div>
      )}

      {/* AR Pet Viewer */}
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
            fetchPets(user.id);
          }}
          onChat={async (message: string) => {
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

      {/* Cross-Platform Sync Status */}
      <SyncStatus userId={user.id} />

      {/* Tutorial Overlay */}
      {showTutorial && user && (
        <TutorialOverlay
          userId={user.id}
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialSkip}
        />
      )}

      {/* Breeding Info Modal */}
      {showBreedingInfo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden">
            <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white p-8">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <span className="text-4xl">🧬</span>
                How Breeding Works
              </h2>
            </div>
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">🔬</span>
                  Genetic Inheritance
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  When you breed two pets, their offspring inherits genetic traits from both parents:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li className="font-medium"><strong className="text-purple-600">50% from Parent 1, 50% from Parent 2</strong> - Traits are randomly selected from each parent</li>
                  <li className="font-medium"><strong className="text-pink-600">15% Mutation Chance</strong> - Each trait has a chance to mutate into something new and unique</li>
                  <li className="font-medium"><strong className="text-indigo-600">Rarity Distribution</strong> - Legendary traits (5%), Rare (10%), Uncommon (25%), Common (60%)</li>
                  <li className="font-medium"><strong className="text-blue-600">Personality Averaging</strong> - Personality traits are averaged from both parents with ±15 variance</li>
                </ul>
              </div>

              <div className="space-y-3 pt-4 border-t-2 border-purple-100">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">📋</span>
                  Breeding Requirements
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li className="font-medium"><strong>Age:</strong> Both pets must be at least 7 days old</li>
                  <li className="font-medium"><strong>Health:</strong> Both pets must have health above 50</li>
                  <li className="font-medium"><strong>Cooldown:</strong> 7-day cooldown period between breeding sessions</li>
                  <li className="font-medium"><strong>Pet Limit:</strong> You can own up to 10 pets at once (MVP)</li>
                </ul>
              </div>

              <div className="space-y-3 pt-4 border-t-2 border-purple-100">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">🚀</span>
                  Getting Started
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  To breed your first pet, create at least two pets and ensure they meet the requirements above.
                  Then click the "🐣 Breed Pets" button to select parents and create offspring with unique genetic combinations!
                </p>
              </div>

              <div className="pt-6 flex justify-end">
                <button
                  onClick={() => setShowBreedingInfo(false)}
                  className="px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-full hover:from-pink-700 hover:to-purple-700 transition font-bold text-lg shadow-lg shadow-purple-500/40 hover:scale-105"
                >
                  Got it! ✨
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
