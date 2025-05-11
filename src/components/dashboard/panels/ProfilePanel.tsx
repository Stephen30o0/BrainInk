import React, { useState } from 'react';
import { Trophy, Star, Medal, Clock, Calendar, Settings, X, Camera, User, Mail } from 'lucide-react';

interface ProfileData {
  username: string;
  email: string;
  avatar: string;
  bio: string;
}

export const ProfilePanel = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    username: 'johndoe54',
    email: 'john@example.com',
    avatar: 'JP',
    bio: 'Learning enthusiast and knowledge seeker'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically make an API call to update the profile
    setIsEditing(false);
  };

  return <div className="p-4 space-y-6">
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
            <span className="text-gray-400 text-sm">Silver II</span>
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
        value: '12,450',
        icon: <Star size={16} />
      }, {
        label: 'Rank',
        value: '#342',
        icon: <Trophy size={16} />
      }, {
        label: 'Study Hours',
        value: '156h',
        icon: <Clock size={16} />
      }, {
        label: 'Member Since',
        value: 'Mar 2024',
        icon: <Calendar size={16} />
      }].map((stat, i) => <div key={i} className="bg-dark/50 border border-primary/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              {stat.icon}
              <span className="text-xs">{stat.label}</span>
            </div>
            <div className="font-pixel text-primary">{stat.value}</div>
          </div>)}
      </div>
      {/* Recent Achievements */}
      <div>
        <h3 className="font-pixel text-primary text-sm mb-3">
          Recent Achievements
        </h3>
        <div className="space-y-3">
          {[{
          name: 'Quick Learner',
          desc: 'Complete 5 lessons in one day',
          icon: '🚀'
        }, {
          name: 'Social Butterfly',
          desc: 'Make 3 new friends',
          icon: '🦋'
        }, {
          name: 'Quiz Master',
          desc: 'Win 3 quizzes in a row',
          icon: '🏆'
        }].map((achievement, i) => <div key={i} className="flex items-center gap-3 bg-dark/30 border border-primary/20 rounded-lg p-3">
              <div className="text-2xl">{achievement.icon}</div>
              <div>
                <div className="text-sm text-primary">{achievement.name}</div>
                <div className="text-xs text-gray-400">{achievement.desc}</div>
              </div>
            </div>)}
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
          <div className="bg-dark border border-primary/20 rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-pixel text-xl text-primary">Edit Profile</h3>
              <button 
                onClick={() => setIsEditing(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-4 mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary p-[2px]">
                  <div className="w-full h-full rounded-full bg-dark flex items-center justify-center text-2xl">
                    {profileData.avatar}
                  </div>
                </div>
                <button 
                  type="button"
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
                >
                  <Camera size={16} />
                  <span className="text-sm">Change Avatar</span>
                </button>
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
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Bio</label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  className="w-full bg-dark/50 border border-primary/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary resize-none h-24"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-secondary text-dark font-pixel py-2 rounded-lg hover:opacity-90 transition-all duration-300"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>;
};