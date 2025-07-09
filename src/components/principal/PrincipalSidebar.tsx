import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    Settings,
    LogOut,
    School,
    Key,
    BookOpen,
    UserCheck,
    TrendingUp,
    Shield,
    Mail,
    GraduationCap,
    Users,
    Building,
    Menu,
    X,
    ChevronLeft
} from 'lucide-react';

interface PrincipalSidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    schoolData: any;
    onLogout: () => void;
    isOpen?: boolean;
    onToggle?: () => void;
}

export const PrincipalSidebar: React.FC<PrincipalSidebarProps> = ({
    activeTab,
    onTabChange,
    schoolData,
    onLogout,
    isOpen = true,
    onToggle
}) => {
    const [isMobile, setIsMobile] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth < 1024) {
                setIsCollapsed(true);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const sidebarItems = [
        {
            id: 'overview',
            label: 'Overview',
            icon: School,
            description: 'School dashboard'
        },
        {
            id: 'analytics',
            label: 'Analytics',
            icon: BarChart3,
            description: 'Performance metrics'
        },
        {
            id: 'invitations',
            label: 'Invitations',
            icon: Mail,
            description: 'Invite teachers & students'
        },
        {
            id: 'access-codes',
            label: 'Access Codes',
            icon: Key,
            description: 'Manage student/teacher codes'
        },
        {
            id: 'subjects',
            label: 'Subjects',
            icon: BookOpen,
            description: 'Curriculum management'
        },
        {
            id: 'teachers',
            label: 'Teachers',
            icon: UserCheck,
            description: 'Staff management'
        },
        {
            id: 'students',
            label: 'Students',
            icon: GraduationCap,
            description: 'Student management'
        },
        {
            id: 'classrooms',
            label: 'Classrooms',
            icon: Building,
            description: 'Classroom management'
        },
        {
            id: 'settings',
            label: 'Settings',
            icon: Settings,
            description: 'School configuration'
        }
    ];

    const handleTabChange = (tabId: string) => {
        onTabChange(tabId);
        if (isMobile && onToggle) {
            onToggle(); // Close sidebar on mobile after selection
        }
    };

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    const sidebarWidth = isCollapsed ? 'w-16' : 'w-64';
    const sidebarClasses = `
        fixed left-0 top-0 h-full bg-white bg-opacity-10 backdrop-blur-md border-r border-white border-opacity-20 z-50 
        transition-all duration-300 ease-in-out
        ${sidebarWidth}
        ${isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
    `;

    return (
        <>
            {/* Mobile Overlay */}
            {isMobile && isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={onToggle}
                />
            )}

            {/* Mobile Toggle Button */}
            {isMobile && (
                <button
                    onClick={onToggle}
                    className="fixed top-4 left-4 z-60 p-2 bg-white bg-opacity-10 backdrop-blur-md rounded-lg border border-white border-opacity-20 text-white"
                >
                    {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            )}

            {/* Sidebar */}
            <div className={sidebarClasses}>
                <div className="p-6 h-full flex flex-col">
                    {/* Header */}
                    <div className="mb-8">
                        {/* Collapse Toggle for Desktop */}
                        {!isMobile && (
                            <button
                                onClick={toggleCollapse}
                                className="absolute top-4 right-4 p-1 text-gray-400 hover:text-white transition-colors"
                            >
                                <ChevronLeft className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
                            </button>
                        )}

                        {/* School Info */}
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            {!isCollapsed && (
                                <div className="min-w-0">
                                    <h2 className="text-lg font-bold text-white truncate">Principal Portal</h2>
                                    <p className="text-sm text-gray-300 truncate">School Management</p>
                                </div>
                            )}
                        </div>

                        {/* School Stats */}
                        {!isCollapsed && schoolData && (
                            <div className="bg-white bg-opacity-5 rounded-lg p-3 border border-white border-opacity-10">
                                <h3 className="font-medium text-white text-sm mb-1 truncate">
                                    {schoolData.school_info?.name || schoolData.name || 'Unknown School'}
                                </h3>
                                <div className="flex items-center space-x-4 text-xs text-gray-300">
                                    <span>{schoolData.user_counts?.total_students || schoolData.total_students || 0} Students</span>
                                    <span>{schoolData.user_counts?.total_teachers || schoolData.total_teachers || 0} Teachers</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation Items */}
                    <nav className="space-y-2 flex-1 overflow-y-auto">
                        {sidebarItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleTabChange(item.id)}
                                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all group relative ${isActive
                                            ? 'bg-white bg-opacity-20 text-white border border-white border-opacity-30'
                                            : 'text-gray-300 hover:bg-white hover:bg-opacity-10 hover:text-white'
                                        } ${isCollapsed ? 'justify-center' : ''}`}
                                    title={isCollapsed ? item.label : undefined}
                                >
                                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                                        }`} />
                                    {!isCollapsed && (
                                        <div className="flex-1 text-left min-w-0">
                                            <div className="font-medium truncate">{item.label}</div>
                                            <div className="text-xs opacity-75 truncate">{item.description}</div>
                                        </div>
                                    )}

                                    {/* Tooltip for collapsed state */}
                                    {isCollapsed && (
                                        <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                                            <div className="font-medium">{item.label}</div>
                                            <div className="text-xs opacity-75">{item.description}</div>
                                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Quick Stats */}
                    {!isCollapsed && schoolData && (
                        <div className="mt-6 space-y-3">
                            <h4 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Quick Stats</h4>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-300">Active Codes</span>
                                    <span className="text-white font-medium">{schoolData.active_access_codes || 0}</span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-300">Subjects</span>
                                    <span className="text-white font-medium">{schoolData.total_subjects || 0}</span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-300">Enrollment</span>
                                    <div className="flex items-center space-x-1">
                                        <TrendingUp className="w-3 h-3 text-green-400" />
                                        <span className="text-green-400 font-medium">+12%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Logout Button */}
                    <div className="mt-6 pt-4 border-t border-white border-opacity-10">
                        <button
                            onClick={onLogout}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-red-500 bg-opacity-20 text-red-300 hover:bg-opacity-30 hover:text-red-200 transition-all ${isCollapsed ? 'justify-center' : ''
                                }`}
                            title={isCollapsed ? 'Logout' : undefined}
                        >
                            <LogOut className="w-5 h-5 flex-shrink-0" />
                            {!isCollapsed && <span>Logout</span>}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
