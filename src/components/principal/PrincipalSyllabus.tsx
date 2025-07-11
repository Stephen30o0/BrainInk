import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    Plus,
    Search,
    Filter,
    Edit3,
    Trash2,
    Upload,
    Eye,
    Calendar,
    Users,
    Clock,
    CheckCircle,
    AlertCircle,
    FileText,
    Download,
    RefreshCw,
    Settings,
    PlayCircle,
    PauseCircle,
    Archive
} from 'lucide-react';
import { syllabusService } from '../../services/syllabusService';

interface Syllabus {
    id: number;
    title: string;
    description: string;
    subject_id: number;
    subject_name: string;
    creator_name: string;
    term_length_weeks: number;
    textbook_filename?: string;
    ai_processing_status: 'pending' | 'processing' | 'completed' | 'failed';
    status: 'draft' | 'active' | 'completed' | 'archived';
    created_date: string;
    updated_date: string;
    total_weeks: number;
    completed_weeks?: number;
    student_count?: number;
}

interface Subject {
    id: number;
    name: string;
    code: string;
    description: string;
    teacher_name?: string;
    student_count: number;
}

export const PrincipalSyllabus: React.FC = () => {
    const [syllabuses, setSyllabuses] = useState<Syllabus[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterSubject, setFilterSubject] = useState<string>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedSyllabus, setSelectedSyllabus] = useState<Syllabus | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadingSyllabus, setUploadingSyllabus] = useState<Syllabus | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔍 Loading syllabus data from localhost backend...');
            const token = localStorage.getItem('access_token');
            console.log('🔑 Access token found:', !!token);

            // Load syllabuses
            console.log('📚 Fetching syllabuses from: https://brainink-backend.onrender.com/study-area/syllabuses');
            const syllabusResponse = await fetch('https://brainink-backend.onrender.com/study-area/syllabuses', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📊 Syllabus response status:', syllabusResponse.status);
            console.log('📊 Syllabus response headers:', syllabusResponse.headers.get('content-type'));

            if (!syllabusResponse.ok) {
                const errorText = await syllabusResponse.text();
                console.error('❌ Syllabus response error:', errorText);
                throw new Error(`Failed to load syllabuses: ${syllabusResponse.status} - ${errorText.substring(0, 200)}`);
            }

            const syllabusData = await syllabusResponse.json();
            console.log('✅ Syllabus data received:', syllabusData);
            setSyllabuses(Array.isArray(syllabusData) ? syllabusData : []);

            // Load subjects
            console.log('🎯 Fetching subjects from: https://brainink-backend.onrender.com/study-area/academic/subjects/my-school');
            const subjectsResponse = await fetch('https://brainink-backend.onrender.com/study-area/academic/subjects/my-school', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('🎯 Subjects response status:', subjectsResponse.status);
            if (subjectsResponse.ok) {
                const subjectsData = await subjectsResponse.json();
                console.log('✅ Subjects data received:', subjectsData);
                setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
            } else {
                console.warn('⚠️ Failed to load subjects:', subjectsResponse.status);
                setSubjects([]);
            }

        } catch (error) {
            console.error('❌ Error loading syllabus data:', error);
            setError(error instanceof Error ? error.message : 'Failed to load data');

            // Set empty arrays to prevent crashes
            setSyllabuses([]);
            setSubjects([]);
        } finally {
            setLoading(false);
        }
    };

    const testConnection = async () => {
        try {
            console.log('🔍 Testing backend connection...');
            const response = await fetch('https://brainink-backend.onrender.com/', {
                method: 'GET',
            });
            console.log('🔗 Backend connection test:', response.status);
            alert(`Backend connection test: ${response.status} ${response.ok ? 'OK' : 'Failed'}`);
        } catch (error) {
            console.error('❌ Backend connection failed:', error);
            alert(`Backend connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const filteredSyllabuses = syllabuses.filter(syllabus => {
        const matchesSearch = syllabus.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (syllabus.subject_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (syllabus.creator_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === 'all' || syllabus.status === filterStatus;
        const matchesSubject = filterSubject === 'all' || syllabus.subject_id.toString() === filterSubject;

        return matchesSearch && matchesStatus && matchesSubject;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'text-green-700 bg-green-50 border-green-200';
            case 'draft': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
            case 'completed': return 'text-blue-700 bg-blue-50 border-blue-200';
            case 'archived': return 'text-gray-700 bg-gray-50 border-gray-200';
            default: return 'text-gray-700 bg-gray-50 border-gray-200';
        }
    };

    const getProcessingStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'processing': return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
            case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
            default: return <Clock className="w-4 h-4 text-gray-500" />;
        }
    };

    const openDetailsModal = (syllabus: Syllabus) => {
        setSelectedSyllabus(syllabus);
        setShowDetailsModal(true);
    };

    const updateSyllabusStatus = async (syllabusId: number, newStatus: 'draft' | 'active' | 'archived') => {
        try {
            console.log(`🔄 Updating syllabus ${syllabusId} status to ${newStatus}...`);

            await syllabusService.updateSyllabusStatus(syllabusId, newStatus);

            // Update the local state
            setSyllabuses(prev => prev.map(syllabus =>
                syllabus.id === syllabusId
                    ? { ...syllabus, status: newStatus, updated_date: new Date().toISOString() }
                    : syllabus
            ));

            console.log(`✅ Syllabus ${syllabusId} status updated to ${newStatus}`);

            // Show success message
            alert(`Syllabus status updated to ${newStatus}`);

        } catch (error) {
            console.error('❌ Failed to update syllabus status:', error);
            alert(`Failed to update syllabus status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const openUploadModal = (syllabus: Syllabus) => {
        setUploadingSyllabus(syllabus);
        setShowUploadModal(true);
    };

    const getSyllabusStatusActions = (syllabus: Syllabus) => {
        const actions: JSX.Element[] = [];

        if (syllabus.status === 'draft') {
            actions.push(
                <button
                    key="activate"
                    onClick={() => updateSyllabusStatus(syllabus.id, 'active')}
                    className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                    title="Activate Syllabus"
                >
                    <PlayCircle className="w-4 h-4 mr-1" />
                    Activate
                </button>
            );
        }

        if (syllabus.status === 'active') {
            actions.push(
                <button
                    key="archive"
                    onClick={() => updateSyllabusStatus(syllabus.id, 'archived')}
                    className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    title="Archive Syllabus"
                >
                    <Archive className="w-4 h-4 mr-1" />
                    Archive
                </button>
            );
        }

        if (syllabus.status === 'archived') {
            actions.push(
                <button
                    key="reactivate"
                    onClick={() => updateSyllabusStatus(syllabus.id, 'active')}
                    className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                    title="Reactivate Syllabus"
                >
                    <PlayCircle className="w-4 h-4 mr-1" />
                    Reactivate
                </button>
            );
        }

        return actions;
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="flex items-center space-x-3">
                        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                        <span className="text-lg text-gray-700">Loading syllabuses...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Syllabuses</h2>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={loadData}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Syllabus Management</h1>
                    <p className="text-gray-600 mt-1">Manage and oversee all school syllabuses</p>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={testConnection}
                        className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Test Backend</span>
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Create Syllabus</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    {
                        label: 'Total Syllabuses',
                        value: syllabuses.length,
                        icon: BookOpen,
                        color: 'text-blue-600 bg-blue-50'
                    },
                    {
                        label: 'Active',
                        value: syllabuses.filter(s => s.status === 'active').length,
                        icon: CheckCircle,
                        color: 'text-green-600 bg-green-50'
                    },
                    {
                        label: 'In Development',
                        value: syllabuses.filter(s => s.status === 'draft').length,
                        icon: Edit3,
                        color: 'text-yellow-600 bg-yellow-50'
                    },
                    {
                        label: 'Total Subjects',
                        value: subjects.length,
                        icon: FileText,
                        color: 'text-purple-600 bg-purple-50'
                    }
                ].map((stat, index) => (
                    <div key={index} className="bg-white rounded-xl p-6 shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            </div>
                            <div className={`p-3 rounded-lg ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search syllabuses..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex space-x-4">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="draft">Draft</option>
                            <option value="completed">Completed</option>
                            <option value="archived">Archived</option>
                        </select>

                        <select
                            value={filterSubject}
                            onChange={(e) => setFilterSubject(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Subjects</option>
                            {subjects.map(subject => (
                                <option key={subject.id} value={subject.id.toString()}>
                                    {subject.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Syllabuses List */}
            <div className="bg-white rounded-xl shadow-sm border">
                {filteredSyllabuses.length === 0 ? (
                    <div className="text-center py-12">
                        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No syllabuses found</h3>
                        <p className="text-gray-600 mb-6">
                            {syllabuses.length === 0
                                ? "Start by creating your first syllabus."
                                : "Try adjusting your search or filter criteria."
                            }
                        </p>
                        {syllabuses.length === 0 && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Create First Syllabus
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left py-3 px-6 font-medium text-gray-900">Syllabus</th>
                                    <th className="text-left py-3 px-6 font-medium text-gray-900">Subject</th>
                                    <th className="text-left py-3 px-6 font-medium text-gray-900">Creator</th>
                                    <th className="text-left py-3 px-6 font-medium text-gray-900">Duration</th>
                                    <th className="text-left py-3 px-6 font-medium text-gray-900">Status</th>
                                    <th className="text-left py-3 px-6 font-medium text-gray-900">AI Processing</th>
                                    <th className="text-left py-3 px-6 font-medium text-gray-900">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredSyllabuses.map((syllabus) => (
                                    <tr key={syllabus.id} className="hover:bg-gray-50">
                                        <td className="py-4 px-6">
                                            <div>
                                                <div className="font-medium text-gray-900">{syllabus.title}</div>
                                                <div className="text-sm text-gray-500">{syllabus.description}</div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-gray-900">{syllabus.subject_name}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-gray-900">{syllabus.creator_name}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center space-x-1">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-900">{syllabus.term_length_weeks} weeks</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(syllabus.status)}`}>
                                                {syllabus.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center space-x-2">
                                                {getProcessingStatusIcon(syllabus.ai_processing_status)}
                                                <span className="text-sm text-gray-600 capitalize">
                                                    {syllabus.ai_processing_status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center space-x-2">
                                                {/* Status Action Buttons */}
                                                <div className="flex items-center space-x-1">
                                                    {getSyllabusStatusActions(syllabus)}
                                                </div>

                                                {/* Upload Textbook Button - More Prominent */}
                                                <button
                                                    onClick={() => openUploadModal(syllabus)}
                                                    className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                                                    title="Upload Textbook"
                                                >
                                                    <Upload className="w-4 h-4 mr-1" />
                                                    Upload
                                                </button>

                                                {/* Standard Action Buttons */}
                                                <div className="flex items-center space-x-1 ml-2 pl-2 border-l border-gray-200">
                                                    <button
                                                        onClick={() => openDetailsModal(syllabus)}
                                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Syllabus Modal */}
            {showCreateModal && (
                <CreateSyllabusModal
                    subjects={subjects}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={loadData}
                />
            )}

            {/* Syllabus Details Modal */}
            {showDetailsModal && selectedSyllabus && (
                <SyllabusDetailsModal
                    syllabus={selectedSyllabus}
                    onClose={() => setShowDetailsModal(false)}
                />
            )}

            {/* Upload Textbook Modal */}
            {showUploadModal && uploadingSyllabus && (
                <UploadTextbookModal
                    syllabus={uploadingSyllabus}
                    onClose={() => {
                        setShowUploadModal(false);
                        setUploadingSyllabus(null);
                    }}
                    onSuccess={() => {
                        loadData();
                        setShowUploadModal(false);
                        setUploadingSyllabus(null);
                    }}
                />
            )}
        </div>
    );
};

// Create Syllabus Modal Component
const CreateSyllabusModal: React.FC<{
    subjects: Subject[];
    onClose: () => void;
    onSuccess: () => void;
}> = ({ subjects, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        subject_id: '',
        term_length_weeks: 16
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.subject_id) {
            setError('Title and subject are required');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await fetch('https://brainink-backend.onrender.com/study-area/syllabuses', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    subject_id: parseInt(formData.subject_id)
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to create syllabus');
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error creating syllabus:', error);
            setError(error instanceof Error ? error.message : 'Failed to create syllabus');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Create New Syllabus</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        ×
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter syllabus title"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={3}
                            placeholder="Enter syllabus description"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Subject
                        </label>
                        <select
                            value={formData.subject_id}
                            onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        >
                            <option value="">Select a subject</option>
                            {subjects.map(subject => (
                                <option key={subject.id} value={subject.id.toString()}>
                                    {subject.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Term Length (weeks)
                        </label>
                        <input
                            type="number"
                            value={formData.term_length_weeks}
                            onChange={(e) => setFormData({ ...formData, term_length_weeks: parseInt(e.target.value) })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="1"
                            max="52"
                            required
                        />
                    </div>

                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Syllabus'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Syllabus Details Modal Component
const SyllabusDetailsModal: React.FC<{
    syllabus: Syllabus;
    onClose: () => void;
}> = ({ syllabus, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Syllabus Details</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            ×
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{syllabus.title}</h3>
                            <p className="text-gray-600">{syllabus.description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Subject</label>
                                <p className="text-gray-900">{syllabus.subject_name}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Creator</label>
                                <p className="text-gray-900">{syllabus.creator_name}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Duration</label>
                                <p className="text-gray-900">{syllabus.term_length_weeks} weeks</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Weekly Plans</label>
                                <p className="text-gray-900">{syllabus.total_weeks} created</p>
                            </div>
                        </div>

                        {syllabus.textbook_filename && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Textbook</label>
                                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                                    <FileText className="w-5 h-5 text-gray-500" />
                                    <span className="text-gray-900">{syllabus.textbook_filename}</span>
                                </div>
                            </div>
                        )}

                        <div className="flex space-x-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>
                            <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                                Edit Syllabus
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Upload Textbook Modal Component
const UploadTextbookModal: React.FC<{
    syllabus: Syllabus;
    onClose: () => void;
    onSuccess: () => void;
}> = ({ syllabus, onClose, onSuccess }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                setError('Please select a PDF file');
                return;
            }
            if (file.size > 50 * 1024 * 1024) { // 50MB limit
                setError('File size must be less than 50MB');
                return;
            }
            setSelectedFile(file);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select a file');
            return;
        }

        try {
            setUploading(true);
            setError(null);

            console.log(`📚 Uploading textbook for syllabus: ${syllabus.title}`);

            await syllabusService.uploadTextbook(syllabus.id, selectedFile);

            console.log('✅ Textbook uploaded successfully');
            alert('Textbook uploaded successfully! The syllabus will be automatically activated.');

            onSuccess();
        } catch (error) {
            console.error('❌ Failed to upload textbook:', error);
            setError(error instanceof Error ? error.message : 'Failed to upload textbook');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Upload Textbook</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                        disabled={uploading}
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <h3 className="font-medium text-gray-900 mb-2">{syllabus.title}</h3>
                        <p className="text-sm text-gray-600">{syllabus.subject_name}</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select PDF Textbook
                        </label>
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileSelect}
                            disabled={uploading}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Maximum file size: 50MB
                        </p>
                    </div>

                    {selectedFile && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4 text-blue-600" />
                                <span className="text-sm text-blue-800">{selectedFile.name}</span>
                            </div>
                            <p className="text-xs text-blue-600 mt-1">
                                Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                        </div>
                    )}

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-start space-x-2">
                            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-yellow-800">
                                <p className="font-medium mb-1">Auto-Activation Notice</p>
                                <p>Upon successful upload, this syllabus will be automatically activated and K.A.N.A. AI will process the textbook to generate weekly learning plans.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={uploading}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={!selectedFile || uploading}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                        >
                            {uploading ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Uploading...</span>
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" />
                                    <span>Upload Textbook</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrincipalSyllabus;
