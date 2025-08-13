import React, { useState, useEffect } from 'react';
import {
    Plus,
    BookOpen,
    Calendar,
    Users,
    TrendingUp,
    Clock,
    CheckCircle,
    AlertCircle,
    Edit,
    Trash2,
    FileText,
    BarChart3,
    Loader2,
    Search,
    Filter,
    Download
} from 'lucide-react';
import { teacherService } from '../../services/teacherService';
import { gradesAssignmentsService, Assignment, AssignmentWithGrades, Grade } from '../../services/gradesAssignmentsService';

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

    // Create assignment form state
    const [newAssignment, setNewAssignment] = useState({
        title: '',
        description: '',
        subtopic: '',
        subject_id: 0,
        max_points: 100,
        due_date: ''
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
            if (!newAssignment.title || !newAssignment.subject_id) {
                alert('Please fill in required fields (title and subject)');
                return;
            }

            setLoading(true);
            const assignment = await teacherService.createAssignment({
                title: newAssignment.title,
                subject_id: newAssignment.subject_id,
                description: newAssignment.description || undefined,
                max_points: newAssignment.max_points,
                due_date: newAssignment.due_date || undefined
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
                    due_date: ''
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
                                    <button className="flex-1 text-xs bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 transition-colors flex items-center justify-center space-x-1">
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

            {/* Create Assignment Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Create New Assignment</h3>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                <input
                                    type="text"
                                    value={newAssignment.title}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Assignment title"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                                <select
                                    value={newAssignment.subject_id}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, subject_id: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value={0}>Select a subject</option>
                                    {subjects.map((subject) => (
                                        <option key={subject.id} value={subject.id}>
                                            {subject.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={newAssignment.description}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Assignment description"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subtopic</label>
                                <input
                                    type="text"
                                    value={newAssignment.subtopic}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, subtopic: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Assignment subtopic"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Points</label>
                                    <input
                                        type="number"
                                        value={newAssignment.max_points}
                                        onChange={(e) => setNewAssignment({ ...newAssignment, max_points: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        min={1}
                                        max={1000}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                    <input
                                        type="datetime-local"
                                        value={newAssignment.due_date}
                                        onChange={(e) => setNewAssignment({ ...newAssignment, due_date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex space-x-3">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateAssignment}
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                {loading ? 'Creating...' : 'Create Assignment'}
                            </button>
                        </div>
                    </div>
                </div>
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
        </div>
    );
};
