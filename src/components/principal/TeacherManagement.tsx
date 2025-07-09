import React, { useState, useEffect } from 'react';
import {
    GraduationCap,
    Mail,
    Calendar,
    Search,
    RefreshCw,
    UserCheck,
    BookOpen,
    Award,
    Filter,
    Download,
    Plus,
    ChevronDown,
    Clock
} from 'lucide-react';
import { principalService, Teacher } from '../../services/principalService';

interface TeacherManagementProps {
    schoolData: any;
    onRefresh: () => void;
}

export const TeacherManagement: React.FC<TeacherManagementProps> = ({
    schoolData,
    onRefresh
}) => {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'name' | 'email' | 'created_at'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        loadTeachers();
    }, [schoolData]); const loadTeachers = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('👨‍🏫 Loading teachers from backend...');
            const teachersData = await principalService.getSchoolTeachers();
            console.log('✅ Teachers data received:', teachersData);

            if (teachersData && teachersData.length > 0) {
                setTeachers(teachersData);
                console.log(`📋 Loaded ${teachersData.length} teachers successfully`);
            } else {
                console.log('📋 No teachers found in school');
                setTeachers([]);
            }
        } catch (error) {
            console.error('❌ Failed to load teachers:', error);
            setError(
                `Failed to load teachers: ${error instanceof Error ? error.message : String(error)
                }`
            );
            setTeachers([]); // Set empty array instead of mock data
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (field: 'name' | 'email' | 'created_at') => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const filteredTeachers = teachers.filter(teacher =>
        teacher.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedTeachers = [...filteredTeachers].sort((a, b) => {
        let aValue: string | number = '';
        let bValue: string | number = '';

        switch (sortBy) {
            case 'name':
                aValue = a.name || '';
                bValue = b.name || '';
                break;
            case 'email':
                aValue = a.email || '';
                bValue = b.email || '';
                break;
            case 'created_at':
                aValue = new Date(a.created_at).getTime();
                bValue = new Date(b.created_at).getTime();
                break;
        }

        if (sortOrder === 'asc') {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
    });

    const viewTeacherDetails = (teacher: Teacher) => {
        setSelectedTeacher(teacher);
        setShowDetails(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 text-white animate-spin" />
                <span className="ml-3 text-white">Loading teachers...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Teacher Management</h2>
                    <p className="text-gray-300">Manage teaching staff and their assignments</p>
                </div>

                <div className="flex items-center space-x-4">
                    <button
                        onClick={loadTeachers}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-500 bg-opacity-20 hover:bg-opacity-30 rounded-lg text-blue-300 transition-all"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Refresh</span>
                    </button>

                    <button className="flex items-center space-x-2 px-4 py-2 bg-green-500 bg-opacity-20 hover:bg-opacity-30 rounded-lg text-green-300 transition-all">
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                    </button>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-500 bg-opacity-20 border border-red-500 border-opacity-30 rounded-lg p-4">
                    <p className="text-red-300">{error}</p>
                    <button
                        onClick={loadTeachers}
                        className="mt-2 text-red-200 hover:text-white underline"
                    >
                        Retry loading teachers
                    </button>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 bg-opacity-20 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-200 text-sm">Total Teachers</p>
                            <p className="text-2xl font-bold text-white">{teachers.length}</p>
                            <p className="text-green-300 text-xs mt-1">Active staff members</p>
                        </div>
                        <div className="w-12 h-12 bg-green-500 bg-opacity-30 rounded-lg flex items-center justify-center">
                            <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-opacity-20 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-200 text-sm">Active Teachers</p>
                            <p className="text-2xl font-bold text-white">{teachers.length}</p>
                            <p className="text-blue-300 text-xs mt-1">Currently teaching</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-500 bg-opacity-30 rounded-lg flex items-center justify-center">
                            <UserCheck className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-pink-500 bg-opacity-20 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-200 text-sm">Total Subjects</p>
                            <p className="text-2xl font-bold text-white">
                                {teachers.reduce((sum, t) => sum + (t.subjects?.length || 0), 0)}
                            </p>
                            <p className="text-purple-300 text-xs mt-1">Subjects taught</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-500 bg-opacity-30 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-red-500 bg-opacity-20 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-200 text-sm">Avg Performance</p>
                            <p className="text-2xl font-bold text-white">4.6/5</p>
                            <p className="text-orange-300 text-xs mt-1">Teacher rating</p>
                        </div>
                        <div className="w-12 h-12 bg-orange-500 bg-opacity-30 rounded-lg flex items-center justify-center">
                            <Award className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search teachers by name, username, or email..."
                        className="w-full pl-10 pr-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex items-center space-x-2">
                    <button className="flex items-center space-x-2 px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-gray-300 hover:text-white transition-all">
                        <Filter className="w-4 h-4" />
                        <span>Filter</span>
                        <ChevronDown className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Teachers List */}
            {sortedTeachers.length === 0 ? (
                <div className="text-center py-12">
                    <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-white mb-2">
                        {teachers.length === 0 ? 'No Teachers Yet' : 'No matching teachers'}
                    </h4>
                    <p className="text-gray-300 mb-6">
                        {teachers.length === 0
                            ? 'Generate teacher access codes to invite teachers to your school.'
                            : 'Try adjusting your search criteria.'
                        }
                    </p>
                    {teachers.length === 0 && (
                        <button
                            onClick={onRefresh}
                            className="flex items-center space-x-2 px-6 py-3 bg-blue-500 bg-opacity-20 hover:bg-opacity-30 rounded-lg text-blue-300 transition-all mx-auto"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Invite Teachers</span>
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl border border-white border-opacity-20 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white bg-opacity-5">
                                <tr>
                                    <th
                                        className="px-6 py-4 text-left text-sm font-medium text-gray-300 cursor-pointer hover:text-white transition-colors"
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Teacher</span>
                                            <ChevronDown className={`w-4 h-4 transition-transform ${sortBy === 'name' && sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-4 text-left text-sm font-medium text-gray-300 cursor-pointer hover:text-white transition-colors"
                                        onClick={() => handleSort('email')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Contact</span>
                                            <ChevronDown className={`w-4 h-4 transition-transform ${sortBy === 'email' && sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Subjects</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Performance</th>
                                    <th
                                        className="px-6 py-4 text-left text-sm font-medium text-gray-300 cursor-pointer hover:text-white transition-colors"
                                        onClick={() => handleSort('created_at')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Joined</span>
                                            <ChevronDown className={`w-4 h-4 transition-transform ${sortBy === 'created_at' && sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white divide-opacity-10">
                                {sortedTeachers.map((teacher) => (
                                    <tr key={teacher.id} className="hover:bg-white hover:bg-opacity-5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                                                    <span className="text-white font-medium text-sm">
                                                        {teacher.name?.charAt(0).toUpperCase() || 'T'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">{teacher.name}</p>
                                                    <p className="text-gray-400 text-sm">@{teacher.username}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2 text-gray-300">
                                                <Mail className="w-4 h-4" />
                                                <span className="text-sm">{teacher.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {teacher.subjects?.slice(0, 2).map((subject) => (
                                                    <span
                                                        key={subject.id}
                                                        className="px-2 py-1 bg-blue-500 bg-opacity-20 text-blue-300 text-xs rounded-full"
                                                    >
                                                        {subject.name}
                                                    </span>
                                                ))}
                                                {(teacher.subjects?.length || 0) > 2 && (
                                                    <span className="px-2 py-1 bg-gray-500 bg-opacity-20 text-gray-300 text-xs rounded-full">
                                                        +{(teacher.subjects?.length || 0) - 2} more
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-8 h-2 bg-white bg-opacity-10 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                                                        style={{ width: '92%' }}
                                                    ></div>
                                                </div>
                                                <span className="text-white text-sm font-medium">4.6/5</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2 text-gray-300">
                                                <Calendar className="w-4 h-4" />
                                                <span className="text-sm">
                                                    {new Date(teacher.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => viewTeacherDetails(teacher)}
                                                className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Teacher Details Modal */}
            {showDetails && selectedTeacher && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">Teacher Details</h3>
                            <button
                                onClick={() => setShowDetails(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Teacher Info */}
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-xl">
                                        {selectedTeacher.name?.charAt(0).toUpperCase() || 'T'}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-white">{selectedTeacher.name}</h4>
                                    <p className="text-gray-400">@{selectedTeacher.username}</p>
                                    <div className="flex items-center space-x-2 mt-1 text-gray-300">
                                        <Mail className="w-4 h-4" />
                                        <span>{selectedTeacher.email}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Subjects Taught */}
                            <div>
                                <h5 className="text-lg font-semibold text-white mb-3">Subjects Taught</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {selectedTeacher.subjects?.map((subject) => (
                                        <div key={subject.id} className="bg-white bg-opacity-10 rounded-lg p-4">
                                            <h6 className="text-white font-medium">{subject.name}</h6>
                                            <div className="flex items-center space-x-2 mt-2 text-gray-300 text-sm">
                                                <Clock className="w-4 h-4" />
                                                <span>Since {new Date(subject.created_date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Performance Stats */}
                            <div>
                                <h5 className="text-lg font-semibold text-white mb-3">Performance</h5>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white bg-opacity-10 rounded-lg p-4 text-center">
                                        <p className="text-2xl font-bold text-green-400">4.6/5</p>
                                        <p className="text-gray-300 text-sm">Student Rating</p>
                                    </div>
                                    <div className="bg-white bg-opacity-10 rounded-lg p-4 text-center">
                                        <p className="text-2xl font-bold text-blue-400">92%</p>
                                        <p className="text-gray-300 text-sm">Assignment Completion</p>
                                    </div>
                                    <div className="bg-white bg-opacity-10 rounded-lg p-4 text-center">
                                        <p className="text-2xl font-bold text-purple-400">85</p>
                                        <p className="text-gray-300 text-sm">Students Taught</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
