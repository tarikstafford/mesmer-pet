'use client';

import { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true, // Always true, cannot be disabled
    analytics: false,
    preferences: false,
  });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check if user has already given consent
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      // Check if user is likely in EU (basic check via timezone, not perfect but sufficient for MVP)
      const isLikelyEU = Intl.DateTimeFormat().resolvedOptions().timeZone.includes('Europe');

      // Show banner for all users for GDPR compliance (not just EU)
      // This is a best practice to show consent to everyone
      setShowBanner(true);
    } else {
      // Load saved preferences
      try {
        const saved = JSON.parse(consent);
        setPreferences(saved);
      } catch (e) {
        console.error('Failed to parse cookie consent', e);
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const consent = {
      essential: true,
      analytics: true,
      preferences: true,
    };
    localStorage.setItem('cookieConsent', JSON.stringify(consent));
    setPreferences(consent);
    setShowBanner(false);

    // Update user's cookie consent in database
    updateCookieConsent(true);
  };

  const handleAcceptEssential = () => {
    const consent = {
      essential: true,
      analytics: false,
      preferences: false,
    };
    localStorage.setItem('cookieConsent', JSON.stringify(consent));
    setPreferences(consent);
    setShowBanner(false);

    // Update user's cookie consent in database
    updateCookieConsent(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('cookieConsent', JSON.stringify(preferences));
    setShowBanner(false);

    // Update user's cookie consent in database
    updateCookieConsent(preferences.analytics || preferences.preferences);
  };

  const updateCookieConsent = async (hasConsent: boolean) => {
    // Get auth token
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      await fetch('/api/privacy/cookie-consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ cookieConsent: hasConsent }),
      });
    } catch (error) {
      console.error('Failed to update cookie consent:', error);
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-6 shadow-lg z-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">🍪 We value your privacy</h3>
            <p className="text-sm text-gray-300 mb-3">
              We use cookies to enhance your experience, analyze site traffic, and personalize content.
              You can choose which cookies to accept.
            </p>
            {showDetails && (
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={preferences.essential}
                    disabled
                    className="mt-1"
                  />
                  <div>
                    <strong>Essential Cookies (Required)</strong>
                    <p className="text-gray-400">Necessary for login, authentication, and basic app functionality.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                    className="mt-1"
                  />
                  <div>
                    <strong>Analytics Cookies (Optional)</strong>
                    <p className="text-gray-400">Help us understand how you use the app to improve performance.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={preferences.preferences}
                    onChange={(e) => setPreferences({ ...preferences, preferences: e.target.checked })}
                    className="mt-1"
                  />
                  <div>
                    <strong>Preference Cookies (Optional)</strong>
                    <p className="text-gray-400">Remember your settings and personalize your experience.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 w-full md:w-auto">
            <button
              onClick={handleAcceptAll}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Accept All
            </button>
            <button
              onClick={handleAcceptEssential}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Essential Only
            </button>
            {showDetails ? (
              <button
                onClick={handleSavePreferences}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Save Preferences
              </button>
            ) : (
              <button
                onClick={() => setShowDetails(true)}
                className="text-gray-300 hover:text-white px-6 py-2 rounded-lg font-medium transition-colors border border-gray-600"
              >
                Customize
              </button>
            )}
            <a
              href="/privacy"
              className="text-xs text-gray-400 hover:text-gray-200 text-center mt-1"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
