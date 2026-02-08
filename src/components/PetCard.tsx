'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

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

interface PetWarning {
  type: string
  severity: string
  message: string
  timestamp: string
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

export interface PetCardProps {
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
  parent1Id?: string | null
  parent2Id?: string | null
  createdAt: string
  lastInteractionAt?: string | null
  petTraits: PetTrait[]
  petSkills?: PetSkill[]
  warnings?: PetWarning[]
  isCritical?: boolean
  maxHealthPenalty?: number
  personalitySummary?: string
  onClick?: () => void
  onFeed?: (petId: string) => void
  onChat?: (petId: string) => void
  onLineage?: (petId: string) => void
  onViewAR?: (petId: string) => void
  feedingPetId?: string | null
  chatOpenPetId?: string | null
  recoveryAvailable?: boolean
  onRecover?: (petId: string) => void
  recoveringPetId?: string | null
}

export default function PetCard(props: PetCardProps) {
  const {
    id,
    name,
    health,
    hunger,
    happiness,
    energy,
    friendliness,
    energyTrait,
    curiosity,
    patience,
    playfulness,
    generation,
    parent1Id,
    parent2Id,
    createdAt,
    lastInteractionAt,
    petTraits,
    petSkills = [],
    warnings = [],
    isCritical = false,
    maxHealthPenalty = 0,
    personalitySummary,
    onClick,
    onFeed,
    onChat,
    onLineage,
    onViewAR,
    feedingPetId,
    chatOpenPetId,
    recoveryAvailable = false,
    onRecover,
    recoveringPetId,
  } = props

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

  const formatTimestamp = (timestamp: string | null | undefined) => {
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

  const visualTraitNames = petTraits
    .filter((pt) => pt.trait.traitType === 'visual')
    .map((pt) => pt.trait.traitName)

  return (
    <div
      onClick={onClick}
      className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] overflow-hidden ${
        isCritical ? 'ring-4 ring-red-500 ring-opacity-70' : 'border border-purple-100'
      } ${onClick ? 'cursor-pointer' : ''}`}
      data-testid="pet-card"
    >
      <div className="p-6">
        {/* Critical State Banner */}
        {isCritical && (
          <div className="mb-6 p-5 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-2xl shadow-lg" data-testid="critical-banner">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-4xl animate-pulse">💀</span>
              <div className="flex-1">
                <h4 className="text-xl font-bold">CRITICAL STATE</h4>
                <p className="text-sm text-red-100">Immediate recovery needed!</p>
              </div>
            </div>
            {recoveryAvailable && onRecover ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRecover(id)
                }}
                disabled={recoveringPetId === id}
                className={`w-full px-4 py-3 rounded-xl font-bold transition ${
                  recoveringPetId === id
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-white text-red-600 hover:bg-red-50 shadow-lg'
                }`}
                data-testid="recover-button"
              >
                {recoveringPetId === id ? '🔄 Recovering...' : '💊 Use Health Potion'}
              </button>
            ) : (
              <div className="text-sm text-red-100 bg-red-700/30 p-3 rounded-lg" data-testid="no-recovery-message">
                No recovery items available. Purchase from marketplace.
              </div>
            )}
            {maxHealthPenalty > 0 && (
              <div className="mt-3 text-xs text-red-100 bg-red-700/30 p-2 rounded-lg" data-testid="health-penalty-message">
                ⚠️ Max health reduced by {maxHealthPenalty}% due to previous recoveries
              </div>
            )}
          </div>
        )}

        {/* Warning Notifications */}
        {warnings && warnings.length > 0 && !isCritical && (
          <div className="mb-4 space-y-2" data-testid="warnings-section">
            {warnings.map((warning, index) => {
              const style = getWarningStyle(warning.severity)
              return (
                <div
                  key={index}
                  className={`p-3 ${style.bg} border-2 ${style.border} ${style.text} rounded-xl text-sm font-bold flex items-center gap-3 shadow-sm`}
                  data-testid={`warning-${warning.severity}`}
                >
                  <span className="text-xl">{style.icon}</span>
                  <span>{warning.message}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* 3D Pet Model */}
        <div className="mb-6 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-2xl overflow-hidden shadow-inner border-2 border-purple-200" data-testid="pet-model">
          <Suspense fallback={
            <div className="w-full h-72 flex items-center justify-center">
              <div className="text-gray-400 animate-pulse">Loading 3D model...</div>
            </div>
          }>
            <PetModel3D traitNames={visualTraitNames} health={health} width={350} height={280} autoRotate={true} />
          </Suspense>
        </div>

        {/* Pet Name & Generation */}
        <div className="mb-5" data-testid="pet-header">
          <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">{name}</h3>
          <p className="text-sm text-gray-500 font-medium">Generation {generation}</p>
        </div>

        {/* Stats */}
        <div className="space-y-3 mb-6" data-testid="stats-section">
          <div data-testid="stat-health">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-gray-700 font-semibold">Health</span>
              <span className={`font-bold ${getStatColor(health).text}`} data-testid="stat-health-value">{health}/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
              <div
                className={`${getStatColor(health).bar} h-3 rounded-full transition-all duration-500 shadow-sm`}
                style={{ width: `${health}%` }}
                data-testid="stat-health-bar"
              />
            </div>
          </div>

          <div data-testid="stat-happiness">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-gray-700 font-semibold">Happiness</span>
              <span className={`font-bold ${getStatColor(happiness).text}`} data-testid="stat-happiness-value">{happiness}/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
              <div
                className={`${getStatColor(happiness).bar} h-3 rounded-full transition-all duration-500 shadow-sm`}
                style={{ width: `${happiness}%` }}
                data-testid="stat-happiness-bar"
              />
            </div>
          </div>

          <div data-testid="stat-energy">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-gray-700 font-semibold">Energy</span>
              <span className={`font-bold ${getStatColor(energy).text}`} data-testid="stat-energy-value">{energy}/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
              <div
                className={`${getStatColor(energy).bar} h-3 rounded-full transition-all duration-500 shadow-sm`}
                style={{ width: `${energy}%` }}
                data-testid="stat-energy-bar"
              />
            </div>
          </div>

          <div data-testid="stat-hunger">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-gray-700 font-semibold">Hunger</span>
              <span className={`font-bold ${getStatColor(100 - hunger).text}`} data-testid="stat-hunger-value">{hunger}/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
              <div
                className={`${getStatColor(100 - hunger).bar} h-3 rounded-full transition-all duration-500 shadow-sm`}
                style={{ width: `${hunger}%` }}
                data-testid="stat-hunger-bar"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {(onFeed || onChat || onLineage || onViewAR) && (
          <div className="space-y-3 mb-6" data-testid="action-buttons">
            {/* Feed Button */}
            {onFeed && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onFeed(id)
                }}
                disabled={feedingPetId === id || isCritical}
                className={`w-full px-4 py-3 rounded-xl font-bold transition shadow-lg ${
                  feedingPetId === id || isCritical
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-green-500/40 hover:scale-105'
                }`}
                title={isCritical ? 'Pet must be recovered before feeding' : ''}
                data-testid="feed-button"
              >
                {feedingPetId === id ? '🔄 Feeding...' : isCritical ? '❌ Cannot Feed (Critical)' : '🍖 Feed Pet'}
              </button>
            )}

            {/* Chat Button */}
            {onChat && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onChat(id)
                }}
                disabled={isCritical}
                className={`w-full px-4 py-3 rounded-xl font-bold transition shadow-lg ${
                  isCritical
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : chatOpenPetId === id
                    ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800 shadow-gray-500/40'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 shadow-blue-500/40 hover:scale-105'
                }`}
                title={isCritical ? 'Pet must be recovered before chatting' : ''}
                data-testid="chat-button"
              >
                {isCritical ? '❌ Cannot Chat (Critical)' : chatOpenPetId === id ? '▼ Close Chat' : `💬 Chat with ${name}`}
              </button>
            )}

            {/* Lineage and AR buttons in a grid */}
            {(onLineage || onViewAR) && (
              <div className="grid grid-cols-2 gap-3">
                {onLineage && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onLineage(id)
                    }}
                    className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-bold hover:from-indigo-600 hover:to-purple-600 transition shadow-lg shadow-indigo-500/40 hover:scale-105"
                    data-testid="lineage-button"
                  >
                    🌳 Lineage
                  </button>
                )}

                {onViewAR && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onViewAR(id)
                    }}
                    className="px-4 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-bold hover:from-pink-600 hover:to-rose-600 transition shadow-lg shadow-pink-500/40 hover:scale-105"
                    data-testid="ar-button"
                  >
                    🔮 View AR
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Visual Traits */}
        <div className="border-t-2 border-purple-100 pt-5 mt-5" data-testid="visual-traits">
          <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span>✨</span> Visual Traits
          </h4>
          <div className="flex flex-wrap gap-2">
            {petTraits.filter(pt => pt.trait.traitType === 'visual').slice(0, 4).map((petTrait) => (
              <span
                key={petTrait.trait.id}
                className={`text-xs px-3 py-1.5 rounded-full font-bold shadow-sm ${getRarityColor(
                  petTrait.trait.rarity
                )}`}
                title={petTrait.trait.description}
                data-testid={`trait-${petTrait.trait.rarity}`}
              >
                {petTrait.trait.traitName}
              </span>
            ))}
          </div>
        </div>

        {/* Personality Profile */}
        <div className="border-t-2 border-purple-100 pt-5 mt-5" data-testid="personality-profile">
          <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span>🧠</span> Personality Profile
          </h4>

          {/* Personality Summary */}
          {personalitySummary && (
            <div className="mb-4 p-3 bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300 rounded-xl" data-testid="personality-summary">
              <p className="text-sm text-purple-900 font-semibold text-center italic">
                "{personalitySummary}"
              </p>
            </div>
          )}

          {/* Personality Trait Bars */}
          <div className="space-y-2.5">
            <div data-testid="personality-friendliness">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 font-semibold">😊 Friendliness</span>
                <span className="font-bold text-purple-600">{friendliness}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 shadow-inner">
                <div
                  className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${friendliness}%` }}
                />
              </div>
            </div>

            <div data-testid="personality-energy">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 font-semibold">⚡ Energy</span>
                <span className="font-bold text-yellow-600">{energyTrait}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 shadow-inner">
                <div
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${energyTrait}%` }}
                />
              </div>
            </div>

            <div data-testid="personality-curiosity">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 font-semibold">🔍 Curiosity</span>
                <span className="font-bold text-blue-600">{curiosity}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 shadow-inner">
                <div
                  className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${curiosity}%` }}
                />
              </div>
            </div>

            <div data-testid="personality-patience">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 font-semibold">🕰️ Patience</span>
                <span className="font-bold text-teal-600">{patience}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 shadow-inner">
                <div
                  className="bg-gradient-to-r from-teal-400 to-teal-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${patience}%` }}
                />
              </div>
            </div>

            <div data-testid="personality-playfulness">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 font-semibold">🎮 Playfulness</span>
                <span className="font-bold text-pink-600">{playfulness}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 shadow-inner">
                <div
                  className="bg-gradient-to-r from-pink-400 to-pink-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${playfulness}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Active Skills */}
        {petSkills && petSkills.length > 0 && (
          <div className="border-t-2 border-purple-100 pt-5 mt-5" data-testid="active-skills">
            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <span>🎯</span> Active Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {petSkills.map((petSkill) => (
                <span
                  key={petSkill.skill.id}
                  className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 font-bold border border-blue-300 shadow-sm"
                  title={`${petSkill.skill.description} (Proficiency: ${petSkill.proficiency})`}
                  data-testid="skill-badge"
                >
                  {petSkill.skill.skillName}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Lineage and Timestamps */}
        <div className="mt-6 pt-5 border-t-2 border-purple-100 space-y-2" data-testid="metadata">
          <p className="text-xs text-gray-600 flex justify-between">
            <span className="font-semibold">Generation:</span>
            <span>{generation} {(parent1Id || parent2Id) && <span className="text-gray-400">(Bred)</span>}</span>
          </p>
          <p className="text-xs text-gray-600 flex justify-between">
            <span className="font-semibold">Created:</span>
            <span>{new Date(createdAt).toLocaleDateString()}</span>
          </p>
          <p className="text-xs text-gray-600 flex justify-between">
            <span className="font-semibold">Last interaction:</span>
            <span>{formatTimestamp(lastInteractionAt)}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
