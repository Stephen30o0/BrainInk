import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    Plus,
    Search,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    X
} from 'lucide-react';
import { principalService, Subject, Teacher, Student } from '../../services/principalService';

interface SubjectManagementProps {
    schoolData?: any;
    onRefresh?: () => void;
}

export const SubjectManagement: React.FC<SubjectManagementProps> = () => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showAssignForm, setShowAssignForm] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [assignType, setAssignType] = useState<'teacher' | 'student'>('teacher');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [newSubjectName, setNewSubjectName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            setError('');

            console.log('🔄 Loading subjects, teachers, and students...');

            const [subjectsData, teachersData, studentsData] = await Promise.all([
                principalService.getSchoolSubjects(),
                principalService.getSchoolTeachers(),
                principalService.getSchoolStudents()
            ]);

            console.log('📚 Subjects loaded:', subjectsData);
            console.log('👨‍🏫 Teachers loaded:', teachersData);
            console.log('👨‍🎓 Students loaded:', studentsData);

            setSubjects(subjectsData || []);
            setTeachers(teachersData || []);
            setStudents(studentsData || []);

            console.log('✅ All data loaded successfully');
        } catch (error) {
            console.error('❌ Error loading data:', error);
            setError(
                `Failed to load data: ${error instanceof Error ? error.message : String(error)
                }`
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubjectName.trim()) {
            setError('Subject name is required');
            return;
        }

        setIsCreating(true);
        setError('');

        try {
            await principalService.createSubject(newSubjectName.trim());
            setSuccess('Subject created successfully!');
            setNewSubjectName('');
            setShowCreateForm(false);
            loadData();
        } catch (error) {
            console.error('Error creating subject:', error);
            setError('Failed to create subject');
        } finally {
            setIsCreating(false);
        }
    };

    const handleAssignTeacher = async (teacherId: number) => {
        if (!selectedSubject) return;

        try {
            await principalService.assignTeacherToSubject(selectedSubject.id, teacherId);
            setSuccess('Teacher assigned successfully!');
            loadData();
            setShowAssignForm(false);
            setSelectedSubject(null);
        } catch (error) {
            console.error('Error assigning teacher:', error);
            setError('Failed to assign teacher');
        }
    };

    const handleRemoveTeacher = async (subjectId: number, teacherId: number) => {
        try {
            await principalService.removeTeacherFromSubject(subjectId, teacherId);
            setSuccess('Teacher removed successfully!');
            loadData();
        } catch (error) {
            console.error('Error removing teacher:', error);
            setError('Failed to remove teacher');
        }
    };

    const handleAddStudent = async (studentId: number) => {
        if (!selectedSubject) return;

        try {
            await principalService.addStudentToSubject(selectedSubject.id, studentId);
            setSuccess('Student added successfully!');
            loadData();
            setShowAssignForm(false);
            setSelectedSubject(null);
        } catch (error) {
            console.error('Error adding student:', error);
            setError('Failed to add student');
        }
    };

    const handleRemoveStudent = async (subjectId: number, studentId: number) => {
        try {
            await principalService.removeStudentFromSubject(subjectId, studentId);
            setSuccess('Student removed successfully!');
            loadData();
        } catch (error) {
            console.error('Error removing student:', error);
            setError('Failed to remove student');
        }
    };

    const filteredSubjects = subjects.filter(subject =>
        subject.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get available teachers/students not assigned to selected subject
    const getAvailableTeachers = () => {
        if (!selectedSubject) return teachers;
        const assignedTeacherIds = selectedSubject.teachers?.map(t => t.id) || [];
        return teachers.filter(teacher => !assignedTeacherIds.includes(teacher.id));
    };

    const getAvailableStudents = () => {
        if (!selectedSubject) return students;
        const assignedStudentIds = selectedSubject.students?.map(s => s.id) || [];
        return students.filter(student => !assignedStudentIds.includes(student.id));
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Loading subjects...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Subject Management</h2>
                        <p className="text-gray-600 mt-1">Manage school subjects and assign teachers/students</p>
                    </div>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Create Subject
                    </button>
                </div>
            </div>

            {/* Messages */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-red-700">{error}</p>
                    <button onClick={() => setError('')} className="ml-auto text-red-600 hover:text-red-800">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-green-700">{success}</p>
                    <button onClick={() => setSuccess('')} className="ml-auto text-green-600 hover:text-green-800">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Search and Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search subjects..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <button
                        onClick={loadData}
                        className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-blue-600">{subjects.length}</div>
                        <div className="text-sm text-gray-600">Total Subjects</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-green-600">{teachers.length}</div>
                        <div className="text-sm text-gray-600">Available Teachers</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-purple-600">{students.length}</div>
                        <div className="text-sm text-gray-600">Total Students</div>
                    </div>
                </div>
            </div>

            {/* Subjects List */}
            {filteredSubjects.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200 text-center">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-2">No subjects found</p>
                    <p className="text-sm text-gray-500">Create your first subject to get started</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredSubjects.map((subject) => (
                        <div key={subject.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <BookOpen className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{subject.name}</h3>
                                        <p className="text-sm text-gray-500">Subject ID: {subject.id}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Teachers Section */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-medium text-gray-700">Assigned Teachers</h4>
                                    <button
                                        onClick={() => {
                                            setSelectedSubject(subject);
                                            setAssignType('teacher');
                                            setShowAssignForm(true);
                                        }}
                                        className="text-blue-600 hover:text-blue-800 text-xs"
                                    >
                                        + Add Teacher
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    {subject.teachers && subject.teachers.length > 0 ? (
                                        subject.teachers.map((teacher: any) => (
                                            <div key={teacher.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                                <span className="text-gray-900">{teacher.name}</span>
                                                <button
                                                    onClick={() => handleRemoveTeacher(subject.id, teacher.id)}
                                                    className="text-red-600 hover:text-red-800 text-xs"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-sm">No teachers assigned</p>
                                    )}
                                </div>
                            </div>

                            {/* Students Section */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-medium text-gray-700">Enrolled Students</h4>
                                    <button
                                        onClick={() => {
                                            setSelectedSubject(subject);
                                            setAssignType('student');
                                            setShowAssignForm(true);
                                        }}
                                        className="text-blue-600 hover:text-blue-800 text-xs"
                                    >
                                        + Add Student
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    {subject.students && subject.students.length > 0 ? (
                                        subject.students.slice(0, 3).map((student: any) => (
                                            <div key={student.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                                <span className="text-gray-900">{student.name}</span>
                                                <button
                                                    onClick={() => handleRemoveStudent(subject.id, student.id)}
                                                    className="text-red-600 hover:text-red-800 text-xs"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-sm">No students enrolled</p>
                                    )}
                                    {subject.students && subject.students.length > 3 && (
                                        <p className="text-gray-500 text-xs">
                                            +{subject.students.length - 3} more students
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Subject Modal */}
            {showCreateForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Create New Subject</h3>
                            <button
                                onClick={() => setShowCreateForm(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateSubject}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Subject Name
                                </label>
                                <input
                                    type="text"
                                    value={newSubjectName}
                                    onChange={(e) => setNewSubjectName(e.target.value)}
                                    placeholder="Enter subject name..."
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {isCreating ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Teacher/Student Modal */}
            {showAssignForm && selectedSubject && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Assign {assignType === 'teacher' ? 'Teacher' : 'Student'} to {selectedSubject.name}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowAssignForm(false);
                                    setSelectedSubject(null);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-2">
                            {assignType === 'teacher'
                                ? getAvailableTeachers().map((teacher) => (
                                    <div key={teacher.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-900">{teacher.name}</p>
                                            <p className="text-sm text-gray-500">{teacher.email}</p>
                                        </div>
                                        <button
                                            onClick={() => handleAssignTeacher(teacher.id)}
                                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                                        >
                                            Assign
                                        </button>
                                    </div>
                                ))
                                : getAvailableStudents().map((student) => (
                                    <div key={student.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-900">{student.name}</p>
                                            <p className="text-sm text-gray-500">{student.email}</p>
                                        </div>
                                        <button
                                            onClick={() => handleAddStudent(student.id)}
                                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                                        >
                                            Assign
                                        </button>
                                    </div>
                                ))
                            }
                            {(assignType === 'teacher' ? getAvailableTeachers() : getAvailableStudents()).length === 0 && (
                                <p className="text-gray-500 text-center py-4">
                                    No available {assignType === 'teacher' ? 'teachers' : 'students'} to assign
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
