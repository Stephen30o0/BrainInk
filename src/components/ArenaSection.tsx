import React, { useState } from 'react';
import { PixelButton } from './shared/PixelButton';
import { TrophyIcon, UsersIcon, CalendarIcon, ZapIcon } from 'lucide-react';
export const ArenaSection = () => {
  const [activeTab, setActiveTab] = useState('leaderboard');
  const leaderboardData = [{
    rank: 1,
    name: 'BrainMaster99',
    score: 15420,
    avatar: '🧠'
  }, {
    rank: 2,
    name: 'QuizWizard',
    score: 14380,
    avatar: '🧙‍♂️'
  }, {
    rank: 3,
    name: 'EinsteinJr',
    score: 13950,
    avatar: '👨‍🔬'
  }, {
    rank: 4,
    name: 'QuantumThinker',
    score: 12840,
    avatar: '🔮'
  }, {
    rank: 5,
    name: 'NeuralNinja',
    score: 11760,
    avatar: '🥷'
  }];
  const tournaments = [{
    id: 'national-cup',
    name: 'National Academic Cup',
    date: 'June 15',
    participants: 128,
    prize: '5000 INK',
    status: 'upcoming'
  }, {
    id: 'science-battle',
    name: 'Science Battle Royale',
    date: 'May 30',
    participants: 64,
    prize: '2500 INK',
    status: 'registration'
  }, {
    id: 'math-challenge',
    name: 'Mathematics Challenge',
    date: 'May 22',
    participants: 32,
    prize: '1000 INK',
    status: 'live'
  }];
  return <section className="min-h-screen w-full bg-dark py-20 relative overflow-hidden" id="arena">
      {/* Arena background */}
      <div className="absolute inset-0 z-0">
        {/* Pixel stadium background */}
        <div className="absolute bottom-0 left-0 w-full h-2/3 opacity-10">
          <div className="w-full h-full bg-gradient-to-t from-primary to-transparent rounded-t-full"></div>
          {/* Stadium seats */}
          {Array.from({
          length: 10
        }).map((_, i) => <div key={i} className="absolute w-full h-2 bg-primary/20" style={{
          bottom: `${i * 5}%`
        }}></div>)}
        </div>
      </div>
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-pixel text-3xl md:text-4xl mb-4 text-primary">
            THE <span className="text-tertiary">ARENA</span>
          </h2>
          <p className="text-gray-300 font-pixel text-sm max-w-2xl mx-auto">
            Learn, Battle, Win!
          </p>
          <div className="mt-6 font-pixel text-lg text-tertiary">
            Your Brain is Your Weapon
          </div>
        </div>
        {/* Arena Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-dark/50 border border-primary/30 rounded-lg overflow-hidden">
            {[{
            id: 'leaderboard',
            label: 'Leaderboard',
            icon: <TrophyIcon size={16} />
          }, {
            id: 'tournaments',
            label: 'Tournaments',
            icon: <CalendarIcon size={16} />
          }, {
            id: 'challenges',
            label: 'Challenges',
            icon: <ZapIcon size={16} />
          }].map(tab => <button key={tab.id} className={`flex items-center px-4 py-2 font-pixel text-xs ${activeTab === tab.id ? 'bg-primary text-dark' : 'text-primary hover:bg-primary/20'}`} onClick={() => setActiveTab(tab.id)}>
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>)}
          </div>
        </div>
        {/* Tab Content */}
        <div className="bg-dark/50 border-2 border-primary/30 rounded-lg p-6">
          {activeTab === 'leaderboard' && <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-pixel text-primary text-lg">Top Players</h3>
                <div className="flex space-x-2">
                  <button className="bg-primary/20 text-primary px-3 py-1 rounded text-xs font-pixel">
                    Global
                  </button>
                  <button className="bg-dark text-gray-400 px-3 py-1 rounded text-xs font-pixel">
                    Regional
                  </button>
                  <button className="bg-dark text-gray-400 px-3 py-1 rounded text-xs font-pixel">
                    Friends
                  </button>
                </div>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-primary/20">
                    <th className="text-left py-2 text-xs text-gray-400">
                      RANK
                    </th>
                    <th className="text-left py-2 text-xs text-gray-400">
                      PLAYER
                    </th>
                    <th className="text-right py-2 text-xs text-gray-400">
                      SCORE
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardData.map(player => <tr key={player.rank} className="border-b border-gray-800 hover:bg-primary/5 transition-colors">
                      <td className="py-3 font-pixel text-sm">
                        <span className={`inline-block w-6 h-6 rounded-full text-center leading-6 mr-2 text-xs ${player.rank <= 3 ? 'bg-yellow-400 text-dark' : 'bg-gray-700 text-white'}`}>
                          {player.rank}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                            <span>{player.avatar}</span>
                          </div>
                          <span className="font-pixel text-sm">
                            {player.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-right font-pixel text-sm text-primary">
                        {player.score} XP
                      </td>
                    </tr>)}
                </tbody>
              </table>
              <div className="mt-6 bg-gradient-to-r from-primary/10 to-tertiary/10 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                      <span className="text-primary">👤</span>
                    </div>
                    <div>
                      <h4 className="font-pixel text-primary text-sm">
                        Your Rank: #42
                      </h4>
                      <p className="text-gray-400 text-xs">
                        5,280 XP • Top 15%
                      </p>
                    </div>
                  </div>
                  <PixelButton>Improve Rank</PixelButton>
                </div>
              </div>
            </div>}
          {activeTab === 'tournaments' && <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tournaments.map(tournament => <div key={tournament.id} className="bg-dark border border-primary/30 rounded-lg p-4 hover-scale">
                    <div className="flex justify-between items-start">
                      <h3 className="font-pixel text-primary text-sm">
                        {tournament.name}
                      </h3>
                      <div className={`px-2 py-1 rounded text-xs ${tournament.status === 'live' ? 'bg-green-500/20 text-green-400' : tournament.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {tournament.status === 'live' ? 'LIVE NOW' : tournament.status === 'upcoming' ? 'UPCOMING' : 'REGISTRATION'}
                      </div>
                    </div>
                    <div className="mt-4 flex justify-between">
                      <div className="flex items-center text-gray-400 text-xs">
                        <CalendarIcon size={14} className="mr-1" />
                        {tournament.date}
                      </div>
                      <div className="flex items-center text-gray-400 text-xs">
                        <UsersIcon size={14} className="mr-1" />
                        {tournament.participants} Players
                      </div>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <div className="bg-yellow-400/20 px-2 py-1 rounded">
                        <span className="text-yellow-400 text-xs">
                          {tournament.prize}
                        </span>
                      </div>
                      <PixelButton small>
                        {tournament.status === 'live' ? 'Watch' : tournament.status === 'upcoming' ? 'Reminder' : 'Register'}
                      </PixelButton>
                    </div>
                  </div>)}
                <div className="bg-gradient-to-br from-primary/10 to-tertiary/10 border border-primary/20 border-dashed rounded-lg p-4 flex flex-col items-center justify-center">
                  <div className="text-4xl mb-2">🏆</div>
                  <h3 className="font-pixel text-primary text-sm mb-2 text-center">
                    Create Your Own Tournament
                  </h3>
                  <p className="text-gray-400 text-xs text-center mb-4">
                    Challenge friends or your school
                  </p>
                  <PixelButton small>Create Now</PixelButton>
                </div>
              </div>
            </div>}
          {activeTab === 'challenges' && <div className="text-center py-8">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="font-pixel text-primary text-lg mb-2">
                Daily Challenges
              </h3>
              <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
                Complete daily challenges to earn bonus XP and special rewards
              </p>
              <PixelButton primary>Start Today's Challenge</PixelButton>
            </div>}
        </div>
        <div className="text-center mt-12">
          <PixelButton href="#hero">View All Tournaments</PixelButton>
        </div>
      </div>
    </section>;
};