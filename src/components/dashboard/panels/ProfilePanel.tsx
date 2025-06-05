import React, { useState, useEffect } from 'react';
import { Trophy, Star, Medal, Clock, Calendar, Settings, X, User, Mail } from 'lucide-react';

interface ProfileData {
  username: string;
  email: string;
  avatar: string;
  bio: string;
  totalXp?: number;
  rank?: string;
  studyHours?: number;
  memberSince?: string;
  league?: string;
  loginStreak?: number;
  quizCompleted?: number;
  tournamentsWon?: number;
  tournamentsEntered?: number;
  coursesCompleted?: number;
  fname?: string;
  lname?: string;
}

interface Achievement {
  id: number;
  name: string;
  description: string;
  category: string;
  badge_icon?: string;
  xp_reward: number;
  earned_at?: string;
}

interface UserProgressResponse {
  total_xp: number;
  current_rank?: {
    id: number;
    name: string;
    tier: string;
    level: number;
    required_xp: number;
    emoji?: string;
  };
  login_streak: number;
  total_quiz_completed: number;
  tournaments_won: number;
  tournaments_entered: number;
  courses_completed: number;
  time_spent_hours: number;
}

interface UserStatsResponse {
  user_id: number;
  username: string;
  total_xp: number;
  current_rank: string;
  achievements_count: number;
  stats: {
    login_streak: number;
    total_quiz_completed: number;
    tournaments_won: number;
    tournaments_entered: number;
    courses_completed: number;
    time_spent_hours: number;
  };
}

export const ProfilePanel = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    username: '',
    email: '',
    avatar: 'JP',
    bio: '',
    fname: '',
    lname: ''
  });
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([]);

  // Enhanced token validation and refresh
  const getValidToken = async (): Promise<string | null> => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.log('No access token found in simplified getValidToken');
      // setError('Please log in again.'); // Temporarily commented out to reduce complexity
      return null;
    }
    console.log('Simplified getValidToken returning token:', token ? token.substring(0,10)+'...' : null);
    return token;
  };

  const fetchUserProgress = async () => {
    const token = await getValidToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      console.log('Making request to: https://brainink-backend-achivements-micro.onrender.com/progress');
      console.log('Using token:', token.substring(0, 20) + '...');

      const response = await fetch('https://brainink-backend-achivements-micro.onrender.com/progress', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // Add additional headers that might be needed
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      console.log('User Progress API Response status:', response.status);
      console.log('User Progress API Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data: UserProgressResponse = await response.json();
        console.log('User Progress API Response data:', data);
        
        setProfileData(prev => ({
          ...prev,
          totalXp: data.total_xp || 0,
          rank: data.current_rank?.name || 'Unranked',
          league: data.current_rank?.tier || 'Novice',
          loginStreak: data.login_streak || 0,
          quizCompleted: data.total_quiz_completed || 0,
          tournamentsWon: data.tournaments_won || 0,
          tournamentsEntered: data.tournaments_entered || 0,
          coursesCompleted: data.courses_completed || 0,
          studyHours: data.time_spent_hours || 0
        }));
        
        // Clear any previous errors
        setError(null);
      } else {
        const errorText = await response.text();
        console.error('User Progress API Error Response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { detail: `HTTP ${response.status}: ${errorText}` };
        }
        
        console.error('User Progress API Error: ' + JSON.stringify(errorData));
        
        if (response.status === 401) {
          // Handle authentication error like in SignUp.tsx
          localStorage.removeItem('access_token');
          localStorage.removeItem('encrypted_user_data');
          setError('Authentication failed. Please log in again.');
        } else {
          setError(errorData.detail || `Failed to fetch user progress (${response.status})`);
        }
      }
    } catch (err) {
      console.error('Network error fetching user progress:', err);
      setError('Network error while fetching user progress. Please check your connection.');
    }
  };

  const fetchUserStats = async () => {
    const token = await getValidToken();
    if (!token) {
      return;
    }

    try {
      console.log('Making request to: https://brainink-backend-achivements-micro.onrender.com/stats');
      console.log('Using token:', token.substring(0, 20) + '...');

      const response = await fetch('https://brainink-backend-achivements-micro.onrender.com/stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      console.log('User Stats API Response status:', response.status);
      console.log('User Stats API Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data: UserStatsResponse = await response.json();
        console.log('User Stats API Response data:', data);

        setProfileData(prev => ({
          ...prev,
          username: data.username || prev.username || 'User',
          memberSince: 'Member',
          avatar: data.username?.substring(0, 2).toUpperCase() || prev.avatar
        }));
      } else {
        const errorText = await response.text();
        console.error('User Stats API Error Response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { detail: `HTTP ${response.status}: ${errorText}` };
        }
        
        console.error('User Stats API Error: ' + JSON.stringify(errorData));
        
        if (response.status === 401) {
          console.warn('Authentication failed for stats - clearing tokens');
          localStorage.removeItem('access_token');
          localStorage.removeItem('encrypted_user_data');
          setError('Session expired. Please log in again.');
        }
      }
    } catch (err) {
      console.error('Network error fetching user stats:', err);
      // Don't set error here as this is secondary data
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAchievements = async () => {
    const token = await getValidToken();
    if (!token) {
      return;
    }

    try {
      console.log('Making request to: https://brainink-backend-achivements-micro.onrender.com/achievements');
      console.log('Using token:', token.substring(0, 20) + '...');

      const response = await fetch('https://brainink-backend-achivements-micro.onrender.com/achievements', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      console.log('User Achievements API Response status:', response.status);
      console.log('User Achievements API Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data: Achievement[] = await response.json();
        console.log('User Achievements API Response data:', data);
        
        // Sort by earned date and take the 3 most recent
        const sortedAchievements = data
          .filter(achievement => achievement.earned_at)
          .sort((a, b) => new Date(b.earned_at!).getTime() - new Date(a.earned_at!).getTime())
          .slice(0, 3);
          
        setRecentAchievements(sortedAchievements);
      } else {
        const errorText = await response.text();
        console.error('User Achievements API Error Response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { detail: `HTTP ${response.status}: ${errorText}` };
        }
        
        console.error('User Achievements API Error: ' + JSON.stringify(errorData));
      }
    } catch (err) {
      console.error('Network error fetching achievements:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const token = await getValidToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      console.log('Making request to: https://brainink-backend.onrender.com/update-profile');
      console.log('Using token:', token.substring(0, 20) + '...');

      const response = await fetch('https://brainink-backend.onrender.com/update-profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          fname: profileData.fname,
          lname: profileData.lname,
          username: profileData.username,
          email: profileData.email
        })
      });

      console.log('Update Profile API Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Update Profile API Response data:', data);
        
        // Update token if provided (following SignUp.tsx pattern)
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
          console.log('Updated access token in localStorage');
        }
        
        if (data.encrypted_data) {
          localStorage.setItem('encrypted_user_data', data.encrypted_data);
          console.log('Updated encrypted user data in localStorage');
        }
        
        setIsEditing(false);
        setError(null);
        
        // Refresh data
        await Promise.all([
          fetchUserStats(),
          fetchUserProgress(),
          fetchUserAchievements()
        ]);
        
        console.log('Profile updated successfully');
      } else {
        const errorText = await response.text();
        console.error('Update Profile API Error Response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { detail: `HTTP ${response.status}: ${errorText}` };
        }
        
        setError(errorData.detail || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Network error updating profile:', err);
      setError('Network error while updating profile. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Retry function for failed requests
  const retryFetchData = async () => {
    setLoading(true);
    setError(null);
    
    await Promise.all([
      fetchUserProgress(),
      fetchUserStats(),
      fetchUserAchievements()
    ]);
  };

  // Check for authentication on component mount
  useEffect(() => {
    const initializeProfile = async () => {
      const token = await getValidToken();
      if (!token) {
        setLoading(false);
        return;
      }

      // If token is valid, proceed with fetching data
      await Promise.all([
        fetchUserProgress(),
        fetchUserStats(),
        fetchUserAchievements()
      ]);
    };

    initializeProfile();
  }, []);

  // Debug: Log current state
  useEffect(() => {
    console.log('Current profileData:', profileData);
    console.log('Current loading state:', loading);
    console.log('Current error state:', error);
    console.log('Current token:', localStorage.getItem('access_token')?.substring(0, 20) + '...');
  }, [profileData, loading, error]);

  if (loading && !profileData.username) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="text-primary">Loading profile...</div>
      </div>
    );
  }
  
  return (
    <div className="p-4 space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
          {error}
          <div className="flex gap-2 mt-2">
            <button 
              onClick={() => setError(null)}
              className="text-red-300 hover:text-red-100 text-xs underline"
            >
              Dismiss
            </button>
            <button 
              onClick={retryFetchData}
              className="text-red-300 hover:text-red-100 text-xs underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary p-[2px]">
          <div className="w-full h-full rounded-full bg-dark flex items-center justify-center text-2xl">
            {profileData.avatar}
          </div>
        </div>
        <div>
          <h2 className="font-pixel text-xl text-primary">{profileData.username}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Medal size={14} className="text-yellow-400" />
            <span className="text-gray-400 text-sm">{profileData.rank}</span>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="mt-2 px-3 py-1 text-xs bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {[{
          label: 'Total XP',
          value: profileData.totalXp?.toLocaleString() || '0',
          icon: <Star size={16} />
        }, {
          label: 'Current Rank',
          value: profileData.rank || 'Unranked',
          icon: <Trophy size={16} />
        }, {
          label: 'Study Hours',
          value: profileData.studyHours ? `${profileData.studyHours}h` : '0h',
          icon: <Clock size={16} />
        }, {
          label: 'Login Streak',
          value: profileData.loginStreak ? `${profileData.loginStreak} days` : '0 days',
          icon: <Calendar size={16} />
        }].map((stat, i) => (
          <div key={i} className="bg-dark/50 border border-primary/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              {stat.icon}
              <span className="text-xs">{stat.label}</span>
            </div>
            <div className="font-pixel text-primary">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-dark/30 border border-primary/20 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Trophy size={14} />
            <span className="text-xs">Tournaments Won</span>
          </div>
          <div className="font-pixel text-secondary">{profileData.tournamentsWon || 0}</div>
        </div>
        <div className="bg-dark/30 border border-primary/20 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Star size={14} />
            <span className="text-xs">Quizzes Completed</span>
          </div>
          <div className="font-pixel text-tertiary">{profileData.quizCompleted || 0}</div>
        </div>
      </div>

      {/* Recent Achievements */}
      <div>
        <h3 className="font-pixel text-primary text-sm mb-3">
          Recent Achievements
        </h3>
        <div className="space-y-3">
          {recentAchievements.length > 0 ? (
            recentAchievements.map((achievement) => (
              <div key={achievement.id} className="flex items-center gap-3 bg-dark/30 border border-primary/20 rounded-lg p-3">
                <div className="text-2xl">{achievement.badge_icon || '🏆'}</div>
                <div>
                  <div className="text-sm text-primary">{achievement.name}</div>
                  <div className="text-xs text-gray-400">{achievement.description}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-yellow-400">+{achievement.xp_reward} XP</span>
                    {achievement.earned_at && (
                      <span className="text-xs text-gray-500">
                        {new Date(achievement.earned_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            // Fallback achievements if none from backend
            [{
              name: 'Welcome!',
              desc: 'Join the Brain Ink community',
              icon: '🎉'
            }, {
              name: 'First Steps',
              desc: 'Complete your profile setup',
              icon: '👋'
            }, {
              name: 'Explorer',
              desc: 'Discover the platform features',
              icon: '🔍'
            }].map((achievement, i) => (
              <div key={i} className="flex items-center gap-3 bg-dark/30 border border-primary/20 rounded-lg p-3">
                <div className="text-2xl">{achievement.icon}</div>
                <div>
                  <div className="text-sm text-primary">{achievement.name}</div>
                  <div className="text-xs text-gray-400">{achievement.desc}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Settings Button */}
      <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-dark/50 border border-primary/20 rounded-lg text-primary hover:bg-primary/10 transition-colors">
        <Settings size={16} />
        <span className="text-sm">Settings</span>
      </button>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-dark border border-primary/20 rounded-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-pixel text-xl text-primary">Edit Profile</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Avatar Display */}
              <div className="flex flex-col items-center gap-4 mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary p-[2px]">
                  <div className="w-full h-full rounded-full bg-dark flex items-center justify-center text-2xl">
                    {profileData.avatar}
                  </div>
                </div>
              </div>

              {/* First Name */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">First Name</label>
                <input
                  type="text"
                  value={profileData.fname}
                  onChange={(e) => setProfileData({ ...profileData, fname: e.target.value })}
                  className="w-full bg-dark/50 border border-primary/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Last Name</label>
                <input
                  type="text"
                  value={profileData.lname}
                  onChange={(e) => setProfileData({ ...profileData, lname: e.target.value })}
                  className="w-full bg-dark/50 border border-primary/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Username</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={profileData.username}
                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                    className="w-full bg-dark/50 border border-primary/20 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full bg-dark/50 border border-primary/20 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-secondary text-dark font-pixel py-2 rounded-lg hover:opacity-90 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};