'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const PetModel3D = dynamic(() => import('@/components/PetModel3D'), {
  ssr: false,
  loading: () => <div className="w-full h-[200px] bg-gray-100 animate-pulse rounded-lg" />,
});

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
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getCompatibilityLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <p>Loading your pets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 hover:underline"
          >
            ← Back to Dashboard
          </button>
        </div>

        <h1 className="text-4xl font-bold mb-8">Breed Your Pets</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {pets.length < 2 && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            You need at least 2 pets to breed. Create more pets to unlock breeding!
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Parent 1 Selection */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Parent 1</h2>
            <select
              value={selectedPet1}
              onChange={(e) => setSelectedPet1(e.target.value)}
              className="w-full p-2 border rounded mb-4"
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
                <PetModel3D
                  traitNames={getPet(selectedPet1)!.petTraits
                    .filter((pt) => pt.trait.traitType === 'visual')
                    .map((pt) => pt.trait.traitName)}
                  health={getPet(selectedPet1)!.health}
                />
                <div className="mt-4 space-y-2 text-sm">
                  <p>
                    <strong>Health:</strong> {getPet(selectedPet1)!.health}
                  </p>
                  <p>
                    <strong>Age:</strong>{' '}
                    {Math.floor(
                      (Date.now() - new Date(getPet(selectedPet1)!.createdAt).getTime()) /
                        (24 * 60 * 60 * 1000)
                    )}{' '}
                    days
                  </p>
                  <p>
                    <strong>Generation:</strong> {getPet(selectedPet1)!.generation}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Parent 2 Selection */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Parent 2</h2>
            <select
              value={selectedPet2}
              onChange={(e) => setSelectedPet2(e.target.value)}
              className="w-full p-2 border rounded mb-4"
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
                <PetModel3D
                  traitNames={getPet(selectedPet2)!.petTraits
                    .filter((pt) => pt.trait.traitType === 'visual')
                    .map((pt) => pt.trait.traitName)}
                  health={getPet(selectedPet2)!.health}
                />
                <div className="mt-4 space-y-2 text-sm">
                  <p>
                    <strong>Health:</strong> {getPet(selectedPet2)!.health}
                  </p>
                  <p>
                    <strong>Age:</strong>{' '}
                    {Math.floor(
                      (Date.now() - new Date(getPet(selectedPet2)!.createdAt).getTime()) /
                        (24 * 60 * 60 * 1000)
                    )}{' '}
                    days
                  </p>
                  <p>
                    <strong>Generation:</strong> {getPet(selectedPet2)!.generation}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Compatibility and Breeding UI */}
        {breedingCheck && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Breeding Compatibility</h2>

            <div className="mb-4">
              <div className="flex items-center gap-4 mb-2">
                <span className="text-lg font-semibold">Compatibility Score:</span>
                <span
                  className={`text-3xl font-bold ${getCompatibilityColor(
                    breedingCheck.compatibility
                  )}`}
                >
                  {breedingCheck.compatibility}/100
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    breedingCheck.compatibility >= 80
                      ? 'bg-green-100 text-green-800'
                      : breedingCheck.compatibility >= 60
                      ? 'bg-yellow-100 text-yellow-800'
                      : breedingCheck.compatibility >= 40
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {getCompatibilityLabel(breedingCheck.compatibility)}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Compatibility is based on personality similarities, health, and generation
                compatibility.
              </p>
            </div>

            {breedingCheck.canBreed ? (
              <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                ✓ These pets can breed!
              </div>
            ) : (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                ✗ {breedingCheck.reason}
              </div>
            )}

            {breedingCheck.canBreed && (
              <div className="mt-6">
                <label className="block text-sm font-semibold mb-2">
                  Name for offspring:
                </label>
                <input
                  type="text"
                  value={offspringName}
                  onChange={(e) => setOffspringName(e.target.value)}
                  placeholder="Enter a name..."
                  className="w-full p-3 border rounded mb-4"
                  maxLength={50}
                />

                <button
                  onClick={handleBreed}
                  disabled={!offspringName.trim() || breeding}
                  className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  {breeding ? 'Breeding...' : '🐣 Breed Pets'}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          <p className="font-semibold mb-2">Breeding Requirements:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Both pets must be at least 7 days old</li>
            <li>Both pets must have health {'>'} 50</li>
            <li>Neither pet can be in Critical state</li>
            <li>Both pets must have finished their 7-day breeding cooldown</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function BreedingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 p-8">Loading...</div>}>
      <BreedingPageContent />
    </Suspense>
  );
}
