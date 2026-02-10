'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatedPetSVG } from '@/components/pet-svg/AnimatedPetSVG';
import { loadTraits } from '@/lib/traits/migration';

interface Trait {
  id: string;
  traitName: string;
  traitType: string;
  rarity: string;
  description: string;
}

interface PetTrait {
  trait: Trait;
  inheritanceSource: string;
}

interface Skill {
  skillName: string;
  category: string;
  description: string;
}

interface PetSkill {
  skill: Skill;
  proficiency: number;
}

interface Pet {
  id: string;
  name: string;
  health: number;
  hunger: number;
  happiness: number;
  energy: number;
  generation: number;
  friendliness: number;
  energyTrait: number;
  curiosity: number;
  patience: number;
  playfulness: number;
  createdAt: string;
  traits?: Record<string, unknown> | null;
  petTraits: PetTrait[];
  petSkills: PetSkill[];
}

interface Friend {
  id: string;
  email: string;
  name: string | null;
}

export default function FriendPetsPage({ params }: { params: Promise<{ friendId: string }> }) {
  const router = useRouter();
  const [friend, setFriend] = useState<Friend | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [showBreedRequest, setShowBreedRequest] = useState(false);
  const [myPets, setMyPets] = useState<Pet[]>([]);
  const [selectedMyPet, setSelectedMyPet] = useState<string>('');
  const [offspringName, setOffspringName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        router.push('/auth/login');
        return;
      }

      const { friendId } = await params;

      // Fetch friend's pets
      const res = await fetch(`/api/friends/pets/${friendId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setFriend(data.friend);
        setPets(data.pets);
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Failed to load friend pets' });
      }

      // Fetch my pets for breeding
      const myPetsRes = await fetch('/api/pets', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (myPetsRes.ok) {
        const myPetsData = await myPetsRes.json();
        setMyPets(myPetsData.pets);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendBreedRequest = async () => {
    if (!selectedMyPet || !selectedPet) {
      setMessage({ type: 'error', text: 'Please select your pet' });
      return;
    }

    setActionLoading(true);
    try {
      const authToken = localStorage.getItem('authToken');
      const res = await fetch('/api/breeding-requests/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          requesterPetId: selectedMyPet,
          addresseePetId: selectedPet.id,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Breeding request sent!' });
        setShowBreedRequest(false);
        setSelectedMyPet('');
        setOffspringName('');
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Failed to send breeding request' });
      }
    } catch (error) {
      console.error('Error sending breeding request:', error);
      setMessage({ type: 'error', text: 'Failed to send breeding request' });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatColor = (value: number) => {
    if (value > 70) return 'text-green-600';
    if (value > 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'rare':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'uncommon':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-blue-100 flex items-center justify-center">
        <div className="text-xl">Loading friend's pets...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-blue-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-purple-900 mb-2">
              🐾 {friend?.name || friend?.email}'s Pets
            </h1>
            <p className="text-gray-600">{pets.length} pets</p>
          </div>
          <button
            onClick={() => router.push('/friends')}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            ← Back to Friends
          </button>
        </div>

        {/* Messages */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {message.text}
            <button onClick={() => setMessage(null)} className="ml-4 font-bold">
              ×
            </button>
          </div>
        )}

        {/* Pets Grid */}
        {pets.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600">This friend doesn't have any pets yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map((pet) => (
              <div key={pet.id} className="bg-white rounded-lg shadow-lg p-6">
                {/* Animated Pet SVG */}
                <div className="mb-4 h-64 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-lg overflow-hidden flex items-center justify-center">
                  <AnimatedPetSVG
                    petId={pet.id}
                    traits={loadTraits(pet.traits, pet.id)}
                    size="medium"
                  />
                </div>

                {/* Pet Info */}
                <h3 className="text-2xl font-bold text-purple-900 mb-2">{pet.name}</h3>
                <p className="text-sm text-gray-600 mb-4">Generation {pet.generation}</p>

                {/* Stats */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Health:</span>
                    <span className={`text-sm font-bold ${getStatColor(pet.health)}`}>{pet.health}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Hunger:</span>
                    <span className={`text-sm font-bold ${getStatColor(100 - pet.hunger)}`}>{pet.hunger}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Happiness:</span>
                    <span className={`text-sm font-bold ${getStatColor(pet.happiness)}`}>{pet.happiness}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Energy:</span>
                    <span className={`text-sm font-bold ${getStatColor(pet.energy)}`}>{pet.energy}</span>
                  </div>
                </div>

                {/* Visual Traits */}
                <div className="mb-4">
                  <p className="text-sm font-semibold mb-2">Visual Traits:</p>
                  <div className="flex flex-wrap gap-1">
                    {pet.petTraits
                      .filter((pt) => pt.trait.traitType === 'visual')
                      .map((pt) => (
                        <span
                          key={pt.trait.id}
                          className={`px-2 py-1 rounded text-xs border ${getRarityColor(pt.trait.rarity)}`}
                        >
                          {pt.trait.traitName}
                        </span>
                      ))}
                  </div>
                </div>

                {/* Personality */}
                <div className="mb-4">
                  <p className="text-sm font-semibold mb-2">Personality:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Friendliness: {pet.friendliness}</div>
                    <div>Energy: {pet.energyTrait}</div>
                    <div>Curiosity: {pet.curiosity}</div>
                    <div>Patience: {pet.patience}</div>
                    <div>Playfulness: {pet.playfulness}</div>
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={() => {
                    setSelectedPet(pet);
                    setShowBreedRequest(true);
                  }}
                  className="w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                >
                  💕 Request Breeding
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Breeding Request Modal */}
        {showBreedRequest && selectedPet && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-purple-900">Request Breeding</h2>
                <button
                  onClick={() => {
                    setShowBreedRequest(false);
                    setSelectedMyPet('');
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Select one of your pets to breed with <strong>{selectedPet.name}</strong>:
                </p>

                <select
                  value={selectedMyPet}
                  onChange={(e) => setSelectedMyPet(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                >
                  <option value="">Select your pet...</option>
                  {myPets.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name} (Gen {pet.generation}, Health: {pet.health})
                    </option>
                  ))}
                </select>

                <p className="text-sm text-gray-500 mb-4">
                  Note: The offspring will belong to you. Your friend will receive a breeding request notification.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowBreedRequest(false);
                    setSelectedMyPet('');
                  }}
                  className="flex-1 px-6 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendBreedRequest}
                  disabled={!selectedMyPet || actionLoading}
                  className="flex-1 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
