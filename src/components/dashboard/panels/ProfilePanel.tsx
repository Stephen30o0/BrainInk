import React, { useState, useEffect } from 'react';
import { Trophy, Star, Medal, Clock, Calendar, Settings, X, User, Mail } from 'lucide-react';
import { apiService } from '../../../services/apiService';

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

export const ProfilePanel = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    username: '',
    email: '',
    avatar: '',
    bio: '',
    fname: '',
    lname: ''
  });
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([]);

  // Function to generate user initials
  const getUserInitials = (fname?: string, lname?: string, username?: string): string => {
    if (fname && lname) {
      return (fname.charAt(0) + lname.charAt(0)).toUpperCase();
    }
    
    if (fname) {
      return fname.substring(0, 2).toUpperCase();
    }
    
    if (lname) {
      return lname.substring(0, 2).toUpperCase();
    }
    
    if (username && username.length >= 2) {
      return username.substring(0, 2).toUpperCase();
    }
    
    return username?.charAt(0).toUpperCase() || '?';
  };

  // Enhanced token validation
  const getValidToken = async (): Promise<string | null> => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.log('No access token found');
      return null;
    }
    return token;
  };

  // Load profile data using apiService (fast retrieval)
  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to get preloaded data first
      let preloadedData = apiService.getPreloadedData();
      
      if (!preloadedData) {
        console.log('No preloaded data found, loading...');
        try {
          preloadedData = await apiService.preloadAllData();
        } catch (preloadError) {
          console.error('Failed to preload data:', preloadError);
          // Fallback to direct API calls
          await loadProfileFromAPI();
          return;
        }
      }

      // Get data from preloaded cache
      const userProfile = apiService.getUserProfile();
      const progress = apiService.getUserProgress();
      const stats = apiService.getUserStats();
      const achievements = apiService.getAchievements();

      console.log('🔍 Raw userProfile data:', userProfile);
      console.log('🔍 Raw progress data:', progress);
      console.log('🔍 Raw stats data:', stats);

      // Set profile data from preloaded cache with safe defaults
      if (userProfile || progress || stats) {
        const profileInfo: ProfileData = {
          username: userProfile?.username || stats?.username || 'Unknown User',
          email: userProfile?.email || '',
          fname: userProfile?.fname || '',
          lname: userProfile?.lname || '',
          avatar: '',
          bio: userProfile?.bio || 'No bio available',
          totalXp: progress?.total_xp || stats?.total_xp || 0,
          rank: progress?.current_rank?.name || stats?.current_rank || 'Beginner',
          league: progress?.current_rank?.tier || 'Novice',
          studyHours: progress?.time_spent_hours || stats?.stats?.time_spent_hours || 0,
          loginStreak: progress?.login_streak || stats?.stats?.login_streak || 0,
          tournamentsWon: progress?.tournaments_won || stats?.stats?.tournaments_won || 0,
          tournamentsEntered: progress?.tournaments_entered || stats?.stats?.tournaments_entered || 0,
          coursesCompleted: progress?.courses_completed || stats?.stats?.courses_completed || 0,
          quizCompleted: progress?.total_quiz_completed || stats?.stats?.total_quiz_completed || 0,
          memberSince: 'Member'
        };

        // Generate avatar if none exists
        profileInfo.avatar = getUserInitials(profileInfo.fname, profileInfo.lname, profileInfo.username);

        setProfileData(profileInfo);
        console.log('✅ Profile data set:', profileInfo);
      }

      // Get recent achievements from preloaded data
      const recentAchievements = achievements
        .filter(achievement => achievement.earned_at)
        .sort((a, b) => new Date(b.earned_at!).getTime() - new Date(a.earned_at!).getTime())
        .slice(0, 5);

      setRecentAchievements(recentAchievements);

      console.log('✅ Profile data loaded from cache');

    } catch (err: any) {
      console.error('Error loading profile data:', err);
      setError('Failed to load profile data');
      // Fallback to API
      await loadProfileFromAPI();
    } finally {
      setLoading(false);
    }
  };

  // Fallback API loading method (same as your original)
  const loadProfileFromAPI = async () => {
    const token = await getValidToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      console.log('Loading profile data from API fallback...');

      // Get user data from token first
      const tokenUserData = getUserDataFromToken();
      console.log('User data from token:', tokenUserData);
      
      // Set initial profile data from token
      setProfileData(prev => ({
        ...prev,
        fname: tokenUserData.fname || '',
        lname: tokenUserData.lname || '',
        username: tokenUserData.username || '',
        email: tokenUserData.email || '',
        avatar: getUserInitials(tokenUserData.fname, tokenUserData.lname, tokenUserData.username)
      }));

      // Then fetch additional data from APIs
      await Promise.all([
        fetchUserProgress(),
        fetchUserStats(),
        fetchUserAchievements()
      ]);

    } catch (err: any) {
      console.error('Error loading profile from API:', err);
      setError('Failed to load profile data');
    }
  };

  // Function to extract user data from token (same as your original)
  const getUserDataFromToken = (): { fname?: string; lname?: string; username?: string; email?: string } => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return {};

      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) return {};

      const base64Payload = tokenParts[1];
      const paddedPayload = base64Payload.padEnd(base64Payload.length + (4 - base64Payload.length % 4) % 4, '=');
      const decodedPayload = atob(paddedPayload);
      const payload = JSON.parse(decodedPayload);
      
      console.log('Decoded token payload for user data:', payload);
      
      return {
        fname: payload.fname || payload.first_name,
        lname: payload.lname || payload.last_name,
        username: payload.username || payload.sub,
        email: payload.email
      };
    } catch (error) {
      console.error('Error extracting user data from token:', error);
      return {};
    }
  };

  // Original API methods (kept as fallback)
  const fetchUserProgress = async () => {
    const token = await getValidToken();
    if (!token) return;

    try {
      const response = await fetch('https://brainink-backend-achivements-micro.onrender.com/progress', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
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
      }
    } catch (err) {
      console.error('Error fetching user progress:', err);
    }
  };

  const fetchUserStats = async () => {
    const token = await getValidToken();
    if (!token) return;

    try {
      const response = await fetch('https://brainink-backend-achivements-micro.onrender.com/stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(prev => ({
          ...prev,
          username: data.username || prev.username || 'User',
          memberSince: 'Member',
          avatar: getUserInitials(prev.fname, prev.lname, data.username)
        }));
      }
    } catch (err) {
      console.error('Error fetching user stats:', err);
    }
  };

  const fetchUserAchievements = async () => {
    const token = await getValidToken();
    if (!token) return;

    try {
      const response = await fetch('https://brainink-backend-achivements-micro.onrender.com/achievements', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        const sortedAchievements = data
          .filter((achievement: Achievement) => achievement.earned_at)
          .sort((a: Achievement, b: Achievement) => new Date(b.earned_at!).getTime() - new Date(a.earned_at!).getTime())
          .slice(0, 3);
          
        setRecentAchievements(sortedAchievements);
      }
    } catch (err) {
      console.error('Error fetching achievements:', err);
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

      if (response.ok) {
        const data = await response.json();
        
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
        }
        
        if (data.encrypted_data) {
          localStorage.setItem('encrypted_user_data', data.encrypted_data);
        }
        
        // Update avatar with new initials
        setProfileData(prev => ({
          ...prev,
          avatar: getUserInitials(prev.fname, prev.lname, prev.username)
        }));
        
        setIsEditing(false);
        setError(null);
        
        // Refresh the cache and reload data
        await apiService.refreshData('user');
        await loadProfileData();
        
      } else {
        const errorText = await response.text();
        setError('Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Network error while updating profile');
    } finally {
      setLoading(false);
    }
  };

  // Retry function for failed requests
  const retryFetchData = async () => {
    await apiService.refreshData('user');
    await loadProfileData();
  };

  // Initialize component
  useEffect(() => {
    loadProfileData();
  }, []);

  // Update avatar whenever name or username changes
  useEffect(() => {
    const newAvatar = getUserInitials(profileData.fname, profileData.lname, profileData.username);
    if (newAvatar !== profileData.avatar) {
      setProfileData(prev => ({
        ...prev,
        avatar: newAvatar
      }));
    }
  }, [profileData.fname, profileData.lname, profileData.username]);

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
            {profileData.avatar || '?'}
          </div>
        </div>
        <div>
          <h2 className="font-pixel text-xl text-primary">{profileData.username || 'User'}</h2>
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
                    {profileData.avatar || '?'}
                  </div>
                </div>
                <p className="text-xs text-gray-400">Avatar based on your name initials</p>
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