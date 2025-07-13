import React, { useState, useEffect } from 'react';
import {
    Users,
    Search,
    RefreshCw,
    UserCheck,
    Filter,
    Download,
    Plus,
    ChevronDown,
    Clock,
    X
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
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                <span className="ml-3 text-gray-600">Loading students...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
                        <p className="text-gray-600 mt-1">Manage student enrollment and academic progress</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={loadStudents}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-all"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span>Refresh</span>
                        </button>
                        <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-all">
                            <Download className="w-4 h-4" />
                            <span>Export</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700">{error}</p>
                    <button
                        onClick={loadStudents}
                        className="mt-2 text-red-600 hover:text-red-800 underline"
                    >
                        Retry loading students
                    </button>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Students</p>
                            <p className="text-2xl font-bold text-gray-900">{students.length}</p>
                            <p className="text-sm text-blue-600 flex items-center mt-1">
                                <Users className="w-3 h-3 mr-1" />
                                Active enrollment
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">In Classrooms</p>
                            <p className="text-2xl font-bold text-gray-900">{students.filter(s => s.classroom_id).length}</p>
                            <p className="text-sm text-green-600 flex items-center mt-1">
                                <UserCheck className="w-3 h-3 mr-1" />
                                Assigned
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <UserCheck className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Unassigned</p>
                            <p className="text-2xl font-bold text-gray-900">{students.filter(s => !s.classroom_id).length}</p>
                            <p className="text-sm text-orange-600 flex items-center mt-1">
                                <Clock className="w-3 h-3 mr-1" />
                                Needs assignment
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">New This Month</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {students.filter(s => {
                                    const createdDate = new Date(s.created_at);
                                    const now = new Date();
                                    return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
                                }).length}
                            </p>
                            <p className="text-sm text-purple-600 flex items-center mt-1">
                                <Plus className="w-3 h-3 mr-1" />
                                Recent joins
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Plus className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search students by name, username, or email..."
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <select
                            value={filterClassroom}
                            onChange={(e) => setFilterClassroom(e.target.value)}
                            className="px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Classrooms</option>
                            <option value="no-classroom">Unassigned</option>
                            {uniqueClassrooms.map(classroomId => (
                                <option key={classroomId} value={classroomId?.toString()}>
                                    {getClassroomName(classroomId)}
                                </option>
                            ))}
                        </select>
                        <button className="flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all">
                            <Filter className="w-4 h-4" />
                            <span>Filter</span>
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Students List */}
            {sortedStudents.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-200 text-center">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                        {students.length === 0 ? 'No Students Yet' : 'No matching students'}
                    </h4>
                    <p className="text-gray-600 mb-6">
                        {students.length === 0
                            ? 'Generate student access codes to invite students to your school.'
                            : 'Try adjusting your search criteria or filters.'
                        }
                    </p>
                    {students.length === 0 && (
                        <button
                            onClick={onRefresh}
                            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-all mx-auto"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Invite Students</span>
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Name</span>
                                            {sortBy === 'name' && (
                                                <ChevronDown className={`w-3 h-3 transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('email')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Email</span>
                                            {sortBy === 'email' && (
                                                <ChevronDown className={`w-3 h-3 transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                                            )}
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Classroom
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('created_at')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Joined</span>
                                            {sortBy === 'created_at' && (
                                                <ChevronDown className={`w-3 h-3 transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                                            )}
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sortedStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <Users className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                                    <div className="text-sm text-gray-500">@{student.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{student.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${student.classroom_id
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-orange-100 text-orange-800'
                                                }`}>
                                                {getClassroomName(student.classroom_id)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(student.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => viewStudentDetails(student)}
                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                            >
                                                View
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
                    <div className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-gray-900">Student Details</h3>
                            <button
                                onClick={() => setShowDetails(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <p className="text-gray-900">{selectedStudent.name}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                    <p className="text-gray-900">@{selectedStudent.username}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <p className="text-gray-900">{selectedStudent.email}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Classroom</label>
                                    <p className="text-gray-900">{getClassroomName(selectedStudent.classroom_id)}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Joined Date</label>
                                    <p className="text-gray-900">{new Date(selectedStudent.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
