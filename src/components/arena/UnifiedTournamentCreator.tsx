import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrophyIcon,
  Coins,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Dice6,
  X
} from 'lucide-react';
import { useWallet } from '../shared/WalletContext';
import { tournamentService } from '../../services/tournamentService';

interface UnifiedTournamentCreatorProps {
  onClose: () => void;
  onTournamentCreated: (tournamentId: number, type: 'chainlink' | 'ink' | 'regular') => void;
}

type TournamentType = 'chainlink' | 'ink' | 'regular';

interface TournamentForm {
  name: string;
  description: string;
  type: TournamentType;
  entryFee: string;
  maxParticipants: number;
  duration: number; // hours
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prizeDistribution: {
    first: number;
    second: number;
    third: number;
  };
  requiresApproval: boolean;
  isPublic: boolean;
}

const subjects = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
  'History', 'Geography', 'Literature', 'Art History', 'Philosophy',
  'Psychology', 'Economics', 'Political Science', 'Sociology', 'Neuroscience',
  'Astronomy', 'Environmental Science', 'Statistics', 'Engineering', 'Music Theory'
];

export const UnifiedTournamentCreator: React.FC<UnifiedTournamentCreatorProps> = ({
  onClose,
  onTournamentCreated
}) => {
  const { address, isConnected, provider, signer } = useWallet();
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<string>('0');

  const [form, setForm] = useState<TournamentForm>({
    name: '',
    description: '',
    type: 'regular',
    entryFee: '10',
    maxParticipants: 8,
    duration: 24,
    subject: 'Mathematics',
    difficulty: 'medium',
    prizeDistribution: {
      first: 60,
      second: 30,
      third: 10
    },
    requiresApproval: false,
    isPublic: true
  });

  useEffect(() => {
    if (isConnected && form.type === 'ink') {
      loadUserBalance();
    }
  }, [isConnected, form.type]);

  const loadUserBalance = async () => {
    try {
      if (provider && signer && address) {
        await tournamentService.initialize(provider, signer, address);
        const inkBalance = await tournamentService.getINKBalance();
        setUserBalance(inkBalance);
      }
    } catch (err) {
      console.error('Failed to load INK balance:', err);
    }
  };

  const handleCreateTournament = async () => {
    if (!form.name.trim()) {
      setError('Tournament name is required');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      let tournamentId: number;

      switch (form.type) {
        case 'ink':
          if (!isConnected) {
            throw new Error('Please connect your wallet to create INK tournaments');
          }
          
          // Create INK token tournament
          tournamentId = await tournamentService.createTournament(
            form.name,
            form.entryFee,
            form.maxParticipants,
            form.duration
          );
          break;

        case 'chainlink':
          // TODO: Implement Chainlink VRF tournament creation
          tournamentId = Math.floor(Math.random() * 10000); // Placeholder
          break;

        case 'regular':
          // TODO: Implement regular tournament creation via API
          tournamentId = Math.floor(Math.random() * 10000); // Placeholder
          break;

        default:
          throw new Error('Invalid tournament type');
      }

      onTournamentCreated(tournamentId, form.type);
      onClose();
    } catch (err: any) {
      console.error('Failed to create tournament:', err);
      setError(err.message || 'Failed to create tournament');
    } finally {
      setIsCreating(false);
    }
  };

  const getTournamentTypeInfo = (type: TournamentType) => {
    switch (type) {
      case 'chainlink':
        return {
          title: 'Chainlink VRF Tournament',
          description: 'Provably fair tournaments with Chainlink VRF for random winner selection',
          icon: <Dice6 className="text-blue-400" size={24} />,
          features: ['Provably Fair', 'VRF Randomness', 'Smart Contracts', 'Transparent'],
          color: 'blue'
        };
      case 'ink':
        return {
          title: 'INK Token Tournament',
          description: 'Compete with INK tokens for rewards and prizes',
          icon: <Coins className="text-yellow-400" size={24} />,
          features: ['Token Rewards', 'Prize Pools', 'Blockchain Verified', 'Instant Payouts'],
          color: 'yellow'
        };
      case 'regular':
        return {
          title: 'Regular Tournament',
          description: 'Standard competitive tournaments with XP and achievement rewards',
          icon: <TrophyIcon className="text-purple-400" size={24} />,
          features: ['XP Rewards', 'Achievements', 'Leaderboards', 'Free to Join'],
          color: 'purple'
        };
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-pixel text-primary mb-4">Choose Tournament Type</h3>
        <div className="grid gap-4">
          {(['regular', 'ink', 'chainlink'] as TournamentType[]).map((type) => {
            const info = getTournamentTypeInfo(type);
            return (
              <motion.div
                key={type}
                whileHover={{ scale: 1.02 }}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  form.type === type
                    ? `border-${info.color}-400 bg-${info.color}-500/10`
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                onClick={() => setForm({ ...form, type })}
              >
                <div className="flex items-start gap-4">
                  {info.icon}
                  <div className="flex-1">
                    <h4 className="font-pixel text-lg text-primary mb-2">{info.title}</h4>
                    <p className="text-gray-400 text-sm mb-3">{info.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {info.features.map((feature) => (
                        <span
                          key={feature}
                          className={`px-2 py-1 rounded text-xs bg-${info.color}-500/20 text-${info.color}-300`}
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 ${
                    form.type === type
                      ? `border-${info.color}-400 bg-${info.color}-400`
                      : 'border-gray-600'
                  }`}>
                    {form.type === type && <CheckCircle size={20} className="text-dark -m-1" />}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-pixel text-primary mb-4">Tournament Details</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">Tournament Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-dark border border-primary/30 rounded px-3 py-2 text-primary"
              placeholder="Enter tournament name"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">Subject</label>
            <select
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full bg-dark border border-primary/30 rounded px-3 py-2 text-primary"
            >
              {subjects.map((subject) => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">Difficulty</label>
            <select
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
              className="w-full bg-dark border border-primary/30 rounded px-3 py-2 text-primary"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">Max Participants</label>
            <select
              value={form.maxParticipants}
              onChange={(e) => setForm({ ...form, maxParticipants: parseInt(e.target.value) })}
              className="w-full bg-dark border border-primary/30 rounded px-3 py-2 text-primary"
            >
              <option value={4}>4 Players</option>
              <option value={8}>8 Players</option>
              <option value={16}>16 Players</option>
              <option value={32}>32 Players</option>
              <option value={64}>64 Players</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-2">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-dark border border-primary/30 rounded px-3 py-2 text-primary h-24"
            placeholder="Describe your tournament..."
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-pixel text-primary mb-4">Tournament Settings</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          {form.type === 'ink' && (
            <div>
              <label className="block text-gray-400 text-sm mb-2">Entry Fee (INK)</label>
              <input
                type="number"
                value={form.entryFee}
                onChange={(e) => setForm({ ...form, entryFee: e.target.value })}
                className="w-full bg-dark border border-primary/30 rounded px-3 py-2 text-primary"
                min="1"
                step="0.1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your balance: {parseFloat(userBalance).toFixed(2)} INK
              </p>
            </div>
          )}

          <div>
            <label className="block text-gray-400 text-sm mb-2">Duration (Hours)</label>
            <select
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })}
              className="w-full bg-dark border border-primary/30 rounded px-3 py-2 text-primary"
            >
              <option value={1}>1 Hour</option>
              <option value={3}>3 Hours</option>
              <option value={6}>6 Hours</option>
              <option value={12}>12 Hours</option>
              <option value={24}>24 Hours</option>
              <option value={48}>48 Hours</option>
              <option value={168}>1 Week</option>
            </select>
          </div>
        </div>

        {form.type !== 'regular' && (
          <div>
            <h4 className="text-lg font-pixel text-primary mb-3">Prize Distribution (%)</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">1st Place</label>
                <input
                  type="number"
                  value={form.prizeDistribution.first}
                  onChange={(e) => setForm({
                    ...form,
                    prizeDistribution: { ...form.prizeDistribution, first: parseInt(e.target.value) }
                  })}
                  className="w-full bg-dark border border-primary/30 rounded px-3 py-2 text-primary"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">2nd Place</label>
                <input
                  type="number"
                  value={form.prizeDistribution.second}
                  onChange={(e) => setForm({
                    ...form,
                    prizeDistribution: { ...form.prizeDistribution, second: parseInt(e.target.value) }
                  })}
                  className="w-full bg-dark border border-primary/30 rounded px-3 py-2 text-primary"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">3rd Place</label>
                <input
                  type="number"
                  value={form.prizeDistribution.third}
                  onChange={(e) => setForm({
                    ...form,
                    prizeDistribution: { ...form.prizeDistribution, third: parseInt(e.target.value) }
                  })}
                  className="w-full bg-dark border border-primary/30 rounded px-3 py-2 text-primary"
                  min="0"
                  max="100"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Total: {form.prizeDistribution.first + form.prizeDistribution.second + form.prizeDistribution.third}%
            </p>
          </div>
        )}

        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.isPublic}
              onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
              className="w-4 h-4 text-primary bg-dark border-primary/30 rounded"
            />
            <span className="text-gray-400">Make tournament public</span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.requiresApproval}
              onChange={(e) => setForm({ ...form, requiresApproval: e.target.checked })}
              className="w-4 h-4 text-primary bg-dark border-primary/30 rounded"
            />
            <span className="text-gray-400">Require approval to join</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => {
    const info = getTournamentTypeInfo(form.type);
    const totalPrize = form.type === 'ink' ? parseFloat(form.entryFee) * form.maxParticipants : 0;

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-pixel text-primary mb-4">Review & Create</h3>
          
          <div className="bg-dark/50 border border-primary/20 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              {info.icon}
              <h4 className="text-lg font-pixel text-primary">{form.name}</h4>
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Type:</span>
                <span className="text-primary ml-2">{info.title}</span>
              </div>
              <div>
                <span className="text-gray-400">Subject:</span>
                <span className="text-primary ml-2">{form.subject}</span>
              </div>
              <div>
                <span className="text-gray-400">Difficulty:</span>
                <span className="text-primary ml-2 capitalize">{form.difficulty}</span>
              </div>
              <div>
                <span className="text-gray-400">Duration:</span>
                <span className="text-primary ml-2">{form.duration}h</span>
              </div>
              <div>
                <span className="text-gray-400">Max Players:</span>
                <span className="text-primary ml-2">{form.maxParticipants}</span>
              </div>
              {form.type === 'ink' && (
                <div>
                  <span className="text-gray-400">Entry Fee:</span>
                  <span className="text-primary ml-2">{form.entryFee} INK</span>
                </div>
              )}
            </div>

            {form.description && (
              <div className="mt-4">
                <span className="text-gray-400">Description:</span>
                <p className="text-primary mt-1">{form.description}</p>
              </div>
            )}

            {form.type !== 'regular' && totalPrize > 0 && (
              <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded">
                <h5 className="font-pixel text-green-400 mb-2">Prize Pool: {totalPrize.toFixed(2)} INK</h5>
                <div className="text-sm space-y-1">
                  <div>1st Place: {((totalPrize * form.prizeDistribution.first) / 100).toFixed(2)} INK</div>
                  <div>2nd Place: {((totalPrize * form.prizeDistribution.second) / 100).toFixed(2)} INK</div>
                  <div>3rd Place: {((totalPrize * form.prizeDistribution.third) / 100).toFixed(2)} INK</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-dark border border-primary/30 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary/20">
          <div className="flex items-center gap-4">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="p-2 text-gray-400 hover:text-primary"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div>
              <h2 className="text-2xl font-pixel text-primary">Create Tournament</h2>
              <p className="text-gray-400">Step {currentStep} of 4</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-primary"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-pixel ${
                  step <= currentStep
                    ? 'bg-primary text-dark'
                    : 'bg-gray-600 text-gray-400'
                }`}
              >
                {step}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <AlertCircle size={20} className="text-red-400" />
                <span className="text-red-400">{error}</span>
              </div>
            </div>
          )}

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-primary/20">
          <div className="text-gray-400 text-sm">
            {currentStep === 1 && 'Choose your tournament type'}
            {currentStep === 2 && 'Enter tournament details'}
            {currentStep === 3 && 'Configure settings'}
            {currentStep === 4 && 'Review and create'}
          </div>
          <div className="flex items-center gap-3">
            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={currentStep === 1 && !form.type}
                className="px-6 py-2 bg-primary/20 border border-primary/30 text-primary rounded font-pixel hover:bg-primary/30 disabled:opacity-50"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleCreateTournament}
                disabled={isCreating || !form.name.trim()}
                className="px-6 py-2 bg-primary text-dark rounded font-pixel hover:bg-primary/90 disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create Tournament'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
