'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Friend {
  friendshipId: string;
  friendId: string;
  email: string;
  name: string | null;
  createdAt: string;
  friendsSince: string;
}

interface FriendRequest {
  id: string;
  requester: {
    id: string;
    email: string;
    name: string | null;
  };
  createdAt: string;
}

interface SentRequest {
  id: string;
  addressee: {
    id: string;
    email: string;
    name: string | null;
  };
  createdAt: string;
}

interface SearchResult {
  id: string;
  email: string;
  name: string | null;
  friendshipStatus: string;
  friendshipId: string | null;
}

function FriendsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      router.push('/auth/login');
      return;
    }

    loadFriendsData();
  }, []);

  useEffect(() => {
    // Check for success messages from URL params
    const friendAdded = searchParams.get('friendAdded');
    if (friendAdded) {
      setMessage({ type: 'success', text: 'Friend added successfully!' });
      // Clear the param
      router.replace('/friends');
    }
  }, [searchParams]);

  const loadFriendsData = async () => {
    try {
      const authToken = localStorage.getItem('authToken');
      const headers = {
        Authorization: `Bearer ${authToken}`,
      };

      const [friendsRes, requestsRes] = await Promise.all([
        fetch('/api/friends/list', { headers }),
        fetch('/api/friends/requests', { headers }),
      ]);

      if (friendsRes.ok) {
        const friendsData = await friendsRes.json();
        setFriends(friendsData.friends);
      }

      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        setReceivedRequests(requestsData.received);
        setSentRequests(requestsData.sent);
      }
    } catch (error) {
      console.error('Error loading friends data:', error);
      setMessage({ type: 'error', text: 'Failed to load friends data' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.length < 2) {
      setMessage({ type: 'error', text: 'Search query must be at least 2 characters' });
      return;
    }

    try {
      const authToken = localStorage.getItem('authToken');
      const res = await fetch(`/api/friends/search?email=${encodeURIComponent(searchQuery)}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users);
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Search failed' });
      }
    } catch (error) {
      console.error('Error searching:', error);
      setMessage({ type: 'error', text: 'Failed to search users' });
    }
  };

  const handleSendRequest = async (addresseeId: string) => {
    setActionLoading(addresseeId);
    try {
      const authToken = localStorage.getItem('authToken');
      const res = await fetch('/api/friends/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ addresseeId }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Friend request sent!' });
        await loadFriendsData();
        await handleSearch(); // Refresh search results
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Failed to send request' });
      }
    } catch (error) {
      console.error('Error sending request:', error);
      setMessage({ type: 'error', text: 'Failed to send friend request' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptRequest = async (friendshipId: string) => {
    setActionLoading(friendshipId);
    try {
      const authToken = localStorage.getItem('authToken');
      const res = await fetch('/api/friends/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ friendshipId }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Friend request accepted!' });
        await loadFriendsData();
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Failed to accept request' });
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      setMessage({ type: 'error', text: 'Failed to accept friend request' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineRequest = async (friendshipId: string) => {
    setActionLoading(friendshipId);
    try {
      const authToken = localStorage.getItem('authToken');
      const res = await fetch('/api/friends/decline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ friendshipId }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Friend request declined' });
        await loadFriendsData();
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Failed to decline request' });
      }
    } catch (error) {
      console.error('Error declining request:', error);
      setMessage({ type: 'error', text: 'Failed to decline friend request' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) {
      return;
    }

    setActionLoading(friendId);
    try {
      const authToken = localStorage.getItem('authToken');
      const res = await fetch('/api/friends/remove', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ friendId }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Friend removed' });
        await loadFriendsData();
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Failed to remove friend' });
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      setMessage({ type: 'error', text: 'Failed to remove friend' });
    } finally {
      setActionLoading(null);
    }
  };

  const viewFriendPets = (friendId: string) => {
    router.push(`/friends/pets/${friendId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-blue-100 flex items-center justify-center">
        <div className="text-xl">Loading friends...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-blue-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-purple-900 mb-2">👥 Friends</h1>
            <p className="text-gray-600">
              {friends.length} / 50 friends • {receivedRequests.length} pending requests
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            ← Back to Dashboard
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

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-purple-900 mb-4">🔍 Find Friends</h2>
          <div className="flex gap-4">
            <input
              type="email"
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Search
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {searchResults.map((user) => (
                <div key={user.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{user.name || user.email}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  {user.friendshipStatus === 'none' ? (
                    <button
                      onClick={() => handleSendRequest(user.id)}
                      disabled={actionLoading === user.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {actionLoading === user.id ? '...' : '+ Add Friend'}
                    </button>
                  ) : user.friendshipStatus === 'pending' ? (
                    <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">Pending</span>
                  ) : (
                    <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg">✓ Friends</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Requests */}
        {receivedRequests.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-purple-900 mb-4">📬 Pending Requests</h2>
            <div className="space-y-3">
              {receivedRequests.map((request) => (
                <div key={request.id} className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium">{request.requester.name || request.requester.email}</p>
                    <p className="text-sm text-gray-600">{request.requester.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptRequest(request.id)}
                      disabled={actionLoading === request.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {actionLoading === request.id ? '...' : '✓ Accept'}
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(request.id)}
                      disabled={actionLoading === request.id}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {actionLoading === request.id ? '...' : '✗ Decline'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sent Requests */}
        {sentRequests.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-purple-900 mb-4">📤 Sent Requests</h2>
            <div className="space-y-3">
              {sentRequests.map((request) => (
                <div key={request.id} className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium">{request.addressee.name || request.addressee.email}</p>
                    <p className="text-sm text-gray-600">{request.addressee.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Sent {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">⏳ Pending</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-purple-900 mb-4">✨ My Friends</h2>
          {friends.length === 0 ? (
            <p className="text-gray-600">No friends yet. Use the search above to find friends!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {friends.map((friend) => (
                <div key={friend.friendshipId} className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-bold text-lg">{friend.name || friend.email}</p>
                      <p className="text-sm text-gray-600">{friend.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Friends since {new Date(friend.friendsSince).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-2xl">🟢</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => viewFriendPets(friend.friendId)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      View Pets
                    </button>
                    <button
                      onClick={() => handleRemoveFriend(friend.friendId)}
                      disabled={actionLoading === friend.friendId}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm disabled:opacity-50"
                    >
                      {actionLoading === friend.friendId ? '...' : 'Remove'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FriendsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-purple-100 to-blue-100 flex items-center justify-center"><div className="text-xl">Loading...</div></div>}>
      <FriendsContent />
    </Suspense>
  );
}
