import React, { useState, useEffect } from 'react';
import {
    Building,
    Plus,
    Users,
    MapPin,
    Edit2,
    Trash2,
    Save,
    X,
    Search,
    School,
    Clock,
    Check,
    AlertCircle,
    RefreshCw
} from 'lucide-react';
import { principalService } from '../../services/principalService';

interface Classroom {
    id: string;
    name: string;
    capacity: number;
    current_students: number;
    assigned_teacher: {
        id: string;
        name: string;
        email: string;
    } | null;
    subjects: string[];
    location: string;
    schedule: {
        day: string;
        start_time: string;
        end_time: string;
    }[];
    created_at: string;
    status: 'active' | 'inactive' | 'maintenance';
    description?: string;
    teacher_id?: number;
    school_id?: number;
}

interface ClassroomFormData {
    name: string;
    capacity: number;
    location: string;
    assigned_teacher_id: string;
    subjects: string[];
    schedule: {
        day: string;
        start_time: string;
        end_time: string;
    }[];
    description?: string;
}

interface ClassroomManagementProps {
    schoolData?: any;
    onRefresh?: () => void;
}

export const ClassroomManagement: React.FC<ClassroomManagementProps> = ({
    onRefresh
}) => {
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'maintenance'>('all');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
    const [showStudentManager, setShowStudentManager] = useState<string | null>(null);
    const [availableStudents, setAvailableStudents] = useState<any[]>([]);
    const [classroomStudents, setClassroomStudents] = useState<any[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
    const [formData, setFormData] = useState<ClassroomFormData>({
        name: '',
        capacity: 30,
        location: '',
        assigned_teacher_id: '',
        subjects: [],
        schedule: [],
        description: ''
    });

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    useEffect(() => {
        loadClassrooms();
        loadTeachers();
        loadSubjects();
    }, []);

    const loadClassrooms = async () => {
        try {
            setLoading(true);
            const response = await principalService.getClassrooms();
            setClassrooms(response.classrooms || []);
        } catch (error) {
            console.error('Failed to load classrooms:', error);
            setError('Failed to load classrooms');
            // Fallback to mock data
            setClassrooms([
                {
                    id: '1',
                    name: 'Math Lab A',
                    capacity: 35,
                    current_students: 28,
                    assigned_teacher: {
                        id: '1',
                        name: 'Dr. Sarah Johnson',
                        email: 'sarah.johnson@school.edu'
                    },
                    subjects: ['Mathematics', 'Statistics'],
                    location: 'Building A, Room 101',
                    schedule: [
                        { day: 'Monday', start_time: '09:00', end_time: '10:30' },
                        { day: 'Wednesday', start_time: '09:00', end_time: '10:30' },
                        { day: 'Friday', start_time: '09:00', end_time: '10:30' }
                    ],
                    created_at: '2024-01-15T09:00:00Z',
                    status: 'active'
                },
                {
                    id: '2',
                    name: 'Science Lab B',
                    capacity: 30,
                    current_students: 25,
                    assigned_teacher: {
                        id: '2',
                        name: 'Prof. Michael Chen',
                        email: 'michael.chen@school.edu'
                    },
                    subjects: ['Chemistry', 'Physics'],
                    location: 'Building B, Room 205',
                    schedule: [
                        { day: 'Tuesday', start_time: '10:00', end_time: '11:30' },
                        { day: 'Thursday', start_time: '10:00', end_time: '11:30' }
                    ],
                    created_at: '2024-01-10T10:00:00Z',
                    status: 'active'
                },
                {
                    id: '3',
                    name: 'Computer Lab',
                    capacity: 25,
                    current_students: 0,
                    assigned_teacher: null,
                    subjects: ['Computer Science'],
                    location: 'Building C, Room 301',
                    schedule: [],
                    created_at: '2024-01-20T11:00:00Z',
                    status: 'maintenance'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const loadTeachers = async () => {
        try {
            const response = await principalService.getSchoolTeachers();
            setTeachers(response || []);
        } catch (error) {
            console.error('Failed to load teachers:', error);
            // Fallback to mock data
            setTeachers([
                { id: '1', name: 'Dr. Sarah Johnson', email: 'sarah.johnson@school.edu' },
                { id: '2', name: 'Prof. Michael Chen', email: 'michael.chen@school.edu' },
                { id: '3', name: 'Ms. Emily Davis', email: 'emily.davis@school.edu' }
            ]);
        }
    };

    const loadSubjects = async () => {
        try {
            const response = await principalService.getSchoolSubjects();
            setSubjects(response || []);
        } catch (error) {
            console.error('Failed to load subjects:', error);
            // Fallback to mock data
            setSubjects([
                { id: '1', name: 'Mathematics' },
                { id: '2', name: 'Science' },
                { id: '3', name: 'English' },
                { id: '4', name: 'History' },
                { id: '5', name: 'Chemistry' },
                { id: '6', name: 'Physics' },
                { id: '7', name: 'Computer Science' }
            ]);
        }
    };

    const loadClassroomStudents = async (classroomId: string) => {
        try {
            const response = await principalService.getClassroomStudents(classroomId);
            setClassroomStudents(response.students || []);
        } catch (error) {
            console.error('Failed to load classroom students:', error);
            setClassroomStudents([]);
        }
    };

    const handleCreateClassroom = async () => {
        try {
            const response = await principalService.createClassroom(formData);
            if (response.success) {
                await loadClassrooms();
                setShowCreateForm(false);
                resetForm();
                onRefresh?.();
            }
        } catch (error) {
            console.error('Failed to create classroom:', error);
            setError('Failed to create classroom');
        }
    };

    const handleUpdateClassroom = async () => {
        if (!editingClassroom) return;

        try {
            const response = await principalService.updateClassroom(editingClassroom.id, formData);
            if (response.success) {
                await loadClassrooms();
                setEditingClassroom(null);
                resetForm();
                onRefresh?.();
            }
        } catch (error) {
            console.error('Failed to update classroom:', error);
            setError('Failed to update classroom');
        }
    };

    const handleDeleteClassroom = async (classroomId: string) => {
        if (!confirm('Are you sure you want to delete this classroom?')) return;

        try {
            const response = await principalService.deleteClassroom(classroomId);
            if (response.success) {
                await loadClassrooms();
                onRefresh?.();
            }
        } catch (error) {
            console.error('Failed to delete classroom:', error);
            setError('Failed to delete classroom');
        }
    };

    const handleAssignTeacher = async (classroomId: string, teacherId: string) => {
        try {
            const response = await principalService.assignTeacherToClassroom(classroomId, teacherId);
            if (response.success) {
                await loadClassrooms();
                setError(null);
            }
        } catch (error) {
            console.error('Failed to assign teacher:', error);
            setError('Failed to assign teacher to classroom');
        }
    };

    const handleAddStudentsToClassroom = async (classroomId: string, studentIds: number[]) => {
        try {
            const response = await principalService.addStudentsToClassroom(classroomId, studentIds);
            if (response.success) {
                await loadClassrooms();
                await loadClassroomStudents(classroomId);
                setSelectedStudents([]);
                setError(null);
                return response;
            }
        } catch (error) {
            console.error('Failed to add students to classroom:', error);
            setError('Failed to add students to classroom');
            throw error;
        }
    };

    const handleRemoveStudentsFromClassroom = async (classroomId: string, studentIds: number[]) => {
        try {
            const response = await principalService.removeStudentsFromClassroom(classroomId, studentIds);
            if (response.success) {
                await loadClassrooms();
                await loadClassroomStudents(classroomId);
                setSelectedStudents([]);
                setError(null);
                return response;
            }
        } catch (error) {
            console.error('Failed to remove students from classroom:', error);
            setError('Failed to remove students from classroom');
            throw error;
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            capacity: 30,
            location: '',
            assigned_teacher_id: '',
            subjects: [],
            schedule: [],
            description: ''
        });
    };

    const startEdit = (classroom: Classroom) => {
        setEditingClassroom(classroom);
        setFormData({
            name: classroom.name,
            capacity: classroom.capacity,
            location: classroom.location,
            assigned_teacher_id: classroom.assigned_teacher?.id || '',
            subjects: classroom.subjects,
            schedule: classroom.schedule,
            description: classroom.description || ''
        });
    };

    const addScheduleSlot = () => {
        setFormData(prev => ({
            ...prev,
            schedule: [...prev.schedule, { day: 'Monday', start_time: '09:00', end_time: '10:30' }]
        }));
    };

    const updateScheduleSlot = (index: number, field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            schedule: prev.schedule.map((slot, i) =>
                i === index ? { ...slot, [field]: value } : slot
            )
        }));
    };

    const removeScheduleSlot = (index: number) => {
        setFormData(prev => ({
            ...prev,
            schedule: prev.schedule.filter((_, i) => i !== index)
        }));
    };

    const filteredClassrooms = classrooms.filter(classroom => {
        const matchesSearch = classroom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            classroom.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || classroom.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500';
            case 'inactive': return 'bg-yellow-500';
            case 'maintenance': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const getCapacityColor = (current: number, capacity: number) => {
        const percentage = (current / capacity) * 100;
        if (percentage >= 90) return 'text-red-400';
        if (percentage >= 75) return 'text-yellow-400';
        return 'text-green-400';
    };

    const openStudentManager = async (classroomId: string) => {
        setShowStudentManager(classroomId);
        await loadClassroomStudents(classroomId);
        // Load available students (not in this classroom)
        try {
            const allStudents = await principalService.getSchoolStudents();
            const classroomStudentsData = await principalService.getClassroomStudents(classroomId);
            const assignedStudentIds = classroomStudentsData.students.map((s: any) => s.id);
            const available = allStudents.filter((s: any) => !assignedStudentIds.includes(s.id));
            setAvailableStudents(available);
        } catch (error) {
            console.error('Failed to load student data:', error);
            setAvailableStudents([]);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                    <span className="ml-3 text-gray-600">Loading classrooms...</span>
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
                        <h2 className="text-2xl font-bold text-gray-900">Classroom Management</h2>
                        <p className="text-gray-600 mt-1">Manage classroom spaces, assignments, and schedules</p>
                    </div>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create Classroom</span>
                    </button>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                    <p className="text-red-700">{error}</p>
                    <button
                        onClick={() => setError(null)}
                        className="ml-auto text-red-600 hover:text-red-800"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Search and Filter */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search classrooms by name or location..."
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="maintenance">Maintenance</option>
                    </select>
                </div>
            </div>

            {/* Classroom Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Classrooms</p>
                            <p className="text-2xl font-bold text-gray-900">{classrooms.length}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Active</p>
                            <p className="text-2xl font-bold text-gray-900">{classrooms.filter(c => c.status === 'active').length}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <Check className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Capacity</p>
                            <p className="text-2xl font-bold text-gray-900">{classrooms.reduce((sum, c) => sum + c.capacity, 0)}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Current Students</p>
                            <p className="text-2xl font-bold text-gray-900">{classrooms.reduce((sum, c) => sum + c.current_students, 0)}</p>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <School className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Classrooms List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredClassrooms.map((classroom) => (
                    <div key={classroom.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{classroom.name}</h3>
                                <div className="flex items-center text-gray-600 text-sm mb-2">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    {classroom.location}
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className={`w-3 h-3 rounded-full ${getStatusColor(classroom.status)}`}></div>
                                    <span className="text-sm text-gray-700 capitalize">{classroom.status}</span>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => openStudentManager(classroom.id)}
                                    className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                                    title="Manage Students"
                                >
                                    <Users className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => startEdit(classroom)}
                                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                    title="Edit Classroom"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDeleteClassroom(classroom.id)}
                                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                    title="Delete Classroom"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Capacity:</span>
                                <span className={`font-semibold ${getCapacityColor(classroom.current_students, classroom.capacity)}`}>
                                    {classroom.current_students}/{classroom.capacity}
                                </span>
                            </div>

                            {classroom.assigned_teacher && (
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Teacher:</span>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-gray-900">{classroom.assigned_teacher.name}</span>
                                        <select
                                            value={classroom.assigned_teacher.id}
                                            onChange={(e) => {
                                                if (e.target.value && e.target.value !== classroom.assigned_teacher?.id) {
                                                    handleAssignTeacher(classroom.id, e.target.value);
                                                }
                                            }}
                                            className="px-2 py-1 border border-gray-300 rounded text-gray-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            title="Change teacher"
                                        >
                                            <option value={classroom.assigned_teacher.id}>
                                                {classroom.assigned_teacher.name}
                                            </option>
                                            {(teachers || [])
                                                .filter(t => t.id !== classroom.assigned_teacher?.id)
                                                .map(teacher => (
                                                    <option key={teacher.id} value={teacher.id}>
                                                        {teacher.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {!classroom.assigned_teacher && (
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Teacher:</span>
                                    <select
                                        value=""
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                handleAssignTeacher(classroom.id, e.target.value);
                                            }
                                        }}
                                        className="px-2 py-1 border border-gray-300 rounded text-gray-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="">Assign teacher...</option>
                                        {(teachers || []).map(teacher => (
                                            <option key={teacher.id} value={teacher.id}>
                                                {teacher.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Subjects:</span>
                                <div className="flex flex-wrap gap-1">
                                    {(classroom.subjects || []).map((subject, index) => (
                                        <span
                                            key={index}
                                            className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                                        >
                                            {subject}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {classroom.schedule && classroom.schedule.length > 0 && (
                                <div>
                                    <span className="text-gray-600 text-sm">Schedule:</span>
                                    <div className="mt-1 space-y-1">
                                        {classroom.schedule.map((slot, index) => (
                                            <div key={index} className="flex items-center text-sm text-gray-600">
                                                <Clock className="w-3 h-3 mr-1" />
                                                {slot.day}: {slot.start_time} - {slot.end_time}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Create/Edit Classroom Modal */}
            {(showCreateForm || editingClassroom) && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-gray-900">
                                {editingClassroom ? 'Edit Classroom' : 'Create New Classroom'}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowCreateForm(false);
                                    setEditingClassroom(null);
                                    resetForm();
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={editingClassroom ? handleUpdateClassroom : handleCreateClassroom} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Classroom Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                                    <input
                                        type="number"
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        min="1"
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateForm(false);
                                        setEditingClassroom(null);
                                        resetForm();
                                    }}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                >
                                    {editingClassroom ? 'Update' : 'Create'} Classroom
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Student Manager Modal */}
            {showStudentManager && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-gray-900">Manage Classroom Students</h3>
                            <button
                                onClick={() => setShowStudentManager(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-lg font-medium text-gray-900 mb-4">Current Students</h4>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {classroomStudents.map((student: any) => (
                                        <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <span className="text-gray-900">{student.name}</span>
                                            <button
                                                onClick={() => handleRemoveStudentsFromClassroom(showStudentManager!, [student.id])}
                                                className="text-red-600 hover:text-red-800 text-sm"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                    {classroomStudents.length === 0 && (
                                        <p className="text-gray-500 text-center py-4">No students assigned</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-lg font-medium text-gray-900 mb-4">Available Students</h4>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {availableStudents.map((student: any) => (
                                        <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <span className="text-gray-900">{student.name}</span>
                                            <button
                                                onClick={() => handleAddStudentsToClassroom(showStudentManager!, [student.id])}
                                                className="text-blue-600 hover:text-blue-800 text-sm"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    ))}
                                    {availableStudents.length === 0 && (
                                        <p className="text-gray-500 text-center py-4">No available students</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
