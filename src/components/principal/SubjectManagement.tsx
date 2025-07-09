import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    Plus,
    Search,
    Edit3,
    Trash2,
    Users,
    UserPlus,
    UserMinus,
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
                `Failed to load data: ${
                    error instanceof Error ? error.message : String(error)
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
                    <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-400">Loading subjects...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Subject Management</h2>
                    <p className="text-gray-400">Manage school subjects and assign teachers/students</p>
                </div>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Create Subject
                </button>
            </div>

            {/* Messages */}
            {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <p className="text-red-400">{error}</p>
                    <button onClick={() => setError('')} className="ml-auto text-red-400">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {success && (
                <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <p className="text-green-400">{success}</p>
                    <button onClick={() => setSuccess('')} className="ml-auto text-green-400">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Search and Stats */}
            <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search subjects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <button
                    onClick={loadData}
                    className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-400">{subjects.length}</div>
                    <div className="text-sm text-gray-400">Total Subjects</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-400">{teachers.length}</div>
                    <div className="text-sm text-gray-400">Available Teachers</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-400">{students.length}</div>
                    <div className="text-sm text-gray-400">Available Students</div>
                </div>
            </div>

            {/* Subjects List */}
            {filteredSubjects.length === 0 ? (
                <div className="bg-gray-800/50 rounded-xl p-8 text-center">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-400 mb-2">No subjects found</p>
                    <p className="text-sm text-gray-500">Create your first subject to get started</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredSubjects.map((subject) => (
                        <div key={subject.id} className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-1">{subject.name}</h3>
                                    <p className="text-sm text-gray-400">
                                        Created {new Date(subject.created_date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setSelectedSubject(subject);
                                            setAssignType('teacher');
                                            setShowAssignForm(true);
                                        }}
                                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                        title="Assign Teacher"
                                    >
                                        <UserPlus className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedSubject(subject);
                                            setAssignType('student');
                                            setShowAssignForm(true);
                                        }}
                                        className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                                        title="Add Student"
                                    >
                                        <Users className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Teachers */}
                            <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-300 mb-2">Teachers ({subject.teachers?.length || 0})</h4>
                                {subject.teachers && subject.teachers.length > 0 ? (
                                    <div className="space-y-2">
                                        {subject.teachers.map((teacher: any) => (
                                            <div key={teacher.id} className="flex items-center justify-between bg-gray-700/50 rounded-lg p-2">
                                                <span className="text-white text-sm">{teacher.name}</span>
                                                <button
                                                    onClick={() => handleRemoveTeacher(subject.id, teacher.id)}
                                                    className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                                                    title="Remove teacher"
                                                >
                                                    <UserMinus className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-500">No teachers assigned</p>
                                )}
                            </div>

                            {/* Students */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-300 mb-2">Students ({subject.students?.length || 0})</h4>
                                {subject.students && subject.students.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-1">
                                        {subject.students.slice(0, 4).map((student: any) => (
                                            <div key={student.id} className="flex items-center justify-between bg-gray-700/30 rounded p-1">
                                                <span className="text-white text-xs truncate">{student.name}</span>
                                                <button
                                                    onClick={() => handleRemoveStudent(subject.id, student.id)}
                                                    className="text-gray-400 hover:text-red-400 transition-colors"
                                                    title="Remove student"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                        {subject.students.length > 4 && (
                                            <div className="text-xs text-gray-400 col-span-2">
                                                +{subject.students.length - 4} more students
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-500">No students enrolled</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Subject Modal */}
            {showCreateForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white">Create New Subject</h3>
                            <button
                                onClick={() => setShowCreateForm(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubject} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Subject Name
                                </label>
                                <input
                                    type="text"
                                    value={newSubjectName}
                                    onChange={(e) => setNewSubjectName(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., Mathematics, English Literature"
                                    required
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm(false)}
                                    className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {isCreating ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            Creating...
                                        </div>
                                    ) : (
                                        'Create Subject'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Teacher/Student Modal */}
            {showAssignForm && selectedSubject && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white">
                                {assignType === 'teacher' ? 'Assign Teacher' : 'Add Student'} to {selectedSubject.name}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowAssignForm(false);
                                    setSelectedSubject(null);
                                }}
                                className="text-gray-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {assignType === 'teacher' ? (
                                getAvailableTeachers().length > 0 ? (
                                    getAvailableTeachers().map((teacher) => (
                                        <div key={teacher.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                                            <div>
                                                <div className="text-white font-medium">{teacher.name}</div>
                                                <div className="text-sm text-gray-400">{teacher.email}</div>
                                            </div>
                                            <button
                                                onClick={() => handleAssignTeacher(teacher.id)}
                                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                                            >
                                                Assign
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-400 text-center py-4">All teachers are already assigned to this subject</p>
                                )
                            ) : (
                                getAvailableStudents().length > 0 ? (
                                    getAvailableStudents().map((student) => (
                                        <div key={student.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                                            <div>
                                                <div className="text-white font-medium">{student.name}</div>
                                                <div className="text-sm text-gray-400">{student.email}</div>
                                            </div>
                                            <button
                                                onClick={() => handleAddStudent(student.id)}
                                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-400 text-center py-4">All students are already enrolled in this subject</p>
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
