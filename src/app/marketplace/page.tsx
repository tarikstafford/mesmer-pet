'use client';

/**
 * US-015: Skill Marketplace UI
 * Browse and filter available skills for purchase
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Skill {
  id: string;
  skillName: string;
  category: string;
  description: string;
  price: number;
  featured: boolean;
  icon: string | null;
  owned: boolean;
}

// Skill category icons
const categoryIcons: Record<string, string> = {
  education: '📚',
  games: '🎮',
  arts: '🎨',
  sports: '⚽',
};

// Price range presets
const priceRanges = [
  { label: 'All Prices', min: null, max: null },
  { label: 'Free', min: 0, max: 0 },
  { label: 'Under $1', min: 0, max: 0.99 },
  { label: '$1 - $2', min: 1, max: 1.99 },
  { label: '$2 - $5', min: 2, max: 4.99 },
  { label: '$5+', min: 5, max: null },
];

export default function MarketplacePage() {
  const router = useRouter();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState(0); // Index in priceRanges
  const [searchQuery, setSearchQuery] = useState('');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  // Get userId from auth token
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserId(payload.userId);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  // Fetch skills when filters change
  useEffect(() => {
    fetchSkills();
  }, [selectedCategory, selectedPriceRange, searchQuery, showFeaturedOnly, userId]);

  async function fetchSkills() {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (userId) params.append('userId', userId);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);

      const priceRange = priceRanges[selectedPriceRange];
      if (priceRange.min !== null) params.append('minPrice', priceRange.min.toString());
      if (priceRange.max !== null) params.append('maxPrice', priceRange.max.toString());

      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (showFeaturedOnly) params.append('featured', 'true');

      const response = await fetch(`/api/marketplace/skills?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setSkills(data.skills);
      } else {
        console.error('Error fetching skills:', data.error);
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
    } finally {
      setLoading(false);
    }
  }

  function handlePurchase(skillId: string) {
    // Navigate to purchase flow (US-016)
    router.push(`/marketplace/purchase?skillId=${skillId}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="mb-4 text-purple-600 hover:text-purple-700"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Skill Marketplace</h1>
          <p className="text-gray-600">Unlock new abilities for your pets</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Categories</option>
                <option value="education">📚 Education</option>
                <option value="games">🎮 Games</option>
                <option value="arts">🎨 Arts</option>
                <option value="sports">⚽ Sports</option>
              </select>
            </div>

            {/* Price Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range
              </label>
              <select
                value={selectedPriceRange}
                onChange={(e) => setSelectedPriceRange(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {priceRanges.map((range, index) => (
                  <option key={index} value={index}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Featured Toggle */}
            <div className="flex items-end">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFeaturedOnly}
                  onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  ⭐ Featured Only
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-gray-600">
          {loading ? 'Loading...' : `${skills.length} skills found`}
        </div>

        {/* Skills Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⌛</div>
            <p className="text-gray-600">Loading skills...</p>
          </div>
        ) : skills.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-gray-600">No skills found matching your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className={`bg-white rounded-lg shadow-md p-6 border-2 transition-all hover:shadow-lg ${
                  skill.featured ? 'border-yellow-400' : 'border-transparent'
                } ${skill.owned ? 'opacity-75' : ''}`}
              >
                {/* Featured Badge */}
                {skill.featured && (
                  <div className="mb-2">
                    <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded">
                      ⭐ Featured
                    </span>
                  </div>
                )}

                {/* Skill Header */}
                <div className="flex items-start mb-3">
                  <div className="text-4xl mr-3">
                    {skill.icon || categoryIcons[skill.category] || '📦'}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">
                      {skill.skillName}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        {skill.category}
                      </span>
                      {skill.owned && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-semibold">
                          ✓ Owned
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {skill.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-xl font-bold text-purple-600">
                    ${skill.price.toFixed(2)}
                  </div>
                  {skill.owned ? (
                    <button
                      disabled
                      className="px-4 py-2 bg-gray-300 text-gray-600 rounded-md cursor-not-allowed"
                    >
                      Already Owned
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePurchase(skill.id)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                    >
                      Purchase
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
