'use client';

/**
 * US-016: Skill Purchase Flow (IAP Integration)
 * Purchase confirmation and Stripe checkout initiation
 */

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Skill {
  id: string;
  skillName: string;
  category: string;
  description: string;
  price: number;
  featured: boolean;
  icon: string | null;
}

function PurchaseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const skillId = searchParams.get('skillId');

  const [skill, setSkill] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Get userId from auth token
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserId(payload.userId);
    } catch (error) {
      console.error('Error decoding token:', error);
      router.push('/auth/login');
    }
  }, [router]);

  // Fetch skill details
  useEffect(() => {
    if (!skillId) {
      router.push('/marketplace');
      return;
    }

    fetchSkill();
  }, [skillId, router]);

  async function fetchSkill() {
    try {
      const response = await fetch(`/api/marketplace/skills?skillId=${skillId}`);
      const data = await response.json();

      if (response.ok && data.skills.length > 0) {
        setSkill(data.skills[0]);
      } else {
        setError('Skill not found');
      }
    } catch (error) {
      console.error('Error fetching skill:', error);
      setError('Failed to load skill details');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmPurchase() {
    if (!userId || !skill) return;

    setProcessing(true);
    setError(null);

    try {
      // Create Stripe checkout session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillId: skill.id, userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to initiate checkout');
        setProcessing(false);
        return;
      }

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('No checkout URL received');
        setProcessing(false);
      }
    } catch (error) {
      console.error('Error initiating purchase:', error);
      setError('Failed to initiate purchase. Please try again.');
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⌛</div>
          <p className="text-gray-600">Loading skill details...</p>
        </div>
      </div>
    );
  }

  if (error && !skill) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">❌</div>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/marketplace')}
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Back to Marketplace
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!skill) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/marketplace')}
            className="mb-4 text-purple-600 hover:text-purple-700"
          >
            ← Back to Marketplace
          </button>
          <h1 className="text-4xl font-bold text-gray-800">Purchase Skill</h1>
        </div>

        {/* Skill Details Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-start mb-6">
            <div className="text-6xl mr-4">{skill.icon || '📦'}</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {skill.skillName}
              </h2>
              <span className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded text-sm">
                {skill.category}
              </span>
            </div>
          </div>

          <p className="text-gray-600 mb-6">{skill.description}</p>

          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-6">
              <span className="text-lg font-medium text-gray-700">Price:</span>
              <span className="text-3xl font-bold text-purple-600">
                ${skill.price.toFixed(2)}
              </span>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Confirmation Dialog */}
            {!showConfirmation ? (
              <button
                onClick={() => setShowConfirmation(true)}
                className="w-full py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-semibold"
              >
                Continue to Payment
              </button>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="font-bold text-gray-800 mb-3">
                  ⚠️ Confirm Purchase
                </h3>
                <p className="text-gray-700 mb-4">
                  You are about to purchase <strong>{skill.skillName}</strong> for{' '}
                  <strong>${skill.price.toFixed(2)}</strong>. You will be redirected to
                  Stripe to complete your payment.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleConfirmPurchase}
                    disabled={processing}
                    className="flex-1 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Processing...' : 'Confirm & Pay'}
                  </button>
                  <button
                    onClick={() => {
                      setShowConfirmation(false);
                      setError(null);
                    }}
                    disabled={processing}
                    className="flex-1 py-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-700">
          <p className="font-semibold mb-2">🔒 Secure Payment</p>
          <p>
            Your payment is processed securely through Stripe. We never store your
            credit card information.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PurchasePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">⌛</div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <PurchaseContent />
    </Suspense>
  );
}
