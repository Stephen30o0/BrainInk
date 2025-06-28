import React, { useState } from 'react';
import { Settings, User, Bell, Database, Shield, Eye, Save } from 'lucide-react';

interface TeacherSettings {
  profile: {
    name: string;
    email: string;
    subjects: string[];
    classId: string;
    school: string;
  };
  notifications: {
    emailAlerts: boolean;
    pushNotifications: boolean;
    weeklyReports: boolean;
    aiInsights: boolean;
    studentProgress: boolean;
  };
  privacy: {
    shareDataWithSchool: boolean;
    anonymousAnalytics: boolean;
    dataRetention: string;
  };
  kanaSettings: {
    analysisFrequency: string;
    confidenceThreshold: number;
    autoSendImprovementPlans: boolean;
    includeWeakAreas: boolean;
  };
}

export const TeacherSettings: React.FC = () => {
  const [settings, setSettings] = useState<TeacherSettings>({
    profile: {
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@school.edu',
      subjects: ['Mathematics', 'Physics'],
      classId: 'MATH-101-2024',
      school: 'Lincoln High School'
    },
    notifications: {
      emailAlerts: true,
      pushNotifications: true,
      weeklyReports: true,
      aiInsights: true,
      studentProgress: true
    },
    privacy: {
      shareDataWithSchool: true,
      anonymousAnalytics: true,
      dataRetention: '2_years'
    },
    kanaSettings: {
      analysisFrequency: 'daily',
      confidenceThreshold: 75,
      autoSendImprovementPlans: false,
      includeWeakAreas: true
    }
  });

  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Here you would save settings to your backend
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateProfile = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      profile: { ...prev.profile, [field]: value }
    }));
  };

  const updateNotifications = (field: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [field]: value }
    }));
  };

  const updatePrivacy = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      privacy: { ...prev.privacy, [field]: value }
    }));
  };

  const updateKanaSettings = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      kanaSettings: { ...prev.kanaSettings, [field]: value }
    }));
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'kana', label: 'K.A.N.A. Settings', icon: Database }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings className="w-8 h-8 text-gray-600" />
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Teacher Settings</h2>
            <p className="text-gray-600 mt-1">Manage your preferences and AI configurations</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            saved 
              ? 'bg-green-600 text-white' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <Save className="w-4 h-4" />
          <span>{saved ? 'Saved!' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Profile Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={settings.profile.name}
                      onChange={(e) => updateProfile('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={settings.profile.email}
                      onChange={(e) => updateProfile('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Class ID</label>
                    <input
                      type="text"
                      value={settings.profile.classId}
                      onChange={(e) => updateProfile('classId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">School</label>
                    <input
                      type="text"
                      value={settings.profile.school}
                      onChange={(e) => updateProfile('school', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subjects Taught</label>
                  <div className="flex flex-wrap gap-2">
                    {settings.profile.subjects.map((subject, index) => (
                      <span key={index} className="inline-flex px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {subject}
                      </span>
                    ))}
                  </div>
                  <button className="mt-2 text-sm text-blue-600 hover:text-blue-700">
                    + Add Subject
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Notification Preferences</h3>
                
                <div className="space-y-4">
                  {Object.entries(settings.notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {key === 'emailAlerts' && 'Receive important alerts via email'}
                          {key === 'pushNotifications' && 'Get instant notifications in browser'}
                          {key === 'weeklyReports' && 'Weekly summary of class performance'}
                          {key === 'aiInsights' && 'K.A.N.A. AI recommendations and insights'}
                          {key === 'studentProgress' && 'Updates when students need attention'}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => updateNotifications(key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Privacy & Data</h3>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Share Data with School</h4>
                      <p className="text-sm text-gray-600">Allow school administrators to view aggregated class data</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.privacy.shareDataWithSchool}
                        onChange={(e) => updatePrivacy('shareDataWithSchool', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data Retention Period</label>
                    <select
                      value={settings.privacy.dataRetention}
                      onChange={(e) => updatePrivacy('dataRetention', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="1_year">1 Year</option>
                      <option value="2_years">2 Years</option>
                      <option value="3_years">3 Years</option>
                      <option value="indefinite">Indefinite</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* K.A.N.A. Settings Tab */}
            {activeTab === 'kana' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">K.A.N.A. AI Configuration</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Analysis Frequency</label>
                    <select
                      value={settings.kanaSettings.analysisFrequency}
                      onChange={(e) => updateKanaSettings('analysisFrequency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="realtime">Real-time</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confidence Threshold: {settings.kanaSettings.confidenceThreshold}%
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="95"
                      value={settings.kanaSettings.confidenceThreshold}
                      onChange={(e) => updateKanaSettings('confidenceThreshold', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Only show suggestions with this confidence level or higher
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Auto-send Improvement Plans</h4>
                      <p className="text-sm text-gray-600">Automatically send K.A.N.A. generated plans to students</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.kanaSettings.autoSendImprovementPlans}
                        onChange={(e) => updateKanaSettings('autoSendImprovementPlans', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
