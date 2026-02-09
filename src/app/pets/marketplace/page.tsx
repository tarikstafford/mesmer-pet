'use client';

/**
 * Pet Marketplace Page
 * Browse and purchase pets listed by other users
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MarketplaceCard from '@/components/MarketplaceCard';

interface PetTrait {
  trait: {
    traitName: string;
    rarity: string;
  };
}

interface Pet {
  id: string;
  name: string;
  traits: PetTrait[];
}

interface Listing {
  id: string;
  petId: string;
  sellerId: string;
  price: number;
  status: string;
  pet: Pet;
  seller: {
    id: string;
    name: string;
  };
}

export default function PetMarketplacePage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userCurrency, setUserCurrency] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Get user info from localStorage
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.userId);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }

    fetchListings();
    fetchUserCurrency();
  }, []);

  async function fetchListings() {
    try {
      setLoading(true);
      const response = await fetch('/api/pets/marketplace/listings');
      const data = await response.json();

      if (response.ok) {
        setListings(data.listings);
      } else {
        setError(data.error || 'Failed to load listings');
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
      setError('Failed to load listings');
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserCurrency() {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      const response = await fetch('/api/user/engagement', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserCurrency(data.engagement?.virtualCurrency || 0);
      }
    } catch (error) {
      console.error('Error fetching user currency:', error);
    }
  }

  async function handlePurchase(listingId: string) {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('You must be logged in to purchase pets');
      return;
    }

    setPurchasingId(listingId);
    setError(null);

    try {
      const response = await fetch('/api/pets/marketplace/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ listingId }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(`Successfully purchased ${data.pet.name}!`);
        // Refresh listings and currency
        await Promise.all([fetchListings(), fetchUserCurrency()]);

        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setError(data.error || 'Failed to purchase pet');
      }
    } catch (error) {
      console.error('Error purchasing pet:', error);
      setError('Failed to purchase pet');
    } finally {
      setPurchasingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="mb-6 flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold transition group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/40">
                <span className="text-3xl">🏪</span>
              </div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-transparent bg-clip-text">
                  Pet Marketplace
                </h1>
                <p className="text-gray-600 text-lg mt-1">Buy and sell pets with other trainers</p>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl px-6 py-4 border-2 border-purple-100">
              <div className="text-sm text-gray-600 mb-1">Your Balance</div>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
                {userCurrency} coins
              </div>
            </div>
          </div>

          <button
            onClick={() => router.push('/pets/marketplace/my-listings')}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all font-bold shadow-lg shadow-green-500/40 hover:scale-105"
          >
            📝 My Listings
          </button>
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

        {/* Listings */}
        {loading ? (
          <div className="text-center py-20 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-purple-100">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
              <p className="text-gray-600 text-lg font-medium">Loading listings...</p>
            </div>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-purple-100">
            <div className="text-6xl mb-4">🏜️</div>
            <p className="text-gray-600 text-xl font-medium">No pets available on the marketplace</p>
            <p className="text-gray-500 mt-2">Check back later for new listings!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <MarketplaceCard
                key={listing.id}
                listingId={listing.id}
                petName={listing.pet.name}
                price={listing.price}
                sellerName={listing.seller.name}
                sellerId={listing.sellerId}
                isSold={listing.status === 'sold'}
                currentUserId={currentUserId || undefined}
                userCurrency={userCurrency}
                onPurchase={handlePurchase}
                loading={purchasingId === listing.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
