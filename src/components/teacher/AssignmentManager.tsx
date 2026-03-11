import React, { useState, useEffect } from 'react';
import {
    Plus,
    BookOpen,
    Calendar,
    AlertCircle,
    Edit,
    Trash2,
    BarChart3,
    Loader2,
    Search,
    Filter,
    X
} from 'lucide-react';
import { teacherService } from '../../services/teacherService';
import { gradesAssignmentsService, AssignmentWithGrades } from '../../services/gradesAssignmentsService';

interface Subject {
    id: number;
    name: string;
    description?: string;
    school_id: number;
    student_count?: number;
}

export const AssignmentManager: React.FC = () => {
    const [assignments, setAssignments] = useState<AssignmentWithGrades[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<number | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showGradingModal, setShowGradingModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithGrades | null>(null);
    const [analytics, setAnalytics] = useState<any>(null);

    // Edit assignment modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState(false);
    const [editAssignment, setEditAssignment] = useState({
        id: 0,
        title: '',
        description: '',
        max_points: 100,
        rubric: ''
    });

    // Create assignment form state
    const [newAssignment, setNewAssignment] = useState({
        title: '',
        description: '',
        subtopic: '',
        subject_id: 0,
        max_points: 100,
        due_date: '',
        rubric: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load assignments, subjects, and analytics
            const [assignmentsData, subjectsData, analyticsData] = await Promise.all([
                teacherService.getMyAssignments(),
                teacherService.getMySubjects(),
                teacherService.getGradingAnalytics()
            ]);

            setAssignments(assignmentsData);
            setSubjects(subjectsData);
            setAnalytics(analyticsData);

            console.log('📚 Loaded:', assignmentsData.length, 'assignments,', subjectsData.length, 'subjects');
        } catch (err) {
            console.error('Error loading assignment data:', err);
            setError('Failed to load assignment data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAssignment = async () => {
        try {
            if (!newAssignment.title || !newAssignment.subject_id || !newAssignment.rubric) {
                alert('Please fill in required fields (title, subject, and rubric)');
                return;
            }

            setLoading(true);
            const assignment = await teacherService.createAssignment({
                title: newAssignment.title,
                subject_id: newAssignment.subject_id,
                description: newAssignment.description || undefined,
                max_points: newAssignment.max_points,
                due_date: newAssignment.due_date || undefined,
                rubric: newAssignment.rubric
            });

            if (assignment) {
                console.log('✅ Assignment created successfully');
                setShowCreateModal(false);
                setNewAssignment({
                    title: '',
                    description: '',
                    subtopic: '',
                    subject_id: 0,
                    max_points: 100,
                    due_date: '',
                    rubric: ''
                });
                await loadData(); // Refresh data
            }
        } catch (error) {
            console.error('❌ Failed to create assignment:', error);
            alert('Failed to create assignment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAssignment = async (assignmentId: number) => {
        if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
            return;
        }

        try {
            setLoading(true);
            const success = await gradesAssignmentsService.deleteAssignment(assignmentId);
            if (success) {
                console.log('✅ Assignment deleted successfully');
                await loadData(); // Refresh data
            }
        } catch (error) {
            console.error('❌ Failed to delete assignment:', error);
            alert('Failed to delete assignment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenGrading = (assignment: AssignmentWithGrades) => {
        setSelectedAssignment(assignment);
        setShowGradingModal(true);
    };

    const handleOpenEdit = (assignment: AssignmentWithGrades) => {
        setEditAssignment({
            id: assignment.id,
            title: assignment.title || '',
            description: assignment.description || '',
            max_points: assignment.max_points || 100,
            rubric: (assignment as any).rubric || ''
        });
        setShowEditModal(true);
    };

    const handleUpdateAssignment = async () => {
        if (!editAssignment.id) {
            alert('No assignment selected');
            return;
        }

        try {
            setEditingAssignment(true);

            // Validate required fields
            if (!editAssignment.title || editAssignment.title.trim().length === 0) {
                alert('Assignment title is required');
                return;
            }

            if (!editAssignment.description || editAssignment.description.trim().length < 10) {
                alert('Assignment description must be at least 10 characters long');
                return;
            }

            if (!editAssignment.max_points || editAssignment.max_points <= 0 || editAssignment.max_points > 1000) {
                alert('Max points must be between 1 and 1000');
                return;
            }

            if (!editAssignment.rubric || editAssignment.rubric.trim().length < 10) {
                alert('Grading rubric must be at least 10 characters long');
                return;
            }

            const token = localStorage.getItem('access_token');

            const updateData = {
                title: editAssignment.title.trim(),
                description: editAssignment.description.trim(),
                max_points: parseInt(editAssignment.max_points.toString()),
                rubric: editAssignment.rubric.trim()
            };

            console.log('📝 Sending update data:', updateData);

            const response = await fetch(`https://brainink-backend.onrender.com/study-area/academic/assignments/${editAssignment.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Update failed:', response.status, errorText);
                throw new Error(`Failed to update assignment: ${response.status} - ${errorText}`);
            }

            const updatedAssignment = await response.json();
            console.log('✅ Assignment updated:', updatedAssignment);

            // Update local assignments list
            setAssignments(prev => prev.map(a =>
                a.id === editAssignment.id ? { ...a, ...updateData } : a
            ));

            alert('Assignment updated successfully!');
            setShowEditModal(false);

        } catch (error) {
            console.error('❌ Failed to update assignment:', error);
            alert(error instanceof Error ? error.message : 'Failed to update assignment');
        } finally {
            setEditingAssignment(false);
        }
    };

    const getAssignmentStatus = (assignment: AssignmentWithGrades) => {
        const now = new Date();
        let status: string;

        if (!assignment.due_date) {
            status = 'no_due_date';
        } else {
            const dueDate = new Date(assignment.due_date);
            const diff = dueDate.getTime() - now.getTime();
            if (diff < 0) {
                status = 'overdue';
            } else if (diff < 1000 * 60 * 60 * 24 * 2) { // less than 2 days
                status = 'due_soon';
            } else {
                status = 'upcoming';
            }
        }

        const needsGrading = assignment.total_students > assignment.graded_count;

        if (needsGrading) return 'needs_grading';
        return status;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'needs_grading': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
            case 'due_soon': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'upcoming': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'no_due_date': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-green-100 text-green-800 border-green-200';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'needs_grading': return 'Needs Grading';
            case 'overdue': return 'Overdue';
            case 'due_soon': return 'Due Soon';
            case 'upcoming': return 'Upcoming';
            case 'no_due_date': return 'No Due Date';
            default: return 'Complete';
        }
    };

    // Filter assignments
    const filteredAssignments = assignments.filter(assignment => {
        const matchesSubject = selectedSubject === 'all' || assignment.subject_id === selectedSubject;
        const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            assignment.subject_name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSubject && matchesSearch;
    });

    // Calculate completion rate with proper rounding
    const getCompletionRate = (assignment: AssignmentWithGrades) => {
        if (assignment.total_students === 0) return 0;
        return Math.round((assignment.graded_count / assignment.total_students) * 100);
    };

    // Format percentage with one decimal place
    const formatPercentage = (value: number | null | undefined) => {
        if (!value) return '0.0';
        return (Math.round(value * 10) / 10).toFixed(1);
    };

    if (loading && assignments.length === 0) {
        return (
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Loading assignments...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
                        <p className="text-red-600 mb-4">{error}</p>
                        <button
                            onClick={loadData}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Show Create Assignment Section OR Main Content */}
            {showCreateModal ? (
                /* Create Assignment Full Section */
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">Create New Assignment</h2>
                            <p className="text-gray-600 mt-1">Fill in the details below to create a new assignment</p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            <span>← Back to Assignments</span>
                        </button>
                    </div>

                    {/* Create Assignment Form */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Assignment Details</h3>
                            <p className="text-sm text-gray-600 mt-1">Fields marked with * are required</p>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                                <input
                                    type="text"
                                    value={newAssignment.title}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                                    placeholder="Enter assignment title"
                                />
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                                <select
                                    value={newAssignment.subject_id}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, subject_id: parseInt(e.target.value) })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                                >
                                    <option value={0}>Select a subject</option>
                                    {subjects.map((subject) => (
                                        <option key={subject.id} value={subject.id}>
                                            {subject.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                <textarea
                                    value={newAssignment.description}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={4}
                                    placeholder="Describe what students need to do for this assignment"
                                />
                            </div>

                            {/* Subtopic */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Subtopic</label>
                                <input
                                    type="text"
                                    value={newAssignment.subtopic}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, subtopic: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., Chapter 5 - Quadratic Equations"
                                />
                            </div>

                            {/* Rubric */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Grading Rubric *</label>
                                <textarea
                                    value={newAssignment.rubric}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, rubric: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={6}
                                    placeholder="Describe the grading criteria, point distribution, and what you're looking for in student submissions. This will be used by K.A.N.A. AI for automated grading."
                                />
                                <p className="text-sm text-gray-500 mt-2">
                                    This rubric will be used by K.A.N.A. AI for automated grading
                                </p>
                            </div>

                            {/* Max Points and Due Date */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Points</label>
                                    <input
                                        type="number"
                                        value={newAssignment.max_points}
                                        onChange={(e) => setNewAssignment({ ...newAssignment, max_points: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                                        min={1}
                                        max={1000}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                                    <input
                                        type="datetime-local"
                                        value={newAssignment.due_date}
                                        onChange={(e) => setNewAssignment({ ...newAssignment, due_date: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="p-6 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-lg font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateAssignment}
                                disabled={loading || !newAssignment.title || !newAssignment.subject_id || !newAssignment.rubric}
                                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-medium flex items-center justify-center space-x-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Creating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-5 h-5" />
                                        <span>Create Assignment</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* Main Assignment Manager Content */
                <>
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">Assignment Manager</h2>
                            <p className="text-gray-600 mt-1">Create, manage, and grade assignments</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                <span>New Assignment</span>
                            </button>
                        </div>
                    </div>

                    {/* Analytics Overview */}
                    {analytics && (
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                                <div className="text-2xl font-bold text-blue-600">{analytics.totalAssignments || 0}</div>
                                <div className="text-sm text-gray-600">Total Assignments</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                                <div className="text-2xl font-bold text-green-600">{analytics.totalGrades || 0}</div>
                                <div className="text-sm text-gray-600">Grades Given</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                                <div className="text-2xl font-bold text-purple-600">
                                    {analytics.averageClassScore ? Math.round(analytics.averageClassScore * 10) / 10 : 0}%
                                </div>
                                <div className="text-sm text-gray-600">Class Average</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                                <div className="text-2xl font-bold text-yellow-600">
                                    {analytics.gradingProgress ? Math.round(analytics.gradingProgress * 10) / 10 : 0}%
                                </div>
                                <div className="text-sm text-gray-600">Grading Progress</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                                <div className="text-2xl font-bold text-red-600">{analytics.assignmentsNeedingGrading || 0}</div>
                                <div className="text-sm text-gray-600">Need Grading</div>
                            </div>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                            {/* Search */}
                            <div className="relative flex-1">
                                <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search assignments..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Subject Filter */}
                            <div className="flex items-center space-x-2">
                                <Filter className="w-5 h-5 text-gray-400" />
                                <select
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Subjects</option>
                                    {subjects.map((subject) => (
                                        <option key={subject.id} value={subject.id}>
                                            {subject.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Assignments Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredAssignments.map((assignment) => {
                            const status = getAssignmentStatus(assignment);
                            const completionRate = getCompletionRate(assignment);

                            return (
                                <div key={assignment.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                    {/* Assignment Header */}
                                    <div className="p-4 border-b border-gray-200">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 mb-1">{assignment.title}</h3>
                                                <p className="text-sm text-gray-600">{assignment.subject_name}</p>
                                                {assignment.subtopic && (
                                                    <p className="text-xs text-gray-500 mt-1">{assignment.subtopic}</p>
                                                )}
                                            </div>
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(status)}`}>
                                                {getStatusLabel(status)}
                                            </span>
                                        </div>

                                        {assignment.due_date && (
                                            <div className="flex items-center space-x-1 mt-2 text-sm text-gray-500">
                                                <Calendar className="w-4 h-4" />
                                                <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Assignment Stats */}
                                    <div className="p-4 space-y-3">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="text-center">
                                                <div className="font-semibold text-lg">{assignment.max_points || 0}</div>
                                                <div className="text-gray-600">Max Points</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="font-semibold text-lg">
                                                    {formatPercentage(assignment.average_score)}%
                                                </div>
                                                <div className="text-gray-600">Class Avg</div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm text-gray-600">Grading Progress</span>
                                                <span className="text-sm font-medium">{assignment.graded_count}/{assignment.total_students}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                                    style={{ width: `${completionRate}%` }}
                                                />
                                            </div>
                                            {(assignment as any).whatsapp_submission_count > 0 && (
                                                <div className="mt-1 text-xs text-green-700 flex items-center gap-1">
                                                    📱 {(assignment as any).whatsapp_submission_count} via WhatsApp
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleOpenGrading(assignment)}
                                                className="flex-1 text-xs bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                                            >
                                                <BarChart3 className="w-3 h-3" />
                                                <span>Grade</span>
                                            </button>
                                            <button
                                                onClick={() => handleOpenEdit(assignment)}
                                                className="flex-1 text-xs bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 transition-colors flex items-center justify-center space-x-1"
                                            >
                                                <Edit className="w-3 h-3" />
                                                <span>Edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteAssignment(assignment.id)}
                                                className="text-xs bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 transition-colors"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {filteredAssignments.length === 0 && (
                        <div className="text-center py-12">
                            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
                            <p className="text-gray-600 mb-4">Create your first assignment to get started.</p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Create Assignment
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Grading Modal Placeholder */}
            {showGradingModal && selectedAssignment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Grade Assignment: {selectedAssignment.title}
                            </h3>
                            <button
                                onClick={() => setShowGradingModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6">
                            <p className="text-gray-600 mb-4">
                                Grading interface will be implemented here. This will show a list of students
                                and allow bulk grading functionality.
                            </p>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-blue-800">
                                    📝 Assignment: {selectedAssignment.title}<br />
                                    👥 Students: {selectedAssignment.total_students}<br />
                                    ✅ Graded: {selectedAssignment.graded_count}<br />
                                    📊 Max Points: {selectedAssignment.max_points}
                                </p>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200">
                            <button
                                onClick={() => setShowGradingModal(false)}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Assignment Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                        {/* Modal Header - Fixed */}
                        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Edit Assignment</h3>
                                <p className="text-sm text-gray-600">
                                    Update assignment details and grading criteria
                                </p>
                            </div>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Content - Scrollable */}
                        <div className="p-6 overflow-y-auto flex-1 min-h-0">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Assignment Title
                                    </label>
                                    <input
                                        type="text"
                                        value={editAssignment.title}
                                        onChange={(e) => setEditAssignment({ ...editAssignment, title: e.target.value })}
                                        placeholder="Assignment title"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Assignment Description
                                    </label>
                                    <textarea
                                        value={editAssignment.description}
                                        onChange={(e) => setEditAssignment({ ...editAssignment, description: e.target.value })}
                                        placeholder="Assignment description (minimum 10 characters)"
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
                                        {editAssignment.description.length}/1000 characters (minimum 10 required)
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Maximum Points
                                    </label>
                                    <input
                                        type="number"
                                        value={editAssignment.max_points}
                                        onChange={(e) => setEditAssignment({ ...editAssignment, max_points: Number(e.target.value) })}
                                        min="1"
                                        max="1000"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Grading Rubric
                                    </label>
                                    <textarea
                                        value={editAssignment.rubric}
                                        onChange={(e) => setEditAssignment({ ...editAssignment, rubric: e.target.value })}
                                        placeholder="Describe grading criteria, what to look for, point distribution, etc."
                                        rows={5}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        This rubric will be used by K.A.N.A. AI for automated grading
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer - Fixed */}
                        <div className="flex items-center justify-between p-6 border-t bg-gray-50 flex-shrink-0">
                            <p className="text-sm text-gray-600">
                                Changes will be saved to the assignment
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    disabled={editingAssignment}
                                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateAssignment}
                                    disabled={editingAssignment || !editAssignment.title.trim() || !editAssignment.description.trim() || editAssignment.description.trim().length < 10 || editAssignment.max_points <= 0}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2"
                                >
                                    {editingAssignment ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Updating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span>Update Assignment</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
