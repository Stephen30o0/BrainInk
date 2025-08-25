import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Brain,
    Users,
    Search,
    Bell,
    User,
    GraduationCap,
    Target,
    MessageSquare,
    Home,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

// Import required panel components
import { ProfilePanel } from '../components/dashboard/panels/ProfilePanel';
import { FriendsPanel } from '../components/dashboard/panels/FriendsPanel';
import { MessagesPanel } from '../components/dashboard/MessagesPanel';
import { ArenaHub } from '../components/arena/ArenaHub';
import { StudyCentre } from '../components/study/StudyCentre';
import { NotificationsPanel } from '../components/dashboard/NotificationsPanel';

// Type definitions for Student Hub sections
type StudentSection = 'dashboard' | 'profile' | 'battle-arena' | 'study-centre' | 'friends' | 'messages';

interface StudentNavItem {
    id: StudentSection;
    label: string;
    icon: React.ReactNode;
    color: string;
}

// Dashboard Content Component
const DashboardContent: React.FC<{ onNavigate: (section: StudentSection) => void }> = ({ onNavigate }) => {
    return (
        <div className="p-8 space-y-8">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Hello, Student 👋</h1>
                    <p className="text-gray-600">Today is Monday, 25 October 2025</p>
                </div>
            </div>

            {/* Project Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Study Centre Card */}
                <motion.div
                    className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white cursor-pointer hover:shadow-lg transition-all duration-200"
                    whileHover={{ scale: 1.02 }}
                    onClick={() => onNavigate('study-centre')}
                >
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold">Study Centre</h3>
                            <p className="text-emerald-100 text-sm">Access your courses</p>
                        </div>
                        <div className="bg-white/20 p-2 rounded-lg">
                            <GraduationCap size={20} />
                        </div>
                    </div>
                </motion.div>

                {/* Battle Arena Card */}
                <motion.div
                    className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl p-6 text-white cursor-pointer hover:shadow-lg transition-all duration-200"
                    whileHover={{ scale: 1.02 }}
                    onClick={() => onNavigate('battle-arena')}
                >
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold">Battle Arena</h3>
                            <p className="text-cyan-100 text-sm">Challenge yourself</p>
                        </div>
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Target size={20} />
                        </div>
                    </div>
                </motion.div>

                {/* Friends Card */}
                <motion.div
                    className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white cursor-pointer hover:shadow-lg transition-all duration-200"
                    whileHover={{ scale: 1.02 }}
                    onClick={() => onNavigate('friends')}
                >
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold">Friends</h3>
                            <p className="text-orange-100 text-sm">Connect with classmates</p>
                        </div>
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Users size={20} />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Welcome Section */}
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <GraduationCap size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    Welcome to Your Learning Hub
                </h2>
                <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                    Select from the menu on the left to access your courses, practice in the battle arena,
                    connect with classmates, or manage your profile. Everything you need for academic success is here.
                </p>
            </div>
        </div>
    );
}; export const StudentHub = () => {
    const [activeSidePanel, setActiveSidePanel] = useState<StudentSection>('dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    // Modern sidebar navigation items
    const sidebarItems: StudentNavItem[] = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: <Home size={20} />,
            color: '#3b82f6'
        },
        {
            id: 'profile',
            label: 'Profile',
            icon: <User size={20} />,
            color: '#8b5cf6'
        },
        {
            id: 'study-centre',
            label: 'Study Centre',
            icon: <GraduationCap size={20} />,
            color: '#10b981'
        },
        {
            id: 'battle-arena',
            label: 'Battle Arena',
            icon: <Target size={20} />,
            color: '#f59e0b'
        },
        {
            id: 'friends',
            label: 'Friends',
            icon: <Users size={20} />,
            color: '#ef4444'
        },
        {
            id: 'messages',
            label: 'Messages',
            icon: <MessageSquare size={20} />,
            color: '#06b6d4'
        }
    ];

    const handleNavigation = (section: StudentSection) => {
        setActiveSidePanel(section);
    };

    const renderMainContent = () => {
        switch (activeSidePanel) {
            case 'profile':
                return <ProfilePanel />;
            case 'friends':
                return <FriendsPanel />;
            case 'messages':
                return <MessagesPanel isOpen={true} onClose={() => { }} />;
            case 'battle-arena':
                return <ArenaHub onExit={() => setActiveSidePanel('dashboard')} />;
            case 'study-centre':
                return <StudyCentre />;
            default:
                return <DashboardContent onNavigate={handleNavigation} />;
        }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Fixed Sidebar */}
            <div className={`fixed left-0 top-0 h-full ${isSidebarCollapsed ? 'w-16' : 'w-64'} bg-white shadow-sm flex flex-col transition-all duration-300 z-50`}>
                {/* Logo */}
                <div className="p-6 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Brain size={20} className="text-white" />
                        </div>
                        {!isSidebarCollapsed && (
                            <div>
                                <div className="font-bold text-gray-800">BrainInk</div>
                                <div className="text-xs text-gray-500">Student Portal</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 bg-white">
                    <div className="space-y-2">
                        {sidebarItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => handleNavigation(item.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeSidePanel === item.id
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-600 hover:bg-blue-50'
                                    }`}
                            >
                                <div style={{ color: activeSidePanel === item.id ? '#3b82f6' : item.color }}>
                                    {item.icon}
                                </div>
                                {!isSidebarCollapsed && (
                                    <span className="font-medium">{item.label}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </nav>

                {/* Settings */}
                <div className="p-4 bg-white">
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-blue-50 transition-colors"
                    >
                        {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                        {!isSidebarCollapsed && <span className="font-medium">Collapse</span>}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className={`${isSidebarCollapsed ? 'ml-16' : 'ml-64'} flex flex-col min-h-screen transition-all duration-300`}>
                {/* Header */}
                <header className="bg-white shadow-sm px-8 py-4">
                    <div className="flex items-center justify-between">
                        {/* Left - Search */}
                        <div className="flex-1 max-w-lg">
                            <div className="relative">
                                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search knowledge..."
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Right - Calendar, Notifications, Profile */}
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className="text-sm font-medium text-gray-800">Calendar</div>
                                <div className="text-xs text-gray-500">Oct 25, 2025</div>
                            </div>

                            <button
                                className="relative p-2 text-gray-600 hover:bg-blue-50 rounded-lg"
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            >
                                <Bell size={20} />
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">3</span>
                            </button>

                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                    SC
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium text-gray-800">Sarah Connor</div>
                                    <div className="text-xs text-gray-500">graphic.organictower</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-auto">
                    {renderMainContent()}
                </main>
            </div>

            {/* Notifications Panel */}
            <NotificationsPanel
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
            />
        </div>
    );
};
