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
    Brain,
    ArrowRight,
    ChevronDown,
    ChevronRight,
    Link
} from 'lucide-react';

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

export const TeacherSyllabus: React.FC = () => {
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
    const [view, setView] = useState<'subjects' | 'syllabuses'>('subjects');
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [subjectSyllabuses, setSubjectSyllabuses] = useState<Syllabus[]>([]);
    const [selectedSyllabusWithWeeks, setSelectedSyllabusWithWeeks] = useState<any>(null);
    const [showWeeklyView, setShowWeeklyView] = useState(false);
    const [createForm, setCreateForm] = useState({
        title: '',
        description: '',
        subject_id: '',
        term_length_weeks: 12,
        textbook_file: null as File | null
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('access_token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Load teacher's subjects from backend
            const subjectsResponse = await fetch('https://brainink-backend.onrender.com/study-area/academic/teachers/my-subjects', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (subjectsResponse.ok) {
                const subjectsData = await subjectsResponse.json();
                setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
            }

            // Load all syllabuses for overview stats
            const syllabusResponse = await fetch('https://brainink-backend.onrender.com/study-area/syllabuses', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!syllabusResponse.ok) {
                throw new Error(`Failed to load syllabuses: ${syllabusResponse.status}`);
            }

            const syllabusData = await syllabusResponse.json();
            setSyllabuses(Array.isArray(syllabusData) ? syllabusData : []);

        } catch (error) {
            console.error('Error loading syllabus data:', error);
            setError(error instanceof Error ? error.message : 'Failed to load data');

            // Set empty arrays to prevent crashes
            setSyllabuses([]);
            setSubjects([]);
        } finally {
            setLoading(false);
        }
    };

    const loadSubjectSyllabuses = async (subject: Subject) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('access_token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`https://brainink-backend.onrender.com/study-area/syllabuses?subject_id=${subject.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to load syllabuses for ${subject.name}`);
            }

            const data = await response.json();
            setSubjectSyllabuses(Array.isArray(data) ? data : []);
            setSelectedSubject(subject);
            setView('syllabuses');
        } catch (error) {
            console.error('Error loading subject syllabuses:', error);
            setError(error instanceof Error ? error.message : 'Failed to load subject syllabuses');
        } finally {
            setLoading(false);
        }
    };

    const loadSyllabusWithWeeks = async (syllabus: Syllabus) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('access_token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`https://brainink-backend.onrender.com/study-area/syllabuses/${syllabus.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to load syllabus details`);
            }

            const data = await response.json();
            setSelectedSyllabusWithWeeks(data);
            setShowWeeklyView(true);
        } catch (error) {
            console.error('Error loading syllabus details:', error);
            setError(error instanceof Error ? error.message : 'Failed to load syllabus details');
        } finally {
            setLoading(false);
        }
    };

    const goBackToSubjects = () => {
        setView('subjects');
        setSelectedSubject(null);
        setSubjectSyllabuses([]);
    };

    const goBackToSyllabuses = () => {
        setShowWeeklyView(false);
        setSelectedSyllabusWithWeeks(null);
    };

    const handleCreateSyllabus = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            if (!createForm.title || !createForm.subject_id) {
                alert('Please fill in title and select a subject');
                return;
            }

            const formData = new FormData();
            formData.append('title', createForm.title);
            formData.append('description', createForm.description);
            formData.append('subject_id', createForm.subject_id);
            formData.append('term_length_weeks', createForm.term_length_weeks.toString());

            if (createForm.textbook_file) {
                formData.append('textbook_file', createForm.textbook_file);
            }

            const response = await fetch('https://brainink-backend.onrender.com/study-area/syllabuses', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Failed to create syllabus: ${response.status}`);
            }

            const newSyllabus = await response.json();
            setSyllabuses(prev => [newSyllabus, ...prev]);
            setShowCreateModal(false);
            setCreateForm({
                title: '',
                description: '',
                subject_id: '',
                term_length_weeks: 12,
                textbook_file: null
            });

            alert('Syllabus created successfully!');
        } catch (error) {
            console.error('Error creating syllabus:', error);
            alert(error instanceof Error ? error.message : 'Failed to create syllabus');
        }
    };

    const handleDeleteSyllabus = async (syllabusId: number) => {
        if (!confirm('Are you sure you want to delete this syllabus?')) {
            return;
        }

        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`https://brainink-backend.onrender.com/study-area/syllabuses/${syllabusId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to delete syllabus: ${response.status}`);
            }

            setSyllabuses(prev => prev.filter(s => s.id !== syllabusId));
            alert('Syllabus deleted successfully!');
        } catch (error) {
            console.error('Error deleting syllabus:', error);
            alert(error instanceof Error ? error.message : 'Failed to delete syllabus');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'draft': return 'bg-yellow-100 text-yellow-800';
            case 'completed': return 'bg-blue-100 text-blue-800';
            case 'archived': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getProcessingStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'processing': return 'bg-blue-100 text-blue-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'failed': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Filter syllabuses
    const filteredSyllabuses = syllabuses.filter(syllabus => {
        const matchesSearch = syllabus.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            syllabus.subject_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || syllabus.status === filterStatus;
        const matchesSubject = filterSubject === 'all' || syllabus.subject_id.toString() === filterSubject;

        return matchesSearch && matchesStatus && matchesSubject;
    });

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mr-3" />
                    <span className="text-gray-600">Loading syllabus data...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <div className="flex items-center">
                        <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
                        <div>
                            <h3 className="text-lg font-medium text-red-900">Error Loading Data</h3>
                            <p className="text-red-700 mt-1">{error}</p>
                            <button
                                onClick={loadData}
                                className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center space-x-4">
                    {/* Back Navigation */}
                    {view === 'syllabuses' && (
                        <button
                            onClick={goBackToSubjects}
                            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <Eye className="w-5 h-5 mr-2 rotate-180" />
                            Back to Subjects
                        </button>
                    )}
                    {showWeeklyView && (
                        <button
                            onClick={goBackToSyllabuses}
                            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <Eye className="w-5 h-5 mr-2 rotate-180" />
                            Back to Syllabuses
                        </button>
                    )}

                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {showWeeklyView
                                ? `${selectedSyllabusWithWeeks?.title} - Weekly Plans`
                                : view === 'syllabuses'
                                    ? `${selectedSubject?.name} - Syllabuses`
                                    : 'My Subjects'
                            }
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {showWeeklyView
                                ? 'View and manage weekly lesson plans'
                                : view === 'syllabuses'
                                    ? `Manage syllabuses for ${selectedSubject?.name}`
                                    : 'Select a subject to view and manage syllabuses'
                            }
                        </p>
                    </div>
                </div>
                <div className="mt-4 lg:mt-0 flex space-x-3">
                    <button
                        onClick={loadData}
                        className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </button>
                    {view === 'syllabuses' && (
                        <button
                            onClick={() => {
                                setCreateForm({ ...createForm, subject_id: selectedSubject?.id.toString() || '' });
                                setShowCreateModal(true);
                            }}
                            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Syllabus
                        </button>
                    )}
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    {
                        label: view === 'subjects' ? 'My Subjects' : 'Subject Syllabuses',
                        value: view === 'subjects' ? subjects.length : subjectSyllabuses.length,
                        icon: BookOpen,
                        color: 'text-blue-600 bg-blue-50'
                    },
                    {
                        label: 'Active Syllabuses',
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
                        label: 'Total Syllabuses',
                        value: syllabuses.length,
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

            {/* Render different views based on current state */}
            {showWeeklyView ? (
                <WeeklyPlansView
                    syllabus={selectedSyllabusWithWeeks}
                    onBack={goBackToSyllabuses}
                />
            ) : view === 'subjects' ? (
                <SubjectsView
                    subjects={subjects}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    onSubjectSelect={loadSubjectSyllabuses}
                />
            ) : (
                <SyllabusesView
                    syllabuses={subjectSyllabuses}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    filterStatus={filterStatus}
                    setFilterStatus={setFilterStatus}
                    getStatusColor={getStatusColor}
                    getProcessingStatusColor={getProcessingStatusColor}
                    onSyllabusSelect={loadSyllabusWithWeeks}
                    onSyllabusDetails={(syllabus) => {
                        setSelectedSyllabus(syllabus);
                        setShowDetailsModal(true);
                    }}
                    onSyllabusDelete={handleDeleteSyllabus}
                    onCreateNew={() => setShowCreateModal(true)}
                />
            )}

            {/* Create Syllabus Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Create New Syllabus</h2>
                            <p className="text-gray-600 mt-1">Set up a comprehensive curriculum for your subject</p>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Syllabus Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={createForm.title}
                                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                                    placeholder="e.g., Advanced Mathematics - Spring 2024"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={createForm.description}
                                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                                    placeholder="Brief description of the syllabus content and objectives..."
                                    rows={3}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Subject <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={createForm.subject_id}
                                    onChange={(e) => setCreateForm({ ...createForm, subject_id: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Select a subject</option>
                                    {subjects.map(subject => (
                                        <option key={subject.id} value={subject.id.toString()}>
                                            {subject.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Term Length */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Term Length (weeks)
                                </label>
                                <input
                                    type="number"
                                    value={createForm.term_length_weeks}
                                    onChange={(e) => setCreateForm({ ...createForm, term_length_weeks: parseInt(e.target.value) || 12 })}
                                    min="1"
                                    max="52"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Textbook Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Textbook PDF (Optional)
                                </label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => setCreateForm({ ...createForm, textbook_file: e.target.files?.[0] || null })}
                                        className="hidden"
                                        id="textbook-upload"
                                    />
                                    <label htmlFor="textbook-upload" className="cursor-pointer">
                                        <span className="text-blue-600 hover:text-blue-700 font-medium">
                                            Upload PDF textbook
                                        </span>
                                        <p className="text-gray-500 text-sm mt-1">
                                            K.A.N.A. will process this to create weekly lesson plans
                                        </p>
                                    </label>
                                    {createForm.textbook_file && (
                                        <p className="mt-2 text-green-600 text-sm">
                                            Selected: {createForm.textbook_file.name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateSyllabus}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                Create Syllabus
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Syllabus Details Modal */}
            {showDetailsModal && selectedSyllabus && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">{selectedSyllabus.title}</h2>
                                    <p className="text-gray-600 mt-1">{selectedSyllabus.subject_name}</p>
                                </div>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-medium text-gray-900 mb-3">Syllabus Information</h3>
                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <span className="text-gray-600">Status:</span>
                                            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(selectedSyllabus.status)}`}>
                                                {selectedSyllabus.status?.charAt(0).toUpperCase() + selectedSyllabus.status?.slice(1)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Duration:</span>
                                            <span className="ml-2 text-gray-900">{selectedSyllabus.term_length_weeks} weeks</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Created:</span>
                                            <span className="ml-2 text-gray-900">
                                                {new Date(selectedSyllabus.created_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Last Updated:</span>
                                            <span className="ml-2 text-gray-900">
                                                {new Date(selectedSyllabus.updated_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-medium text-gray-900 mb-3">AI Processing</h3>
                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <span className="text-gray-600">Status:</span>
                                            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getProcessingStatusColor(selectedSyllabus.ai_processing_status)}`}>
                                                {selectedSyllabus.ai_processing_status?.charAt(0).toUpperCase() + selectedSyllabus.ai_processing_status?.slice(1)}
                                            </span>
                                        </div>
                                        {selectedSyllabus.textbook_filename && (
                                            <div>
                                                <span className="text-gray-600">Textbook:</span>
                                                <span className="ml-2 text-gray-900">{selectedSyllabus.textbook_filename}</span>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-gray-600">Weekly Plans:</span>
                                            <span className="ml-2 text-gray-900">{selectedSyllabus.total_weeks} generated</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {selectedSyllabus.description && (
                                <div className="mt-6">
                                    <h3 className="font-medium text-gray-900 mb-3">Description</h3>
                                    <p className="text-gray-700 text-sm leading-relaxed">
                                        {selectedSyllabus.description}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Subjects View Component
const SubjectsView: React.FC<{
    subjects: Subject[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    onSubjectSelect: (subject: Subject) => void;
}> = ({ subjects, searchTerm, setSearchTerm, onSubjectSelect }) => {
    const filteredSubjects = subjects.filter(subject =>
        subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            {/* Search */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search subjects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Subjects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSubjects.map((subject) => (
                    <div
                        key={subject.id}
                        onClick={() => onSubjectSelect(subject)}
                        className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-all cursor-pointer group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <BookOpen className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                                    <p className="text-sm text-gray-500">{subject.code}</p>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        </div>

                        {subject.description && (
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                {subject.description}
                            </p>
                        )}

                        <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                <span>{subject.student_count} students</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredSubjects.length === 0 && (
                <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No subjects found</h3>
                    <p className="text-gray-600">
                        {subjects.length === 0
                            ? "You haven't been assigned any subjects yet."
                            : "Try adjusting your search criteria."
                        }
                    </p>
                </div>
            )}
        </>
    );
};

// Syllabuses View Component
const SyllabusesView: React.FC<{
    syllabuses: Syllabus[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filterStatus: string;
    setFilterStatus: (status: string) => void;
    getStatusColor: (status: string) => string;
    getProcessingStatusColor: (status: string) => string;
    onSyllabusSelect: (syllabus: Syllabus) => void;
    onSyllabusDetails: (syllabus: Syllabus) => void;
    onSyllabusDelete: (syllabusId: number) => void;
    onCreateNew: () => void;
}> = ({
    syllabuses,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    getStatusColor,
    getProcessingStatusColor,
    onSyllabusSelect,
    onSyllabusDetails,
    onSyllabusDelete,
    onCreateNew
}) => {
        const filteredSyllabuses = syllabuses.filter(syllabus => {
            const matchesSearch = syllabus.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                syllabus.subject_name?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'all' || syllabus.status === filterStatus;
            return matchesSearch && matchesStatus;
        });

        return (
            <>
                {/* Filters and Search */}
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
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
                    </div>
                </div>

                {/* Syllabuses Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredSyllabuses.map((syllabus) => (
                        <div key={syllabus.id} className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 mb-2">{syllabus.title}</h3>
                                    {syllabus.description && (
                                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                            {syllabus.description}
                                        </p>
                                    )}
                                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                                        <div className="flex items-center">
                                            <Clock className="w-4 h-4 mr-1" />
                                            {syllabus.term_length_weeks} weeks
                                        </div>
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 mr-1" />
                                            {new Date(syllabus.created_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(syllabus.status)}`}>
                                        {syllabus.status?.charAt(0).toUpperCase() + syllabus.status?.slice(1)}
                                    </span>
                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getProcessingStatusColor(syllabus.ai_processing_status)}`}>
                                        AI: {syllabus.ai_processing_status?.charAt(0).toUpperCase() + syllabus.ai_processing_status?.slice(1)}
                                    </span>
                                </div>
                            </div>

                            {syllabus.textbook_filename && (
                                <div className="flex items-center text-sm text-gray-600 mb-4">
                                    <FileText className="w-4 h-4 mr-2" />
                                    <span className="truncate">{syllabus.textbook_filename}</span>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => onSyllabusSelect(syllabus)}
                                    className="flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                                >
                                    View Weekly Plans
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                </button>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => onSyllabusDetails(syllabus)}
                                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="View Details"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onSyllabusDelete(syllabus.id)}
                                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredSyllabuses.length === 0 && (
                    <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
                        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No syllabuses found</h3>
                        <p className="text-gray-600 mb-6">
                            {syllabuses.length === 0
                                ? "Start by creating your first syllabus for this subject."
                                : "Try adjusting your search or filter criteria."
                            }
                        </p>
                        {syllabuses.length === 0 && (
                            <button
                                onClick={onCreateNew}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Create First Syllabus
                            </button>
                        )}
                    </div>
                )}
            </>
        );
    };

// Weekly Plans View Component
const WeeklyPlansView: React.FC<{
    syllabus: any;
    onBack: () => void;
}> = ({ syllabus, onBack }) => {
    const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

    if (!syllabus) {
        return (
            <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No syllabus data</h3>
                <p className="text-gray-600">Unable to load syllabus details.</p>
            </div>
        );
    }

    const weeklyPlans = syllabus.weekly_plans || [];

    return (
        <>
            {/* Syllabus Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{syllabus.title}</h2>
                        <p className="text-gray-600">{syllabus.subject_name}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-600">Duration</p>
                        <p className="font-semibold text-gray-900">{syllabus.term_length_weeks} weeks</p>
                    </div>
                </div>

                {syllabus.description && (
                    <p className="text-gray-700 mb-4">{syllabus.description}</p>
                )}

                {syllabus.ai_analysis_data?.analysis_summary && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-blue-900 mb-2">AI Analysis Summary</h4>
                        <p className="text-blue-800 text-sm">{syllabus.ai_analysis_data.analysis_summary}</p>
                    </div>
                )}
            </div>

            {/* Weekly Plans */}
            <div className="bg-white rounded-xl shadow-sm border">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Weekly Lesson Plans</h3>
                    <p className="text-gray-600 text-sm mt-1">
                        {weeklyPlans.length} weeks planned • Click to expand details
                    </p>
                </div>

                <div className="divide-y divide-gray-200">
                    {weeklyPlans.map((week: any) => (
                        <div key={week.id} className="p-6">
                            <div
                                className="flex items-center justify-between cursor-pointer"
                                onClick={() => setExpandedWeek(expandedWeek === week.week_number ? null : week.week_number)}
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <span className="font-bold text-blue-600">{week.week_number}</span>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-900">{week.title}</h4>
                                        <p className="text-gray-600 text-sm">{week.description}</p>
                                    </div>
                                </div>
                                {expandedWeek === week.week_number ? (
                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                ) : (
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                )}
                            </div>

                            {expandedWeek === week.week_number && (
                                <div className="mt-6 pl-14 space-y-6">
                                    {/* Learning Objectives */}
                                    <div>
                                        <h5 className="font-medium text-gray-900 mb-2">Learning Objectives</h5>
                                        <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                                            {week.learning_objectives?.map((objective: string, index: number) => (
                                                <li key={index}>{objective}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Topics Covered */}
                                    <div>
                                        <h5 className="font-medium text-gray-900 mb-2">Topics Covered</h5>
                                        <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                                            {week.topics_covered?.map((topic: string, index: number) => (
                                                <li key={index}>{topic}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Textbook Reference */}
                                    {(week.textbook_chapters || week.textbook_pages) && (
                                        <div>
                                            <h5 className="font-medium text-gray-900 mb-2">Textbook Reference</h5>
                                            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                                                {week.textbook_chapters && (
                                                    <p><span className="font-medium">Chapters:</span> {week.textbook_chapters}</p>
                                                )}
                                                {week.textbook_pages && (
                                                    <p><span className="font-medium">Pages:</span> {week.textbook_pages}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Assignments */}
                                    <div>
                                        <h5 className="font-medium text-gray-900 mb-2">Assignments</h5>
                                        <ul className="space-y-2">
                                            {week.assignments?.map((assignment: string, index: number) => (
                                                <li key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-gray-700">
                                                    {assignment}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Resources */}
                                    <div>
                                        <h5 className="font-medium text-gray-900 mb-2">Resources</h5>
                                        <ul className="space-y-1">
                                            {week.resources?.map((resource: string, index: number) => (
                                                <li key={index} className="flex items-center text-gray-700 text-sm">
                                                    <Link className="w-4 h-4 mr-2 text-blue-600" />
                                                    {resource}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {weeklyPlans.length === 0 && (
                    <div className="p-12 text-center">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No weekly plans available</h3>
                        <p className="text-gray-600">
                            {syllabus.ai_processing_status === 'completed'
                                ? "Weekly plans haven't been generated yet."
                                : `AI is ${syllabus.ai_processing_status}. Weekly plans will be available once processing is complete.`
                            }
                        </p>
                    </div>
                )}
            </div>
        </>
    );
};
