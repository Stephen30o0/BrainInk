import * as React from 'react';
import { useState, useEffect } from 'react';
import { Users, Plus, TrendingUp, Zap, Trophy, Target, AlertCircle } from 'lucide-react';
import { squadService, SquadMember, Squad } from '../services/squadService';
import { SquadChatInterface } from './SquadChatInterface';
import { SquadFormationModal } from './SquadFormationModal';

export const GroupChatsTab = () => {
  const [squads, setSquads] = useState<Squad[]>([]);
  const [selectedSquad, setSelectedSquad] = useState<Squad | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSquads();
  }, []);

  // Fetch squads for the current user
  const loadSquads = async () => {
    try {
      setLoading(true);
      setError(null);
      const userSquads = await squadService.getUserSquads();
      setSquads(userSquads);
    } catch (error) {
      console.error('Error loading squads:', error);
      setError('Failed to load squads. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle squad creation
  const handleSquadCreated = (newSquad: Squad) => {
    setSquads(prev => [newSquad, ...prev]);
    setShowCreateModal(false);
    loadSquads();
  };

  // Handle squad update
  const handleSquadUpdated = async () => {
    await loadSquads();
    if (selectedSquad) {
      setSquads(currentSquads => {
        const updatedSquad = currentSquads.find(s => s.id === selectedSquad.id);
        if (updatedSquad) {
          setSelectedSquad(updatedSquad);
        } else {
          setSelectedSquad(null);
        }
        return currentSquads;
      });
    }
  };

  const calculateBestRank = () => {
    if (squads.length === 0) return '-';
    return Math.min(...squads.map(s => s.rank));
  };

  const calculateTotalXP = () => {
    return squads.reduce((total, squad) => total + squad.weekly_xp, 0);
  };

  if (selectedSquad) {
    return (
      <SquadChatInterface
        squad={selectedSquad} // Remove the type conversion - use direct Squad from squadService
        onBack={() => setSelectedSquad(null)}
        onSquadUpdated={handleSquadUpdated}
      />
    );
  }

  return (
    <div className="h-full flex">
      {/* Squad List */}
      <div className="w-80 border-r border-primary/20 flex flex-col">
        <div className="p-4 border-b border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-pixel text-primary text-lg">Squad Chats</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors"
              disabled={loading}
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Squad Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-blue-400" />
                <span className="text-blue-300 text-sm">Total Squads</span>
              </div>
              <p className="text-xl font-bold text-white mt-1">{squads.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center gap-2">
                <Trophy size={16} className="text-yellow-400" />
                <span className="text-yellow-300 text-sm">Best Rank</span>
              </div>
              <p className="text-xl font-bold text-white mt-1">#{calculateBestRank()}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 col-span-2">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-primary" />
                <span className="text-primary text-sm">Weekly XP</span>
              </div>
              <p className="text-xl font-bold text-white mt-1">{calculateTotalXP().toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Squad List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-400">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              Loading squads...
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <AlertCircle size={48} className="mx-auto mb-4 text-red-400 opacity-50" />
              <h3 className="font-medium text-red-400 mb-2">Error Loading Squads</h3>
              <p className="text-sm text-gray-400 mb-4">{error}</p>
              <button
                onClick={loadSquads}
                className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : squads.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <h3 className="font-medium mb-2">No Squads Yet</h3>
              <p className="text-sm mb-4">Create or join a squad to start collaborating!</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors"
              >
                Create Squad
              </button>
            </div>
          ) : (
            squads.map(squad => (
              <div
                key={squad.id}
                onClick={() => setSelectedSquad(squad)}
                className="p-4 border-b border-primary/10 cursor-pointer hover:bg-primary/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl">
                    {squad.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-white truncate">
                        {squad.name}
                      </h3>
                      {squad.unread_count && squad.unread_count > 0 && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-xs text-white">{squad.unread_count}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm text-gray-400">
                        {squad.members.length} member{squad.members.length !== 1 ? 's' : ''}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-yellow-400">#{squad.rank}</span>
                        <span className="text-xs text-primary">{squad.weekly_xp.toLocaleString()} XP</span>
                      </div>
                    </div>
                    {squad.description && (
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {squad.description}
                      </p>
                    )}
                    {squad.subject_focus && squad.subject_focus.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {squad.subject_focus.slice(0, 2).map((subject, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-primary/10 text-primary rounded"
                          >
                            {subject}
                          </span>
                        ))}
                        {squad.subject_focus.length > 2 && (
                          <span className="px-2 py-1 text-xs bg-gray-500/10 text-gray-400 rounded">
                            +{squad.subject_focus.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Squad Overview */}
      <div className="flex-1 flex items-center justify-center bg-dark/50">
        <div className="text-center text-gray-400">
          <Users size={64} className="mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-medium mb-2">Select a Squad</h3>
          <p className="text-sm mb-6">Choose a squad to view chat, leaderboard, and activities</p>

          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <TrendingUp size={24} className="mx-auto mb-2 text-primary" />
              <h4 className="font-medium text-white">Track Progress</h4>
              <p className="text-xs text-gray-400 mt-1">Visual progress charts and heat maps</p>
            </div>
            <div className="p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
              <Zap size={24} className="mx-auto mb-2 text-yellow-400" />
              <h4 className="font-medium text-white">Quiz Battles</h4>
              <p className="text-xs text-gray-400 mt-1">Compete with other squads</p>
            </div>
            <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
              <Target size={24} className="mx-auto mb-2 text-green-400" />
              <h4 className="font-medium text-white">Study Goals</h4>
              <p className="text-xs text-gray-400 mt-1">Set and achieve team objectives</p>
            </div>
            <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
              <Users size={24} className="mx-auto mb-2 text-purple-400" />
              <h4 className="font-medium text-white">Collaborate</h4>
              <p className="text-xs text-gray-400 mt-1">Share notes and study together</p>
            </div>
          </div>
        </div>
      </div>

      {/* Squad Creation Modal */}
      {showCreateModal && (
        <SquadFormationModal
          onClose={() => setShowCreateModal(false)}
          onSquadCreated={handleSquadCreated}
        />
      )}
    </div>
  );
};