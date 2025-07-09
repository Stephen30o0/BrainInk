import React, { useState, useEffect } from 'react';
import {
    Users,
    GraduationCap,
    BookOpen,
    TrendingUp,
    Award,
    Clock,
    AlertCircle,
    CheckCircle,
    UserPlus,
    Building
} from 'lucide-react';
import { principalService } from '../../services/principalService';

interface PrincipalOverviewProps {
    schoolData: any;
}

export const PrincipalOverview: React.FC<PrincipalOverviewProps> = ({
    schoolData
}) => {
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOverviewData();
    }, [schoolData]);

    const loadOverviewData = async () => {
        try {
            setLoading(true);

            // Try to fetch additional data from backend
            try {
                await principalService.getSchoolAnalytics();
            } catch (error) {
                console.log('Backend data not available, using local data');
            }

            // Simulate recent activity data
            const mockActivity = [
                {
                    id: 1,
                    type: 'new_student',
                    title: 'New Student Enrollment',
                    description: 'Sarah Johnson joined Mathematics class',
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    icon: UserPlus,
                    color: 'text-green-400'
                },
                {
                    id: 2,
                    type: 'assignment_created',
                    title: 'Assignment Created',
                    description: 'Dr. Smith created "Algebra Quiz #3" for Math 101',
                    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                    icon: BookOpen,
                    color: 'text-blue-400'
                },
                {
                    id: 3,
                    type: 'grade_submitted',
                    title: 'Grades Submitted',
                    description: 'Ms. Davis submitted grades for 25 students',
                    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
                    icon: Award,
                    color: 'text-purple-400'
                },
                {
                    id: 4,
                    type: 'access_code_used',
                    title: 'Access Code Used',
                    description: 'Teacher access code used by John Wilson',
                    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
                    icon: CheckCircle,
                    color: 'text-cyan-400'
                }
            ];
            setRecentActivity(mockActivity);

        } catch (error) {
            console.error('Failed to load overview data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)} hours ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 animate-pulse">
                        <div className="h-4 bg-white bg-opacity-20 rounded w-1/3 mb-4"></div>
                        <div className="h-8 bg-white bg-opacity-20 rounded w-2/3"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* School Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-opacity-20 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-cyan-200 text-sm">Total Students</p>
                            <p className="text-2xl font-bold text-white">
                                {schoolData?.user_counts?.total_students || schoolData?.total_students || 0}
                            </p>
                            <p className="text-cyan-300 text-xs mt-1">
                                <span className="flex items-center">
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    +{schoolData?.user_counts?.recent_students || 0} recent
                                </span>
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-cyan-500 bg-opacity-30 rounded-lg flex items-center justify-center">
                            <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-emerald-500 bg-opacity-20 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-200 text-sm">Teachers</p>
                            <p className="text-2xl font-bold text-white">
                                {schoolData?.user_counts?.total_teachers || schoolData?.total_teachers || 0}
                            </p>
                            <p className="text-green-300 text-xs mt-1">
                                <span className="flex items-center">
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    +{schoolData?.user_counts?.recent_teachers || 0} recent
                                </span>
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-green-500 bg-opacity-30 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-pink-500 bg-opacity-20 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-200 text-sm">Classrooms</p>
                            <p className="text-2xl font-bold text-white">
                                {schoolData?.infrastructure?.total_classrooms || schoolData?.total_classrooms || 0}
                            </p>
                            <p className="text-purple-300 text-xs mt-1">
                                <span className="flex items-center">
                                    <Building className="w-3 h-3 mr-1" />
                                    All active
                                </span>
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-purple-500 bg-opacity-30 rounded-lg flex items-center justify-center">
                            <Building className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-red-500 bg-opacity-20 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-200 text-sm">Subjects</p>
                            <p className="text-2xl font-bold text-white">
                                {schoolData?.total_subjects || 0}
                            </p>
                            <p className="text-orange-300 text-xs mt-1">
                                <span className="flex items-center">
                                    <BookOpen className="w-3 h-3 mr-1" />
                                    Active courses
                                </span>
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-orange-500 bg-opacity-30 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => {
                            // Navigate to invitations tab
                            window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: 'invitations' }));
                        }}
                        className="flex items-center justify-center p-4 bg-blue-500 bg-opacity-20 hover:bg-opacity-30 rounded-lg text-blue-300 transition-all group"
                    >
                        <UserPlus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                        <span>Invite Teachers</span>
                    </button>
                    <button
                        onClick={() => {
                            // Navigate to classrooms tab
                            window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: 'classrooms' }));
                        }}
                        className="flex items-center justify-center p-4 bg-purple-500 bg-opacity-20 hover:bg-opacity-30 rounded-lg text-purple-300 transition-all group"
                    >
                        <Building className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                        <span>Manage Classrooms</span>
                    </button>
                    <button
                        onClick={() => {
                            // Navigate to analytics tab
                            window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: 'analytics' }));
                        }}
                        className="flex items-center justify-center p-4 bg-green-500 bg-opacity-20 hover:bg-opacity-30 rounded-lg text-green-300 transition-all group"
                    >
                        <TrendingUp className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                        <span>View Analytics</span>
                    </button>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="md:col-span-2 bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                    <button
                        onClick={loadOverviewData}
                        className="text-sm text-gray-300 hover:text-white transition-colors"
                    >
                        Refresh
                    </button>
                </div>

                <div className="space-y-4">
                    {recentActivity.map((activity) => {
                        const Icon = activity.icon;
                        return (
                            <div key={activity.id} className="flex items-start space-x-3 p-3 bg-white bg-opacity-5 rounded-lg">
                                <div className="w-8 h-8 bg-white bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Icon className={`w-4 h-4 ${activity.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium text-sm">{activity.title}</p>
                                    <p className="text-gray-300 text-xs">{activity.description}</p>
                                    <div className="flex items-center space-x-1 mt-1">
                                        <Clock className="w-3 h-3 text-gray-400" />
                                        <span className="text-gray-400 text-xs">{formatTime(activity.timestamp)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {recentActivity.length === 0 && (
                    <div className="text-center py-8">
                        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-300">No recent activity</p>
                    </div>
                )}
            </div>

            {/* School Information */}
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20">
                <h3 className="text-lg font-semibold text-white mb-4">School Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Basic Details</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-300">School Name:</span>
                                <span className="text-white">
                                    {schoolData?.school_info?.name || schoolData?.name || 'Unknown'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-300">Address:</span>
                                <span className="text-white text-right">
                                    {schoolData?.school_info?.address || schoolData?.address || 'Not specified'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-300">Established:</span>
                                <span className="text-white">
                                    {schoolData?.school_info?.created_at || schoolData?.created_date ?
                                        new Date(schoolData.school_info?.created_at || schoolData.created_date).toLocaleDateString() :
                                        'Unknown'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Statistics</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-300">Student-Teacher Ratio:</span>
                                <span className="text-white">
                                    {(schoolData?.user_counts?.total_teachers || schoolData?.total_teachers || 0) > 0
                                        ? Math.round((schoolData?.user_counts?.total_students || schoolData?.total_students || 0) /
                                            (schoolData?.user_counts?.total_teachers || schoolData?.total_teachers || 1))
                                        : 0}:1
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-300">Total Classrooms:</span>
                                <span className="text-white">
                                    {schoolData?.infrastructure?.total_classrooms || schoolData?.total_classrooms || 0}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-300">Active Status:</span>
                                <span className="text-green-400">
                                    Active
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
