import React, { useState, useEffect } from 'react';
import {
    Users,
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
    Clock,
    MapPin,
    BarChart3
} from 'lucide-react';
import { principalService, Student } from '../../services/principalService';

interface StudentManagementProps {
    schoolData: any;
    onRefresh: () => void;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({
    schoolData,
    onRefresh
}) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'name' | 'email' | 'created_at'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [filterClassroom, setFilterClassroom] = useState<string>('all');

    useEffect(() => {
        loadStudents();
    }, [schoolData]); const loadStudents = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('👨‍🎓 Loading students from backend...');
            const studentsData = await principalService.getSchoolStudents();
            console.log('✅ Students data received:', studentsData);

            if (studentsData && studentsData.length > 0) {
                setStudents(studentsData);
                console.log(`📋 Loaded ${studentsData.length} students successfully`);
            } else {
                console.log('📋 No students found in school');
                setStudents([]);
            }
        } catch (error) {
            console.error('❌ Failed to load students:', error);
            if (error instanceof Error) {
                setError(`Failed to load students: ${error.message}`);
            } else {
                setError('Failed to load students: An unknown error occurred');
            }
            setStudents([]); // Set empty array instead of mock data
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

    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesClassroom = filterClassroom === 'all' ||
            (filterClassroom === 'no-classroom' && !student.classroom_id) ||
            student.classroom_id?.toString() === filterClassroom;

        return matchesSearch && matchesClassroom;
    });

    const sortedStudents = [...filteredStudents].sort((a, b) => {
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

    const viewStudentDetails = (student: Student) => {
        setSelectedStudent(student);
        setShowDetails(true);
    };

    const getClassroomName = (classroomId?: number) => {
        if (!classroomId) return 'Unassigned';
        return `Classroom ${classroomId}`;
    };

    const uniqueClassrooms = Array.from(new Set(students.map(s => s.classroom_id).filter(Boolean)));

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 text-white animate-spin" />
                <span className="ml-3 text-white">Loading students...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Student Management</h2>
                    <p className="text-gray-300">Manage student enrollment and academic progress</p>
                </div>

                <div className="flex items-center space-x-4">
                    <button
                        onClick={loadStudents}
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
                        onClick={loadStudents}
                        className="mt-2 text-red-200 hover:text-white underline"
                    >
                        Retry loading students
                    </button>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-opacity-20 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-200 text-sm">Total Students</p>
                            <p className="text-2xl font-bold text-white">{students.length}</p>
                            <p className="text-blue-300 text-xs mt-1">Enrolled students</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-500 bg-opacity-30 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-emerald-500 bg-opacity-20 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-200 text-sm">Active Students</p>
                            <p className="text-2xl font-bold text-white">{students.length}</p>
                            <p className="text-green-300 text-xs mt-1">Currently learning</p>
                        </div>
                        <div className="w-12 h-12 bg-green-500 bg-opacity-30 rounded-lg flex items-center justify-center">
                            <UserCheck className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-pink-500 bg-opacity-20 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-200 text-sm">Avg Subjects</p>
                            <p className="text-2xl font-bold text-white">
                                {students.length > 0 ? Math.round(students.reduce((sum, s) => sum + (s.subjects?.length || 0), 0) / students.length * 10) / 10 : 0}
                            </p>
                            <p className="text-purple-300 text-xs mt-1">Per student</p>
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
                            <p className="text-2xl font-bold text-white">B+</p>
                            <p className="text-orange-300 text-xs mt-1">School average</p>
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
                        placeholder="Search students by name, username, or email..."
                        className="w-full pl-10 pr-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex items-center space-x-2">
                    <select
                        value={filterClassroom}
                        onChange={(e) => setFilterClassroom(e.target.value)}
                        className="px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Classrooms</option>
                        <option value="no-classroom">Unassigned</option>
                        {uniqueClassrooms.map(classroomId => (
                            <option key={classroomId} value={classroomId?.toString()}>
                                Classroom {classroomId}
                            </option>
                        ))}
                    </select>

                    <button className="flex items-center space-x-2 px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-gray-300 hover:text-white transition-all">
                        <Filter className="w-4 h-4" />
                        <span>More Filters</span>
                        <ChevronDown className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Students List */}
            {sortedStudents.length === 0 ? (
                <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-white mb-2">
                        {students.length === 0 ? 'No Students Yet' : 'No matching students'}
                    </h4>
                    <p className="text-gray-300 mb-6">
                        {students.length === 0
                            ? 'Generate student access codes to invite students to your school.'
                            : 'Try adjusting your search criteria or filters.'
                        }
                    </p>
                    {students.length === 0 && (
                        <button
                            onClick={onRefresh}
                            className="flex items-center space-x-2 px-6 py-3 bg-blue-500 bg-opacity-20 hover:bg-opacity-30 rounded-lg text-blue-300 transition-all mx-auto"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Invite Students</span>
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
                                            <span>Student</span>
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
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Classroom</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Subjects</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Performance</th>
                                    <th
                                        className="px-6 py-4 text-left text-sm font-medium text-gray-300 cursor-pointer hover:text-white transition-colors"
                                        onClick={() => handleSort('created_at')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Enrolled</span>
                                            <ChevronDown className={`w-4 h-4 transition-transform ${sortBy === 'created_at' && sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white divide-opacity-10">
                                {sortedStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-white hover:bg-opacity-5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                                                    <span className="text-white font-medium text-sm">
                                                        {student.name?.charAt(0).toUpperCase() || 'S'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">{student.name}</p>
                                                    <p className="text-gray-400 text-sm">@{student.username}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2 text-gray-300">
                                                <Mail className="w-4 h-4" />
                                                <span className="text-sm">{student.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                <span className="text-white text-sm">
                                                    {getClassroomName(student.classroom_id)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {student.subjects?.slice(0, 2).map((subject) => (
                                                    <span
                                                        key={subject.id}
                                                        className="px-2 py-1 bg-purple-500 bg-opacity-20 text-purple-300 text-xs rounded-full"
                                                    >
                                                        {subject.name}
                                                    </span>
                                                ))}
                                                {(student.subjects?.length || 0) > 2 && (
                                                    <span className="px-2 py-1 bg-gray-500 bg-opacity-20 text-gray-300 text-xs rounded-full">
                                                        +{(student.subjects?.length || 0) - 2} more
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-8 h-2 bg-white bg-opacity-10 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                                                        style={{ width: '85%' }}
                                                    ></div>
                                                </div>
                                                <span className="text-white text-sm font-medium">B+</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2 text-gray-300">
                                                <Calendar className="w-4 h-4" />
                                                <span className="text-sm">
                                                    {new Date(student.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => viewStudentDetails(student)}
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

            {/* Student Details Modal */}
            {showDetails && selectedStudent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-900 rounded-xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">Student Details</h3>
                            <button
                                onClick={() => setShowDetails(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Student Info */}
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-xl">
                                        {selectedStudent.name?.charAt(0).toUpperCase() || 'S'}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-white">{selectedStudent.name}</h4>
                                    <p className="text-gray-400">@{selectedStudent.username}</p>
                                    <div className="flex items-center space-x-4 mt-2">
                                        <div className="flex items-center space-x-2 text-gray-300">
                                            <Mail className="w-4 h-4" />
                                            <span>{selectedStudent.email}</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-gray-300">
                                            <MapPin className="w-4 h-4" />
                                            <span>{getClassroomName(selectedStudent.classroom_id)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Academic Overview */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white bg-opacity-10 rounded-lg p-4 text-center">
                                    <p className="text-2xl font-bold text-green-400">B+</p>
                                    <p className="text-gray-300 text-sm">Overall Grade</p>
                                </div>
                                <div className="bg-white bg-opacity-10 rounded-lg p-4 text-center">
                                    <p className="text-2xl font-bold text-blue-400">{selectedStudent.subjects?.length || 0}</p>
                                    <p className="text-gray-300 text-sm">Enrolled Subjects</p>
                                </div>
                                <div className="bg-white bg-opacity-10 rounded-lg p-4 text-center">
                                    <p className="text-2xl font-bold text-purple-400">92%</p>
                                    <p className="text-gray-300 text-sm">Attendance Rate</p>
                                </div>
                            </div>

                            {/* Enrolled Subjects */}
                            <div>
                                <h5 className="text-lg font-semibold text-white mb-3">Enrolled Subjects</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {selectedStudent.subjects?.map((subject) => (
                                        <div key={subject.id} className="bg-white bg-opacity-10 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h6 className="text-white font-medium">{subject.name}</h6>
                                                <span className="text-green-400 font-bold text-sm">A-</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-gray-300 text-sm">
                                                <Clock className="w-4 h-4" />
                                                <span>Since {new Date(subject.created_date).toLocaleDateString()}</span>
                                            </div>
                                            <div className="mt-2">
                                                <div className="w-full bg-white bg-opacity-10 rounded-full h-2">
                                                    <div
                                                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                                                        style={{ width: '88%' }}
                                                    ></div>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1">88% progress</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div>
                                <h5 className="text-lg font-semibold text-white mb-3">Recent Activity</h5>
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-3 p-3 bg-white bg-opacity-5 rounded-lg">
                                        <div className="w-8 h-8 bg-green-500 bg-opacity-30 rounded-full flex items-center justify-center">
                                            <Award className="w-4 h-4 text-green-400" />
                                        </div>
                                        <div>
                                            <p className="text-white text-sm">Completed Mathematics Assignment #5</p>
                                            <p className="text-gray-400 text-xs">2 hours ago</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 p-3 bg-white bg-opacity-5 rounded-lg">
                                        <div className="w-8 h-8 bg-blue-500 bg-opacity-30 rounded-full flex items-center justify-center">
                                            <BarChart3 className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-white text-sm">Achieved 95% on Physics Quiz</p>
                                            <p className="text-gray-400 text-xs">1 day ago</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 p-3 bg-white bg-opacity-5 rounded-lg">
                                        <div className="w-8 h-8 bg-purple-500 bg-opacity-30 rounded-full flex items-center justify-center">
                                            <BookOpen className="w-4 h-4 text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="text-white text-sm">Started new Chemistry chapter</p>
                                            <p className="text-gray-400 text-xs">3 days ago</p>
                                        </div>
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
