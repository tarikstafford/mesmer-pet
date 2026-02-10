'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatedPetSVG } from '@/components/pet-svg/AnimatedPetSVG';
import { loadTraits } from '@/lib/traits/migration';

interface Pet {
  id: string;
  name: string;
  generation: number;
  health: number;
  hunger: number;
  happiness: number;
  energy: number;
  friendliness: number;
  energyTrait: number;
  curiosity: number;
  patience: number;
  playfulness: number;
  createdAt: string;
  traits?: Record<string, unknown> | null;
  petTraits: Array<{
    trait: {
      id: string;
      traitName: string;
      traitType: string;
      rarity: string;
    };
  }>;
}

interface BreedingCheck {
  canBreed: boolean;
  reason?: string;
  compatibility: number;
  parent1: {
    id: string;
    name: string;
    generation: number;
    health: number;
    age: number;
  };
  parent2: {
    id: string;
    name: string;
    generation: number;
    health: number;
    age: number;
  };
}

function BreedingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet1, setSelectedPet1] = useState<string>('');
  const [selectedPet2, setSelectedPet2] = useState<string>('');
  const [breedingCheck, setBreedingCheck] = useState<BreedingCheck | null>(null);
  const [offspringName, setOffspringName] = useState('');
  const [loading, setLoading] = useState(true);
  const [breeding, setBreeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPets();
  }, []);

  useEffect(() => {
    // Check if pets are pre-selected from URL params
    const pet1 = searchParams.get('pet1');
    const pet2 = searchParams.get('pet2');
    if (pet1) setSelectedPet1(pet1);
    if (pet2) setSelectedPet2(pet2);
  }, [searchParams]);

  useEffect(() => {
    if (selectedPet1 && selectedPet2) {
      checkBreeding();
    } else {
      setBreedingCheck(null);
    }
  }, [selectedPet1, selectedPet2]);

  const fetchPets = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/pets', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch pets');

      const data = await response.json();
      setPets(data.pets);
    } catch (err) {
      console.error('Error fetching pets:', err);
      setError('Failed to load your pets');
    } finally {
      setLoading(false);
    }
  };

  const checkBreeding = async () => {
    if (!selectedPet1 || !selectedPet2) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `/api/pets/check-breeding?parent1Id=${selectedPet1}&parent2Id=${selectedPet2}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to check breeding eligibility');

      const data = await response.json();
      setBreedingCheck(data);
    } catch (err) {
      console.error('Error checking breeding:', err);
      setError('Failed to check breeding eligibility');
    }
  };

  const handleBreed = async () => {
    if (!selectedPet1 || !selectedPet2 || !offspringName.trim()) {
      setError('Please select two pets and enter a name for the offspring');
      return;
    }

    if (!breedingCheck?.canBreed) {
      setError(breedingCheck?.reason || 'These pets cannot breed');
      return;
    }

    setBreeding(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/pets/breed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          parent1Id: selectedPet1,
          parent2Id: selectedPet2,
          offspringName: offspringName.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to breed pets');
      }

      const data = await response.json();
      alert(`Success! ${data.offspring.name} was born!`);
      router.push('/dashboard?breedSuccess=true');
    } catch (err: unknown) {
      console.error('Error breeding pets:', err);
      setError(err instanceof Error ? err.message : 'Failed to breed pets');
    } finally {
      setBreeding(false);
    }
  };

  const getPet = (id: string) => pets.find((p) => p.id === id);

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'from-green-600 to-emerald-600';
    if (score >= 60) return 'from-yellow-600 to-orange-600';
    if (score >= 40) return 'from-orange-600 to-red-600';
    return 'from-red-600 to-pink-600';
  };

  const getCompatibilityLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const getCompatibilityBadge = (score: number) => {
    if (score >= 80) return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300';
    if (score >= 60) return 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-300';
    if (score >= 40) return 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border-orange-300';
    return 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-300';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            <p className="text-gray-600 font-medium text-lg">Loading your pets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="mb-6 flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold transition group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/40">
              <span className="text-3xl">🐣</span>
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-transparent bg-clip-text">
                Breed Your Pets
              </h1>
              <p className="text-gray-600 text-lg mt-1">Create unique offspring with combined genetics</p>
            </div>
          </div>
        </div>

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

        {/* Not Enough Pets Warning */}
        {pets.length < 2 && (
          <div className="mb-8 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl shadow-lg">
            <div className="flex items-center gap-4">
              <span className="text-4xl">⚠️</span>
              <div>
                <p className="text-yellow-900 font-bold text-lg">Not Enough Pets</p>
                <p className="text-yellow-800 text-sm">You need at least 2 pets to breed. Create more pets to unlock breeding!</p>
              </div>
            </div>
          </div>
        )}

        {/* Parent Selection */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Parent 1 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border-2 border-purple-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-3xl">👨</span>
              Parent 1
            </h2>
            <select
              value={selectedPet1}
              onChange={(e) => setSelectedPet1(e.target.value)}
              className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 mb-4 font-medium transition bg-white"
              disabled={pets.length < 2}
            >
              <option value="">Select a pet...</option>
              {pets
                .filter((p) => p.id !== selectedPet2)
                .map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name} (Gen {pet.generation})
                  </option>
                ))}
            </select>

            {selectedPet1 && getPet(selectedPet1) && (
              <div>
                <div className="mb-4 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-2xl overflow-hidden border-2 border-purple-200">
                  <div className="w-full h-[200px] flex items-center justify-center">
                    <AnimatedPetSVG
                      petId={getPet(selectedPet1)!.id}
                      traits={loadTraits(getPet(selectedPet1)!.traits, getPet(selectedPet1)!.id)}
                      size="medium"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200">
                    <span className="font-semibold text-gray-700">❤️ Health:</span>
                    <span className="font-bold text-red-600">{getPet(selectedPet1)!.health}/100</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <span className="font-semibold text-gray-700">🎂 Age:</span>
                    <span className="font-bold text-blue-600">
                      {Math.floor(
                        (Date.now() - new Date(getPet(selectedPet1)!.createdAt).getTime()) /
                          (24 * 60 * 60 * 1000)
                      )} days
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                    <span className="font-semibold text-gray-700">🧬 Generation:</span>
                    <span className="font-bold text-purple-600">Gen {getPet(selectedPet1)!.generation}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Parent 2 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border-2 border-pink-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-3xl">👩</span>
              Parent 2
            </h2>
            <select
              value={selectedPet2}
              onChange={(e) => setSelectedPet2(e.target.value)}
              className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 mb-4 font-medium transition bg-white"
              disabled={pets.length < 2}
            >
              <option value="">Select a pet...</option>
              {pets
                .filter((p) => p.id !== selectedPet1)
                .map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name} (Gen {pet.generation})
                  </option>
                ))}
            </select>

            {selectedPet2 && getPet(selectedPet2) && (
              <div>
                <div className="mb-4 bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 rounded-2xl overflow-hidden border-2 border-pink-200">
                  <div className="w-full h-[200px] flex items-center justify-center">
                    <AnimatedPetSVG
                      petId={getPet(selectedPet2)!.id}
                      traits={loadTraits(getPet(selectedPet2)!.traits, getPet(selectedPet2)!.id)}
                      size="medium"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200">
                    <span className="font-semibold text-gray-700">❤️ Health:</span>
                    <span className="font-bold text-red-600">{getPet(selectedPet2)!.health}/100</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <span className="font-semibold text-gray-700">🎂 Age:</span>
                    <span className="font-bold text-blue-600">
                      {Math.floor(
                        (Date.now() - new Date(getPet(selectedPet2)!.createdAt).getTime()) /
                          (24 * 60 * 60 * 1000)
                      )} days
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                    <span className="font-semibold text-gray-700">🧬 Generation:</span>
                    <span className="font-bold text-purple-600">Gen {getPet(selectedPet2)!.generation}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Compatibility and Breeding Section */}
        {breedingCheck && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border-2 border-purple-100">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <span className="text-4xl">💕</span>
              Breeding Compatibility
            </h2>

            {/* Compatibility Score */}
            <div className="mb-6 p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-lg font-semibold text-gray-700">Compatibility Score:</span>
                  <span className={`text-5xl font-bold bg-gradient-to-r ${getCompatibilityColor(breedingCheck.compatibility)} text-transparent bg-clip-text`}>
                    {breedingCheck.compatibility}/100
                  </span>
                </div>
                <span className={`px-6 py-3 rounded-full text-lg font-bold border-2 ${getCompatibilityBadge(breedingCheck.compatibility)}`}>
                  {getCompatibilityLabel(breedingCheck.compatibility)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                Compatibility is based on personality similarities, health, and generation compatibility.
              </p>
            </div>

            {/* Can Breed Status */}
            {breedingCheck.canBreed ? (
              <div className="mb-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 text-green-800 rounded-2xl shadow-lg">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">✓</span>
                  <span className="font-bold text-lg">These pets can breed!</span>
                </div>
              </div>
            ) : (
              <div className="mb-6 p-5 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 text-red-800 rounded-2xl shadow-lg">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">✗</span>
                  <span className="font-bold text-lg">{breedingCheck.reason}</span>
                </div>
              </div>
            )}

            {/* Breeding Form */}
            {breedingCheck.canBreed && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="text-2xl">🏷️</span>
                    Name for offspring:
                  </label>
                  <input
                    type="text"
                    value={offspringName}
                    onChange={(e) => setOffspringName(e.target.value)}
                    placeholder="Enter a name..."
                    className="w-full px-5 py-4 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-lg font-medium transition bg-white shadow-inner"
                    maxLength={50}
                  />
                  <p className="text-xs text-gray-500 mt-2 ml-1">
                    Choose a unique name for your new pet (max 50 characters)
                  </p>
                </div>

                <button
                  onClick={handleBreed}
                  disabled={!offspringName.trim() || breeding}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-bold hover:from-pink-600 hover:to-purple-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition shadow-lg shadow-pink-500/50 hover:shadow-pink-500/80 hover:scale-105 active:scale-95 text-lg"
                >
                  {breeding ? (
                    <span className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Breeding...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      🐣 Breed Pets
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Requirements Info Box */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-2xl p-6 shadow-lg">
          <h3 className="font-bold text-blue-900 text-lg mb-4 flex items-center gap-2">
            <span className="text-2xl">📋</span>
            Breeding Requirements:
          </h3>
          <ul className="space-y-3 text-sm text-blue-800">
            <li className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0">🎂</span>
              <span className="font-medium">Both pets must be at least 7 days old</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0">❤️</span>
              <span className="font-medium">Both pets must have health {'>'} 50</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0">💀</span>
              <span className="font-medium">Neither pet can be in Critical state</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0">⏰</span>
              <span className="font-medium">Both pets must have finished their 7-day breeding cooldown</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function BreedingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
        <div className="flex flex-col items-center gap-4 py-20">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          <div className="text-gray-600 font-medium text-lg">Loading...</div>
        </div>
      </div>
    }>
      <BreedingPageContent />
    </Suspense>
  );
}
