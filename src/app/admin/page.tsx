'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Skill {
  id: string;
  skillName: string;
  category: string;
  description: string;
  price: number;
  featured: boolean;
  icon: string | null;
  active: boolean;
  _count?: {
    userSkills: number;
    petSkills: number;
  };
}

interface SkillAnalytics {
  skillId: string;
  skillName: string;
  category: string;
  price: number;
  featured: boolean;
  active: boolean;
  totalPurchases: number;
  totalRevenue: number;
  totalActivations: number;
  purchasesLast7Days: number;
  purchasesLast30Days: number;
  activationRate: number;
}

interface AnalyticsSummary {
  totalSkills: number;
  activeSkills: number;
  totalPurchases: number;
  totalRevenue: number;
  averagePrice: number;
  purchasesLast7Days: number;
  purchasesLast30Days: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [analytics, setAnalytics] = useState<SkillAnalytics[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    skillName: '',
    category: 'education' as 'education' | 'games' | 'arts' | 'sports',
    description: '',
    price: 0.99,
    featured: false,
    icon: '',
    active: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/auth/login?redirect=/admin');
      return;
    }
    setAuthToken(token);
  }, [router]);

  useEffect(() => {
    if (authToken) {
      fetchSkills();
    }
  }, [authToken]);

  const fetchSkills = async () => {
    if (!authToken) return;

    try {
      const response = await fetch('/api/admin/skills/list', {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });

      if (response.status === 403 || response.status === 401) {
        setError('Unauthorized: Admin access required');
        setTimeout(() => router.push('/dashboard'), 2000);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch skills');
      }

      const data = await response.json();
      setSkills(data.skills);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load skills');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    if (!authToken) return;

    try {
      const response = await fetch('/api/admin/analytics/skills', {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data.analytics);
      setSummary(data.summary);
      setShowAnalytics(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    }
  };

  const handleCreateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;

    try {
      const response = await fetch('/api/admin/skills/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create skill');
      }

      setSuccessMessage('Skill created successfully!');
      setShowCreateForm(false);
      setFormData({
        skillName: '',
        category: 'education',
        description: '',
        price: 0.99,
        featured: false,
        icon: '',
        active: true,
      });
      fetchSkills();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create skill');
    }
  };

  const handleUpdateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken || !editingSkill) return;

    try {
      const response = await fetch('/api/admin/skills/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          skillId: editingSkill.id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update skill');
      }

      setSuccessMessage('Skill updated successfully!');
      setEditingSkill(null);
      fetchSkills();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update skill');
    }
  };

  const handleToggleActive = async (skillId: string, currentActive: boolean) => {
    if (!authToken) return;

    try {
      const response = await fetch('/api/admin/skills/toggle', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          skillId,
          active: !currentActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to toggle skill');
      }

      setSuccessMessage(data.message);
      fetchSkills();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle skill');
    }
  };

  const startEdit = (skill: Skill) => {
    setEditingSkill(skill);
    setFormData({
      skillName: skill.skillName,
      category: skill.category as any,
      description: skill.description,
      price: skill.price,
      featured: skill.featured,
      icon: skill.icon || '',
      active: skill.active,
    });
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingSkill(null);
    setFormData({
      skillName: '',
      category: 'education',
      description: '',
      price: 0.99,
      featured: false,
      icon: '',
      active: true,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">🔧 Admin Dashboard</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-500 text-white rounded-lg">
            ✅ {successMessage}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-500 text-white rounded-lg">
            ❌ {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setEditingSkill(null);
              setShowAnalytics(false);
            }}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 font-semibold"
          >
            {showCreateForm ? '✖ Cancel' : '➕ Create New Skill'}
          </button>
          <button
            onClick={() => {
              fetchAnalytics();
              setShowCreateForm(false);
              setEditingSkill(null);
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 font-semibold"
          >
            📊 View Analytics
          </button>
        </div>

        {/* Create/Edit Form */}
        {(showCreateForm || editingSkill) && (
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">
              {editingSkill ? '✏️ Edit Skill' : '➕ Create New Skill'}
            </h2>
            <form onSubmit={editingSkill ? handleUpdateSkill : handleCreateSkill}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white mb-2">Skill Name</label>
                  <input
                    type="text"
                    value={formData.skillName}
                    onChange={(e) => setFormData({ ...formData, skillName: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30"
                  >
                    <option value="education">📚 Education</option>
                    <option value="games">🎮 Games</option>
                    <option value="arts">🎨 Arts</option>
                    <option value="sports">⚽ Sports</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-white mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">Price (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">Icon (emoji or URL)</label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30"
                    placeholder="🎓"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="w-5 h-5"
                    />
                    ⭐ Featured
                  </label>
                  <label className="flex items-center gap-2 text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="w-5 h-5"
                    />
                    ✅ Active
                  </label>
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 font-semibold"
                >
                  {editingSkill ? '💾 Update Skill' : '➕ Create Skill'}
                </button>
                {editingSkill && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
                  >
                    ✖ Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Analytics View */}
        {showAnalytics && summary && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">📊 Purchase Analytics</h2>

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
                <div className="text-white/70 text-sm">Total Skills</div>
                <div className="text-3xl font-bold text-white">{summary.totalSkills}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
                <div className="text-white/70 text-sm">Total Purchases</div>
                <div className="text-3xl font-bold text-white">{summary.totalPurchases}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
                <div className="text-white/70 text-sm">Total Revenue</div>
                <div className="text-3xl font-bold text-white">${summary.totalRevenue.toFixed(2)}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
                <div className="text-white/70 text-sm">Last 7 Days</div>
                <div className="text-3xl font-bold text-white">{summary.purchasesLast7Days}</div>
              </div>
            </div>

            {/* Analytics Table */}
            <div className="bg-white/10 backdrop-blur-md rounded-lg overflow-hidden border border-white/20">
              <table className="w-full">
                <thead className="bg-white/10">
                  <tr>
                    <th className="px-4 py-3 text-left text-white">Skill Name</th>
                    <th className="px-4 py-3 text-left text-white">Category</th>
                    <th className="px-4 py-3 text-left text-white">Purchases</th>
                    <th className="px-4 py-3 text-left text-white">Revenue</th>
                    <th className="px-4 py-3 text-left text-white">Activations</th>
                    <th className="px-4 py-3 text-left text-white">Rate</th>
                    <th className="px-4 py-3 text-left text-white">7d / 30d</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.map((skill) => (
                    <tr key={skill.skillId} className="border-t border-white/10">
                      <td className="px-4 py-3 text-white">{skill.skillName}</td>
                      <td className="px-4 py-3 text-white/70">{skill.category}</td>
                      <td className="px-4 py-3 text-white font-semibold">{skill.totalPurchases}</td>
                      <td className="px-4 py-3 text-green-400">${skill.totalRevenue.toFixed(2)}</td>
                      <td className="px-4 py-3 text-white">{skill.totalActivations}</td>
                      <td className="px-4 py-3 text-white">{skill.activationRate.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-white/70">
                        {skill.purchasesLast7Days} / {skill.purchasesLast30Days}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Skills List */}
        {!showAnalytics && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">🎯 All Skills ({skills.length})</h2>
            <div className="grid gap-4">
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  className={`bg-white/10 backdrop-blur-md rounded-lg p-6 border ${
                    skill.active ? 'border-green-500/50' : 'border-red-500/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {skill.icon && <span className="text-3xl">{skill.icon}</span>}
                        <h3 className="text-2xl font-bold text-white">{skill.skillName}</h3>
                        {skill.featured && (
                          <span className="px-3 py-1 bg-yellow-500 text-black rounded-full text-sm font-semibold">
                            ⭐ Featured
                          </span>
                        )}
                        {!skill.active && (
                          <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-semibold">
                            ❌ Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-white/70 mb-3">{skill.description}</p>
                      <div className="flex gap-4 text-sm">
                        <span className="text-white/70">Category: <span className="text-white">{skill.category}</span></span>
                        <span className="text-white/70">Price: <span className="text-green-400">${skill.price.toFixed(2)}</span></span>
                        {skill._count && (
                          <>
                            <span className="text-white/70">Purchases: <span className="text-white">{skill._count.userSkills}</span></span>
                            <span className="text-white/70">Activations: <span className="text-white">{skill._count.petSkills}</span></span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(skill)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(skill.id, skill.active)}
                        className={`px-4 py-2 ${
                          skill.active ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'
                        } text-white rounded-lg`}
                      >
                        {skill.active ? '❌ Deactivate' : '✅ Activate'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
