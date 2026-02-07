'use client';

import { useEffect, useState } from 'react';

interface BreedingRequest {
  id: string;
  requesterPet: {
    id: string;
    name: string;
    generation: number;
    health: number;
  };
  addresseePet: {
    id: string;
    name: string;
    generation: number;
    health: number;
  };
  requester?: {
    id: string;
    email: string;
    name: string | null;
  };
  addressee?: {
    id: string;
    email: string;
    name: string | null;
  };
  createdAt: string;
}

export default function BreedingRequestsPanel() {
  const [receivedRequests, setReceivedRequests] = useState<BreedingRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<BreedingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [offspringName, setOffspringName] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const authToken = localStorage.getItem('authToken');
      const res = await fetch('/api/breeding-requests/list', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setReceivedRequests(data.received);
        setSentRequests(data.sent);
      }
    } catch (error) {
      console.error('Error loading breeding requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    if (!offspringName.trim()) {
      setMessage({ type: 'error', text: 'Please enter a name for the offspring' });
      return;
    }

    setActionLoading(requestId);
    try {
      const authToken = localStorage.getItem('authToken');
      const res = await fetch('/api/breeding-requests/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ requestId, offspringName }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `Offspring "${offspringName}" created successfully!` });
        setOffspringName('');
        setSelectedRequest(null);
        await loadRequests();
        // Reload page to show new pet
        window.location.reload();
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Failed to accept breeding request' });
      }
    } catch (error) {
      console.error('Error accepting breeding request:', error);
      setMessage({ type: 'error', text: 'Failed to accept breeding request' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const authToken = localStorage.getItem('authToken');
      const res = await fetch('/api/breeding-requests/decline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ requestId }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Breeding request declined' });
        await loadRequests();
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Failed to decline breeding request' });
      }
    } catch (error) {
      console.error('Error declining breeding request:', error);
      setMessage({ type: 'error', text: 'Failed to decline breeding request' });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div className="text-gray-600">Loading breeding requests...</div>;
  }

  if (receivedRequests.length === 0 && sentRequests.length === 0) {
    return null; // Don't show panel if no requests
  }

  return (
    <div className="mb-8">
      {message && (
        <div
          className={`mb-4 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-4 font-bold">
            ×
          </button>
        </div>
      )}

      {/* Received Breeding Requests */}
      {receivedRequests.length > 0 && (
        <div className="bg-pink-50 border-2 border-pink-300 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-pink-900 mb-4">
            💕 Breeding Requests ({receivedRequests.length})
          </h3>
          <div className="space-y-4">
            {receivedRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium">
                      From: {request.requester?.name || request.requester?.email}
                    </p>
                    <p className="text-sm text-gray-600">
                      Wants to breed <strong>{request.requesterPet.name}</strong> (Gen{' '}
                      {request.requesterPet.generation}) with your <strong>{request.addresseePet.name}</strong>{' '}
                      (Gen {request.addresseePet.generation})
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {selectedRequest === request.id ? (
                  <div className="mt-3 space-y-3">
                    <input
                      type="text"
                      placeholder="Name for the offspring..."
                      value={offspringName}
                      onChange={(e) => setOffspringName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      maxLength={30}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(request.id)}
                        disabled={actionLoading === request.id || !offspringName.trim()}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {actionLoading === request.id ? '...' : '✓ Confirm'}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRequest(null);
                          setOffspringName('');
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setSelectedRequest(request.id)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      ✓ Accept
                    </button>
                    <button
                      onClick={() => handleDecline(request.id)}
                      disabled={actionLoading === request.id}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {actionLoading === request.id ? '...' : '✗ Decline'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sent Breeding Requests */}
      {sentRequests.length > 0 && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
          <h3 className="text-xl font-bold text-blue-900 mb-4">
            📤 Sent Breeding Requests ({sentRequests.length})
          </h3>
          <div className="space-y-3">
            {sentRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg p-4">
                <p className="font-medium">
                  To: {request.addressee?.name || request.addressee?.email}
                </p>
                <p className="text-sm text-gray-600">
                  Your <strong>{request.requesterPet.name}</strong> with their{' '}
                  <strong>{request.addresseePet.name}</strong>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Sent {new Date(request.createdAt).toLocaleDateString()} • ⏳ Pending
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
