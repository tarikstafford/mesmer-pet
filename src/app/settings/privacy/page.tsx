'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PrivacySettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExportData = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setMessage({ type: 'error', text: 'Not authenticated' });
        return;
      }

      const response = await fetch('/api/privacy/export-data', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mesmer-data-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({ type: 'success', text: 'Data exported successfully!' });
    } catch (error) {
      console.error('Export error:', error);
      setMessage({ type: 'error', text: 'Failed to export data' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
      setMessage({ type: 'error', text: 'Please type "DELETE MY ACCOUNT" to confirm' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setMessage({ type: 'error', text: 'Not authenticated' });
        return;
      }

      const response = await fetch('/api/privacy/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ confirmationText: deleteConfirmText }),
      });

      if (!response.ok) {
        throw new Error('Deletion failed');
      }

      // Clear local storage and redirect to home
      localStorage.clear();
      setMessage({ type: 'success', text: 'Account deleted successfully. Redirecting...' });

      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      console.error('Delete error:', error);
      setMessage({ type: 'error', text: 'Failed to delete account' });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Settings</h1>
          <p className="text-gray-600 mb-8">Manage your data and privacy preferences</p>

          {message && (
            <div className={`p-4 rounded-lg mb-6 ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* Data Export */}
          <section className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">📥 Data Export</h2>
            <p className="text-gray-600 mb-4">
              Download all your data in JSON format. This includes your account information, pets, conversations,
              skills, and more.
            </p>
            <button
              onClick={handleExportData}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Exporting...' : 'Export My Data'}
            </button>
            <p className="text-sm text-gray-500 mt-2">
              You have the right to access your data under GDPR and CCPA regulations.
            </p>
          </section>

          {/* Privacy Policy & Terms */}
          <section className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">📜 Legal Documents</h2>
            <div className="space-y-3">
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:text-blue-800 font-medium"
              >
                Privacy Policy →
              </a>
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:text-blue-800 font-medium"
              >
                Terms of Service →
              </a>
            </div>
          </section>

          {/* Cookie Preferences */}
          <section className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">🍪 Cookie Preferences</h2>
            <p className="text-gray-600 mb-4">
              Manage your cookie preferences. Clear your browser's local storage to see the cookie consent banner again.
            </p>
            <button
              onClick={() => {
                localStorage.removeItem('cookieConsent');
                setMessage({ type: 'success', text: 'Cookie preferences cleared. Refresh the page to see the banner.' });
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Reset Cookie Preferences
            </button>
          </section>

          {/* Account Deletion */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-red-600 mb-3">🗑️ Delete Account</h2>
            <p className="text-gray-600 mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Delete My Account
              </button>
            ) : (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-3">⚠️ Confirm Account Deletion</h3>
                <p className="text-red-700 mb-4">
                  This will permanently delete:
                </p>
                <ul className="list-disc pl-6 text-red-700 mb-4 space-y-1">
                  <li>All your pets and their data</li>
                  <li>All conversations and memories</li>
                  <li>All purchased skills and items</li>
                  <li>Your account and login credentials</li>
                  <li>All engagement data and progress</li>
                </ul>
                <p className="text-red-700 mb-4 font-semibold">
                  Type "DELETE MY ACCOUNT" to confirm:
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  className="w-full px-4 py-2 border-2 border-red-300 rounded-lg mb-4 focus:outline-none focus:border-red-500"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={loading || deleteConfirmText !== 'DELETE MY ACCOUNT'}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex-1"
                  >
                    {loading ? 'Deleting...' : 'Confirm Deletion'}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                    }}
                    disabled={loading}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-medium transition-colors flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>

          <div className="pt-6 border-t border-gray-200">
            <a href="/dashboard" className="text-blue-600 hover:text-blue-800 font-medium">
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
