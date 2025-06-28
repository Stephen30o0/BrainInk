import React from 'react';
import { 
  LayoutDashboard, 
  Upload, 
  Users, 
  User, 
  Brain, 
  Settings,
  BookOpen,
  BarChart3,
  LogOut,
  UserPlus
} from 'lucide-react';

interface TeacherSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  teacher: any;
}

export const TeacherSidebar: React.FC<TeacherSidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  teacher 
}) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview & Analytics'
    },
    {
      id: 'upload',
      label: 'Upload & Analyze',
      icon: Upload,
      description: 'OCR & AI Analysis'
    },
    {
      id: 'class',
      label: 'Class Overview',
      icon: Users,
      description: 'Class Performance'
    },
    {
      id: 'students',
      label: 'Student Profiles',
      icon: User,
      description: 'Individual Progress'
    },
    {
      id: 'ai-suggestions',
      label: 'K.A.N.A. Insights',
      icon: Brain,
      description: 'AI Recommendations'
    },
    {
      id: 'manage-class',
      label: 'Manage Class',
      icon: UserPlus,
      description: 'Add/Remove Students'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'Preferences & Config'
    }
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Teacher Profile Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{teacher?.name || 'Teacher'}</h3>
            <p className="text-sm text-gray-500">{teacher?.subjects?.join(', ') || 'Educator'}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-50 p-2 rounded">
            <div className="font-medium text-gray-900">Class ID</div>
            <div className="text-gray-600">{teacher?.classId || 'N/A'}</div>
          </div>
          <div className="bg-blue-50 p-2 rounded">
            <div className="font-medium text-blue-900">K.A.N.A.</div>
            <div className="text-blue-600 text-xs">Active</div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Quick Stats */}
      <div className="p-4 border-t border-gray-200">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Today's Activity</span>
            <BarChart3 className="w-4 h-4 text-gray-400" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-2xl font-bold text-green-600">24</div>
              <div className="text-gray-600">Notes Analyzed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">8</div>
              <div className="text-gray-600">AI Insights</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg">
          <LogOut className="w-4 h-4" />
          <span>Back to Brain Ink</span>
        </button>
      </div>
    </div>
  );
};
