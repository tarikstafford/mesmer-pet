'use client';

import { useEffect, useState } from 'react';

interface Trait {
  id: string;
  traitName: string;
  traitType: string;
  rarity: string;
  description: string;
  inheritanceSource: string;
}

interface PetNode {
  id: string;
  name: string;
  generation: number;
  createdAt: string;
  traits: Trait[];
  personality: {
    friendliness: number;
    energyTrait: number;
    curiosity: number;
    patience: number;
    playfulness: number;
  };
}

interface FamilyTreeData {
  pet: PetNode;
  parents: {
    parent1: PetNode | null;
    parent2: PetNode | null;
  };
  grandparents: {
    parent1Parents: {
      parent1: PetNode | null;
      parent2: PetNode | null;
    };
    parent2Parents: {
      parent1: PetNode | null;
      parent2: PetNode | null;
    };
  } | null;
}

interface FamilyTreeProps {
  petId: string;
  onClose: () => void;
}

export default function FamilyTree({ petId, onClose }: FamilyTreeProps) {
  const [familyTree, setFamilyTree] = useState<FamilyTreeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPet, setSelectedPet] = useState<PetNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFamilyTree();
  }, [petId]);

  const fetchFamilyTree = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pets/family-tree/${petId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch family tree');
      }

      const data = await response.json();
      setFamilyTree(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching family tree:', err);
      setError('Failed to load family tree');
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary': return 'text-yellow-400 border-yellow-400';
      case 'rare': return 'text-purple-400 border-purple-400';
      case 'uncommon': return 'text-blue-400 border-blue-400';
      case 'common': return 'text-gray-400 border-gray-400';
      default: return 'text-gray-300 border-gray-300';
    }
  };

  const getInheritanceColor = (source: string) => {
    switch (source) {
      case 'parent1': return 'bg-blue-500/20 text-blue-300';
      case 'parent2': return 'bg-green-500/20 text-green-300';
      case 'mutation': return 'bg-pink-500/20 text-pink-300';
      case 'initial': return 'bg-gray-500/20 text-gray-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getInheritanceLabel = (source: string) => {
    switch (source) {
      case 'parent1': return 'From Parent 1';
      case 'parent2': return 'From Parent 2';
      case 'mutation': return 'Mutation ✨';
      case 'initial': return 'Original';
      default: return source;
    }
  };

  const renderPetCard = (pet: PetNode | null, label: string, onClick?: () => void) => {
    if (!pet) {
      return (
        <div className="border border-dashed border-gray-600 rounded-lg p-4 text-center text-gray-500 w-48">
          <p className="text-sm">{label}</p>
          <p className="text-xs mt-2">No data</p>
        </div>
      );
    }

    return (
      <div
        onClick={onClick}
        className={`border-2 border-gray-700 rounded-lg p-4 w-48 bg-gray-800/50 ${onClick ? 'cursor-pointer hover:border-blue-500 transition-colors' : ''}`}
      >
        <div className="text-center">
          <p className="text-sm font-semibold text-white">{pet.name}</p>
          <p className="text-xs text-gray-400">Generation {pet.generation}</p>
          <div className="mt-2 flex justify-center flex-wrap gap-1">
            {pet.traits.slice(0, 3).map((trait) => (
              <span
                key={trait.id}
                className={`text-[10px] px-1.5 py-0.5 rounded border ${getRarityColor(trait.rarity)}`}
                title={trait.traitName}
              >
                {trait.traitName.slice(0, 8)}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-gray-900 p-8 rounded-lg border border-gray-700">
          <p className="text-white">Loading family tree...</p>
        </div>
      </div>
    );
  }

  if (error || !familyTree) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-gray-900 p-8 rounded-lg border border-gray-700">
          <p className="text-red-400">{error || 'Failed to load'}</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-auto p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-6xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">
            Family Tree: {familyTree.pet.name}
          </h2>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
          >
            Close
          </button>
        </div>

        {/* Tree Visualization */}
        <div className="p-8">
          {/* Grandparents Row */}
          {familyTree.grandparents && (
            <div className="mb-8">
              <p className="text-center text-sm text-gray-400 mb-4">Grandparents (Gen {familyTree.pet.generation - 2})</p>
              <div className="flex justify-center gap-8">
                <div className="flex gap-4">
                  {renderPetCard(
                    familyTree.grandparents.parent1Parents.parent1,
                    "Parent 1's Parent 1",
                    familyTree.grandparents.parent1Parents.parent1 ? () => setSelectedPet(familyTree.grandparents!.parent1Parents.parent1) : undefined
                  )}
                  {renderPetCard(
                    familyTree.grandparents.parent1Parents.parent2,
                    "Parent 1's Parent 2",
                    familyTree.grandparents.parent1Parents.parent2 ? () => setSelectedPet(familyTree.grandparents!.parent1Parents.parent2) : undefined
                  )}
                </div>
                <div className="flex gap-4">
                  {renderPetCard(
                    familyTree.grandparents.parent2Parents.parent1,
                    "Parent 2's Parent 1",
                    familyTree.grandparents.parent2Parents.parent1 ? () => setSelectedPet(familyTree.grandparents!.parent2Parents.parent1) : undefined
                  )}
                  {renderPetCard(
                    familyTree.grandparents.parent2Parents.parent2,
                    "Parent 2's Parent 2",
                    familyTree.grandparents.parent2Parents.parent2 ? () => setSelectedPet(familyTree.grandparents!.parent2Parents.parent2) : undefined
                  )}
                </div>
              </div>
              {/* Connection lines to parents */}
              <div className="flex justify-center gap-8 mt-4">
                <div className="h-12 border-l-2 border-gray-600 w-24"></div>
                <div className="h-12 border-l-2 border-gray-600 w-24"></div>
              </div>
            </div>
          )}

          {/* Parents Row */}
          {(familyTree.parents.parent1 || familyTree.parents.parent2) && (
            <div className="mb-8">
              <p className="text-center text-sm text-gray-400 mb-4">Parents (Gen {familyTree.pet.generation - 1})</p>
              <div className="flex justify-center gap-12">
                {renderPetCard(
                  familyTree.parents.parent1,
                  "Parent 1",
                  familyTree.parents.parent1 ? () => setSelectedPet(familyTree.parents.parent1) : undefined
                )}
                {renderPetCard(
                  familyTree.parents.parent2,
                  "Parent 2",
                  familyTree.parents.parent2 ? () => setSelectedPet(familyTree.parents.parent2) : undefined
                )}
              </div>
              {/* Connection line to current pet */}
              <div className="flex justify-center mt-4">
                <div className="h-12 border-l-2 border-gray-600"></div>
              </div>
            </div>
          )}

          {/* Current Pet Row */}
          <div>
            <p className="text-center text-sm text-gray-400 mb-4">Current Pet (Gen {familyTree.pet.generation})</p>
            <div className="flex justify-center">
              {renderPetCard(
                familyTree.pet,
                familyTree.pet.name,
                () => setSelectedPet(familyTree.pet)
              )}
            </div>
          </div>

          {/* No lineage message */}
          {!familyTree.parents.parent1 && !familyTree.parents.parent2 && (
            <div className="text-center mt-8 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
              <p className="text-gray-400">
                {familyTree.pet.name} is a first-generation pet with no parents.
              </p>
            </div>
          )}
        </div>

        {/* Selected Pet Details Panel */}
        {selectedPet && (
          <div className="border-t border-gray-700 p-6 bg-gray-800/30">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedPet.name}</h3>
                <p className="text-sm text-gray-400">Generation {selectedPet.generation}</p>
              </div>
              <button
                onClick={() => setSelectedPet(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Traits with inheritance indicators */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-white mb-2">Genetic Traits</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {selectedPet.traits.map((trait) => (
                  <div
                    key={trait.id}
                    className="border border-gray-700 rounded-lg p-3 bg-gray-800/50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className={`text-sm font-medium ${getRarityColor(trait.rarity).split(' ')[0]}`}>
                        {trait.traitName}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${getInheritanceColor(trait.inheritanceSource)}`}>
                        {getInheritanceLabel(trait.inheritanceSource)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{trait.description}</p>
                    <p className="text-[10px] text-gray-500 mt-1 capitalize">{trait.traitType} • {trait.rarity}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Personality traits */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-2">Personality</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="text-center">
                  <p className="text-xs text-gray-400">Friendliness</p>
                  <p className="text-lg font-bold text-purple-400">{selectedPet.personality.friendliness}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Energy</p>
                  <p className="text-lg font-bold text-yellow-400">{selectedPet.personality.energyTrait}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Curiosity</p>
                  <p className="text-lg font-bold text-blue-400">{selectedPet.personality.curiosity}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Patience</p>
                  <p className="text-lg font-bold text-teal-400">{selectedPet.personality.patience}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Playfulness</p>
                  <p className="text-lg font-bold text-pink-400">{selectedPet.personality.playfulness}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="border-t border-gray-700 p-6 bg-gray-800/30">
          <h4 className="text-sm font-semibold text-white mb-3">Legend</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Inheritance:</p>
              <div className="space-y-1">
                <div className={`text-xs px-2 py-1 rounded inline-block ${getInheritanceColor('parent1')}`}>
                  From Parent 1
                </div>
                <div className={`text-xs px-2 py-1 rounded inline-block ${getInheritanceColor('parent2')}`}>
                  From Parent 2
                </div>
                <div className={`text-xs px-2 py-1 rounded inline-block ${getInheritanceColor('mutation')}`}>
                  Mutation ✨
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Rarity:</p>
              <div className="space-y-1">
                <div className={`text-xs ${getRarityColor('legendary').split(' ')[0]}`}>◆ Legendary</div>
                <div className={`text-xs ${getRarityColor('rare').split(' ')[0]}`}>◆ Rare</div>
                <div className={`text-xs ${getRarityColor('uncommon').split(' ')[0]}`}>◆ Uncommon</div>
                <div className={`text-xs ${getRarityColor('common').split(' ')[0]}`}>◆ Common</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
