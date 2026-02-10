'use client';

/**
 * US-TEST-024: MarketplaceCard Component
 * Displays pet marketplace listing with purchase functionality
 */

import React from 'react';
import { AnimatedPetSVG } from '@/components/pet-svg/AnimatedPetSVG';
import { loadTraits } from '@/lib/traits/migration';

interface MarketplaceCardProps {
  listingId: string;
  petName: string;
  petImage?: string;           // Keep for backward compatibility but unused
  petId?: string;              // ADD: Pet ID for trait loading and animation
  petTraits?: Record<string, unknown> | null;  // ADD: Pet traits JSON from database
  petSvgNode?: React.ReactNode;  // ADD: Optional external SVG node from LazyPetGrid
  price: number;
  sellerName: string;
  sellerId: string;
  isSold?: boolean;
  currentUserId?: string;
  userCurrency?: number;
  onPurchase?: (listingId: string) => void;
  loading?: boolean;
}

export default function MarketplaceCard({
  listingId,
  petName,
  petImage,
  petId,
  petTraits,
  petSvgNode,
  price,
  sellerName,
  sellerId,
  isSold = false,
  currentUserId,
  userCurrency = 0,
  onPurchase,
  loading = false,
}: MarketplaceCardProps) {
  const isOwnListing = currentUserId === sellerId;
  const insufficientFunds = userCurrency < price;
  const canPurchase = !isSold && !isOwnListing && !insufficientFunds && !loading;

  const handlePurchaseClick = () => {
    if (canPurchase && onPurchase) {
      onPurchase(listingId);
    }
  };

  return (
    <div
      className={`marketplace-card bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border-2 transition-all hover:shadow-2xl ${
        isSold ? 'border-gray-300 opacity-60' : 'border-purple-100 hover:scale-[1.02]'
      }`}
      data-testid="marketplace-card"
    >
      {/* Sold Indicator */}
      {isSold && (
        <div className="sold-indicator mb-3">
          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-full border border-gray-400">
            ✓ Sold
          </span>
        </div>
      )}

      {/* Pet Display */}
      <div className="pet-display mb-4 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-xl overflow-hidden shadow-inner border-2 border-purple-200">
        <div className="w-full h-48 flex items-center justify-center">
          {petSvgNode ? (
            petSvgNode
          ) : petId ? (
            <AnimatedPetSVG
              petId={petId}
              traits={loadTraits(petTraits, petId)}
              size="medium"
            />
          ) : petImage ? (
            <img
              src={petImage}
              alt={petName}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="text-gray-400 text-sm">No pet preview</div>
          )}
        </div>
      </div>

      {/* Pet Info */}
      <div className="pet-info mb-4">
        <h3 className="pet-name text-xl font-bold text-gray-800 mb-2">
          {petName}
        </h3>
        <div className="seller-info flex items-center gap-2 text-sm text-gray-600">
          <span className="seller-label font-medium">Seller:</span>
          <span className="seller-name font-semibold text-purple-600">
            {sellerName}
          </span>
        </div>
      </div>

      {/* Price and Purchase */}
      <div className="footer flex items-center justify-between pt-4 border-t-2 border-purple-100">
        <div className="price text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
          {price} coins
        </div>

        {isSold ? (
          <button
            disabled
            className="px-5 py-2.5 bg-gray-300 text-gray-600 rounded-xl cursor-not-allowed font-bold text-sm"
            data-testid="purchase-button"
          >
            Sold Out
          </button>
        ) : isOwnListing ? (
          <button
            disabled
            className="px-5 py-2.5 bg-gray-300 text-gray-600 rounded-xl cursor-not-allowed font-bold text-sm"
            data-testid="purchase-button"
          >
            Your Listing
          </button>
        ) : insufficientFunds ? (
          <button
            disabled
            className="px-5 py-2.5 bg-gray-300 text-gray-600 rounded-xl cursor-not-allowed font-bold text-sm"
            data-testid="purchase-button"
            title="Insufficient funds"
          >
            Insufficient Funds
          </button>
        ) : (
          <button
            onClick={handlePurchaseClick}
            disabled={loading}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all font-bold shadow-lg shadow-purple-500/40 hover:scale-105 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="purchase-button"
          >
            {loading ? 'Purchasing...' : 'Buy Now'}
          </button>
        )}
      </div>
    </div>
  );
}
