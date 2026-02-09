'use client'

import { useState, FormEvent } from 'react'

export interface PetCreationFormProps {
  onSubmit: (name: string) => void | Promise<void>
  loading?: boolean
  error?: string
}

export default function PetCreationForm({ onSubmit, loading = false, error }: PetCreationFormProps) {
  const [petName, setPetName] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await onSubmit(petName)
    } catch (error) {
      // Error is handled by parent component through error prop
      // Component doesn't need to do anything here
    }
  }

  const isValid = petName.trim().length > 0 && petName.length <= 50

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 text-red-800 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl">✕</span>
            </div>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="petName" className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span className="text-xl">🏷️</span>
            Pet Name
          </label>
          <input
            id="petName"
            type="text"
            required
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            maxLength={50}
            className="w-full px-5 py-4 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-lg font-medium transition placeholder:text-gray-400 bg-white shadow-inner"
            placeholder="e.g., Sparkle, Shadow, Luna"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-2 ml-1">
            Choose a unique name for your pet (max 50 characters)
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-2xl p-6 shadow-lg">
          <h3 className="font-bold text-blue-900 mb-4 text-lg flex items-center gap-2">
            <span className="text-2xl">🎲</span>
            What happens next?
          </h3>
          <ul className="text-sm text-blue-800 space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0">✨</span>
              <span className="font-medium">Random genetic traits will be generated</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0">🎨</span>
              <span className="font-medium">Visual traits (color, patterns, accessories)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0">💫</span>
              <span className="font-medium">Personality traits (friendliness, energy, curiosity)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0">🧬</span>
              <span className="font-medium">Each pet is unique based on genetics!</span>
            </li>
          </ul>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !isValid}
          className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-bold hover:from-pink-600 hover:to-purple-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition text-lg shadow-lg shadow-purple-500/50 hover:shadow-purple-500/80 hover:scale-105 active:scale-95"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Creating Your Pet...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              ✨ Create Pet
            </span>
          )}
        </button>
      </form>
    </div>
  )
}
