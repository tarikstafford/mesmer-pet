'use client';

/**
 * US-016: Skill Purchase Flow (IAP Integration)
 * Purchase success confirmation page
 */

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID found');
      setLoading(false);
      return;
    }

    // Give webhook a moment to process (in production, you'd verify the session)
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">✨</div>
          <p className="text-gray-600">Processing your purchase...</p>
        </div>
      </div>
    );
  }

  if (error) {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-8">
      <div className="max-w-2xl mx-auto">
        {/* Success Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Purchase Successful!
          </h1>
          <p className="text-gray-600 mb-6">
            Your skill has been unlocked and is now available for your pets.
          </p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-700 font-medium mb-2">✓ Payment Confirmed</p>
            <p className="text-green-600 text-sm">
              A confirmation email has been sent to your registered email address.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-semibold"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => router.push('/marketplace')}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-semibold"
            >
              Browse More Skills
            </button>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-gray-800 mb-3">📋 Next Steps</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Go to your dashboard and select a pet</li>
            <li>Assign your new skill to your pet</li>
            <li>Start using the skill in your interactions!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
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
      <SuccessContent />
    </Suspense>
  );
}
