import React from 'react';
import {
  LayoutDashboard,
  Upload,
  Users,
  User,
  Brain,
  Settings,
  LogOut,
  UserPlus,
  FileText,
  CheckSquare,
  Map,
  ChevronLeft,
  ChevronRight,
  PieChart,
  MessageSquare
} from 'lucide-react';

interface TeacherSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  teacher: any;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onLogout?: () => void | Promise<void>;
}

export const TeacherSidebar: React.FC<TeacherSidebarProps> = ({
  activeTab,
  onTabChange,
  isCollapsed = false,
  onToggleCollapse,
  onLogout
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
      id: 'assignments',
      label: 'Assignment Manager',
      icon: FileText,
      description: 'Create & Manage Assignments'
    },
    {
      id: 'grading',
      label: 'Grading Dashboard',
      icon: CheckSquare,
      description: 'Grade Assignments'
    },
    {
      id: 'syllabus',
      label: 'Curiculum',
      icon: Map,
      description: 'Manage Curriculum'
    },
    {
      id: 'ai-suggestions',
      label: 'K.A.N.A. Insights',
      icon: Brain,
      description: 'AI Recommendations'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: PieChart,
      description: 'Generate Reports'
    },
    {
      id: 'manage-class',
      label: 'Manage Class',
      icon: UserPlus,
      description: 'Add/Remove Students'
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: MessageSquare,
      description: 'WhatsApp Submissions'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'Preferences & Config'
    }
  ];

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0 z-10 transition-all duration-300 overflow-hidden`}>
      {/* Header with Logo and Collapse Toggle */}
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <User className="w-6 h-6 text-blue-600" />
            <span className="font-semibold text-gray-900">Teacher</span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-3 overflow-y-auto min-h-0">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'space-x-3 px-3'} py-2.5 rounded-lg text-left transition-colors ${isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{item.label}</div>
                    <div className="text-xs text-gray-500 truncate">{item.description}</div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onLogout}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'space-x-2 px-3'} py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg`}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};
