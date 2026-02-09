'use client';

/**
 * My Listings Page
 * Manage user's pet marketplace listings
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Pet {
  id: string;
  name: string;
  userId?: string;
  health: number;
  happiness: number;
  energy: number;
  hunger: number;
}

interface Listing {
  id: string;
  petId: string;
  sellerId?: string;
  price: number;
  status: string;
  listedAt: string;
  pet: Pet;
}

export default function MyListingsPage() {
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPet, setSelectedPet] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isListing, setIsListing] = useState(false);

  useEffect(() => {
    fetchPets();
    fetchMyListings();
  }, []);

  async function fetchPets() {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      const response = await fetch('/api/pets', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPets(data.pets || []);
      }
    } catch (error) {
      console.error('Error fetching pets:', error);
    }
  }

  async function fetchMyListings() {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch('/api/pets/marketplace/listings');
      const data = await response.json();

      if (response.ok) {
        // Get userId from token
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.userId;

        // Filter listings to only show user's listings
        const myListings = data.listings.filter(
          (listing: Listing) => listing.pet?.userId === userId || listing.sellerId === userId
        );
        setListings(myListings);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateListing(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedPet || !price) {
      setError('Please select a pet and enter a price');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      setError('Price must be a non-negative number');
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('You must be logged in');
      return;
    }

    setIsListing(true);
    setError(null);

    try {
      const response = await fetch('/api/pets/marketplace/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          petId: selectedPet,
          price: priceNum,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Pet listed successfully!');
        setSelectedPet('');
        setPrice('');
        await Promise.all([fetchPets(), fetchMyListings()]);

        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setError(data.error || 'Failed to list pet');
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      setError('Failed to list pet');
    } finally {
      setIsListing(false);
    }
  }

  async function handleCancelListing(listingId: string) {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      const response = await fetch('/api/pets/marketplace/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ listingId }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Listing cancelled successfully!');
        await Promise.all([fetchPets(), fetchMyListings()]);

        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setError(data.error || 'Failed to cancel listing');
      }
    } catch (error) {
      console.error('Error cancelling listing:', error);
      setError('Failed to cancel listing');
    }
  }

  // Filter out pets that are already listed
  const listedPetIds = listings
    .filter(l => l.status === 'active')
    .map(l => l.petId);
  const availablePets = pets.filter(p => !listedPetIds.includes(p.id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/pets/marketplace')}
            className="mb-6 flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold transition group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span>Back to Marketplace</span>
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/40">
              <span className="text-3xl">📝</span>
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-transparent bg-clip-text">
                My Listings
              </h1>
              <p className="text-gray-600 text-lg mt-1">List your pets for sale</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-5 mb-8 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-3xl">✅</span>
              <p className="text-green-900 font-bold">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-2xl p-5 mb-8 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-3xl">❌</span>
              <p className="text-red-900 font-bold">{error}</p>
            </div>
          </div>
        )}

        {/* Create Listing Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border-2 border-green-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span>➕</span>
            Create New Listing
          </h2>

          <form onSubmit={handleCreateListing} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Select Pet
              </label>
              <select
                value={selectedPet}
                onChange={(e) => setSelectedPet(e.target.value)}
                className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition bg-white font-medium"
                disabled={isListing}
              >
                <option value="">Choose a pet to list...</option>
                {availablePets.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Price (coins)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter price in coins..."
                className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition bg-white"
                disabled={isListing}
              />
            </div>

            <button
              type="submit"
              disabled={isListing || !selectedPet || !price}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all font-bold shadow-lg shadow-green-500/40 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-lg"
            >
              {isListing ? 'Listing Pet...' : '📝 List Pet'}
            </button>
          </form>
        </div>

        {/* My Active Listings */}
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span>📋</span>
            Your Active Listings
          </h2>

          {loading ? (
            <div className="text-center py-20 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-green-100">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
                <p className="text-gray-600 text-lg font-medium">Loading your listings...</p>
              </div>
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-20 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-green-100">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-600 text-xl font-medium">You don't have any listings yet</p>
              <p className="text-gray-500 mt-2">Use the form above to list a pet for sale!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border-2 transition-all ${
                    listing.status === 'sold' ? 'border-gray-300 opacity-60' : 'border-green-100'
                  }`}
                >
                  {/* Status Badge */}
                  <div className="mb-3">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full border ${
                        listing.status === 'active'
                          ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-400'
                          : listing.status === 'sold'
                          ? 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-400'
                          : 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 border-yellow-400'
                      }`}
                    >
                      {listing.status === 'active' && '✅ Active'}
                      {listing.status === 'sold' && '✓ Sold'}
                      {listing.status === 'cancelled' && '❌ Cancelled'}
                    </span>
                  </div>

                  {/* Pet Info */}
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    {listing.pet?.name || 'Unknown Pet'}
                  </h3>

                  {/* Price */}
                  <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 text-transparent bg-clip-text mb-4">
                    {listing.price} coins
                  </div>

                  {/* Listed Date */}
                  <div className="text-sm text-gray-600 mb-4">
                    Listed: {new Date(listing.listedAt).toLocaleDateString()}
                  </div>

                  {/* Cancel Button */}
                  {listing.status === 'active' && (
                    <button
                      onClick={() => handleCancelListing(listing.id)}
                      className="w-full px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition font-bold"
                    >
                      Cancel Listing
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
