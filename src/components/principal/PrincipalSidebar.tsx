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
    ChevronLeft,
    Map
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
    const [isTablet, setIsTablet] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            const width = window.innerWidth;
            const newIsMobile = width < 768;
            const newIsTablet = width >= 768 && width < 1024;

            setIsMobile(newIsMobile);
            setIsTablet(newIsTablet);

            // Only auto-collapse on mobile screens, keep expanded on tablet and desktop
            if (newIsMobile) {
                setIsCollapsed(true);
            } else {
                // Always show full sidebar on tablet and desktop
                setIsCollapsed(false);
            }
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
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
            id: 'syllabus',
            label: 'Syllabus Management',
            icon: Map,
            description: 'Curriculum syllabuses'
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
        // Allow manual toggle on desktop and tablet, but not on mobile
        if (!isMobile) {
            setIsCollapsed(!isCollapsed);
        }
    };

    // Responsive sidebar width and positioning
    const getSidebarClasses = () => {
        if (isMobile) {
            return `
                fixed left-0 top-0 h-full bg-white shadow-xl border-r border-gray-200 z-50 
                transition-all duration-300 ease-in-out w-64
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `;
        }

        const width = isCollapsed ? 'w-20' : 'w-72'; // Increased from w-64 to w-72
        return `
            fixed left-0 top-0 h-full bg-white shadow-lg border-r border-gray-200 z-40
            transition-all duration-300 ease-in-out ${width}
        `;
    };

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
                    className="fixed top-4 left-4 z-60 p-3 bg-white shadow-lg rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            )}

            {/* Sidebar */}
            <div className={getSidebarClasses()}>
                <div className={`h-full flex flex-col ${isCollapsed && !isMobile ? 'px-3 py-6' : 'p-6'}`}>
                    {/* Header */}
                    <div className={`${isCollapsed && !isMobile ? 'mb-6' : 'mb-8'}`}>
                        {/* Collapse Toggle for Desktop */}
                        {!isMobile && (
                            <button
                                onClick={toggleCollapse}
                                className={`absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all ${isCollapsed ? 'right-2' : 'right-4'}`}
                                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            >
                                <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
                            </button>
                        )}

                        {/* School Info */}
                        <div className={`flex items-center mb-4 ${isCollapsed && !isMobile ? 'justify-center' : 'space-x-3'}`}>
                            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                                <School className="w-7 h-7 text-white" />
                            </div>
                            {(!isCollapsed || isMobile) && (
                                <div className="min-w-0 ml-3">
                                    <h2 className="text-xl font-bold text-gray-900 truncate">Principal Portal</h2>
                                    <p className="text-sm text-gray-500 truncate">School Management</p>
                                </div>
                            )}
                        </div>

                        {/* School Stats */}
                        {(!isCollapsed || isMobile) && schoolData && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                                <h3 className="font-semibold text-gray-900 text-sm mb-2 truncate">
                                    {schoolData.school_info?.name || schoolData.name || 'Unknown School'}
                                </h3>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-white rounded-lg p-2 text-center">
                                        <div className="font-bold text-blue-600">{schoolData.user_counts?.total_students || schoolData.total_students || 0}</div>
                                        <div className="text-gray-500">Students</div>
                                    </div>
                                    <div className="bg-white rounded-lg p-2 text-center">
                                        <div className="font-bold text-green-600">{schoolData.user_counts?.total_teachers || schoolData.total_teachers || 0}</div>
                                        <div className="text-gray-500">Teachers</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation Items */}
                    <nav className={`flex-1 overflow-y-auto ${isCollapsed && !isMobile ? 'space-y-2' : 'space-y-2'}`}>
                        {sidebarItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleTabChange(item.id)}
                                    className={`w-full flex items-center transition-all duration-200 group relative rounded-xl
                                        ${isCollapsed && !isMobile
                                            ? 'p-3 justify-center'
                                            : 'px-4 py-3'
                                        }
                                        ${isActive
                                            ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                                        }`}
                                    title={isCollapsed && !isMobile ? item.label : undefined}
                                >
                                    <Icon className={`flex-shrink-0 transition-colors duration-200
                                        ${isCollapsed && !isMobile ? 'w-6 h-6' : 'w-5 h-5'}
                                        ${(!isCollapsed || isMobile) ? 'mr-3' : ''}
                                        ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}
                                    />
                                    {(!isCollapsed || isMobile) && (
                                        <div className="flex-1 text-left min-w-0">
                                            <div className="font-medium truncate">{item.label}</div>
                                            {!isMobile && !isCollapsed && (
                                                <div className="text-xs text-gray-500 truncate mt-0.5">{item.description}</div>
                                            )}
                                            {isMobile && (
                                                <div className="text-xs text-gray-500 truncate">{item.description}</div>
                                            )}
                                        </div>
                                    )}

                                    {/* Active indicator for collapsed state */}
                                    {isCollapsed && !isMobile && isActive && (
                                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-l-full"></div>
                                    )}

                                    {/* Tooltip for collapsed state */}
                                    {isCollapsed && !isMobile && (
                                        <div className="absolute left-full ml-3 px-4 py-3 bg-gray-900 text-white text-sm rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
                                            <div className="font-medium">{item.label}</div>
                                            <div className="text-xs opacity-75 mt-1">{item.description}</div>
                                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 w-3 h-3 bg-gray-900 rotate-45"></div>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Logout Button */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <button
                            onClick={onLogout}
                            className={`w-full flex items-center transition-all duration-200 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 hover:shadow-md
                                ${isCollapsed && !isMobile
                                    ? 'p-3 justify-center'
                                    : 'px-4 py-3 space-x-3'
                                }`}
                            title={isCollapsed && !isMobile ? 'Logout' : undefined}
                        >
                            <LogOut className={`flex-shrink-0 ${isCollapsed && !isMobile ? 'w-6 h-6' : 'w-5 h-5'}`} />
                            {(!isCollapsed || isMobile) && <span className="font-medium">Logout</span>}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
