import React, { useEffect, useMemo, useState } from 'react';
import {
    Plus,
    BookOpen,
    Calendar,
    AlertCircle,
    Edit,
    Trash2,
    Loader2,
    Search,
    Filter,
    X,
    CheckCircle,
    Clock,
    MessageSquare
} from 'lucide-react';
import { teacherService } from '../../services/teacherService';
import {
    gradesAssignmentsService,
    AssignmentWithGrades,
    Grade,
    GradeDetail
} from '../../services/gradesAssignmentsService';

interface Subject {
    id: number;
    name: string;
    description?: string;
    school_id: number;
    student_count?: number;
}

type AssignmentStatusFilter = 'graded' | 'ungraded';

export const AssignmentManager: React.FC = () => {
    const [assignments, setAssignments] = useState<AssignmentWithGrades[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedSubject, setSelectedSubject] = useState<number | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<AssignmentStatusFilter>('ungraded');

    const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
    const [showStudentsDrawer, setShowStudentsDrawer] = useState(false);
    const [assignmentGrades, setAssignmentGrades] = useState<Record<number, Grade[]>>({});
    const [studentNamesById, setStudentNamesById] = useState<Record<number, string>>({});
    const [loadingAssignmentGrades, setLoadingAssignmentGrades] = useState(false);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState(false);

    const [gradeFeedbackModal, setGradeFeedbackModal] = useState<{
        isOpen: boolean;
        loading: boolean;
        detail: GradeDetail | null;
        fallback?: Grade | null;
    }>({ isOpen: false, loading: false, detail: null, fallback: null });

    const [editAssignment, setEditAssignment] = useState({
        id: 0,
        title: '',
        description: '',
        max_points: 100,
        rubric: ''
    });

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

            // Keep this fast: only load what is needed for list rendering.
            const [assignmentsData, subjectsData] = await Promise.all([
                gradesAssignmentsService.getMyAssignments(),
                teacherService.getMySubjects()
            ]);

            const typedAssignments = assignmentsData as AssignmentWithGrades[];
            setAssignments(typedAssignments);
            setSubjects(subjectsData);

            if (typedAssignments.length > 0) {
                const preferred = typedAssignments.find((a) => (a.graded_count || 0) === 0) || typedAssignments[0];
                setSelectedAssignmentId(preferred.id);
            } else {
                setSelectedAssignmentId(null);
            }
        } catch (err) {
            console.error('Error loading assignment data:', err);
            setError('Failed to load assignment data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const loadGradesForAssignment = async (assignmentId: number) => {
        if (assignmentGrades[assignmentId]) {
            return;
        }

        try {
            setLoadingAssignmentGrades(true);
            const grades = await gradesAssignmentsService.getAssignmentGrades(assignmentId);
            setAssignmentGrades((prev) => ({ ...prev, [assignmentId]: grades }));

            // Backfill missing student names from grade detail endpoint.
            const gradesMissingNames = grades.filter((g) => !g.student_name && !studentNamesById[g.student_id]);
            if (gradesMissingNames.length > 0) {
                const detailResults = await Promise.allSettled(
                    gradesMissingNames.map((grade) => gradesAssignmentsService.getGradeDetails(grade.id))
                );

                const discoveredNames: Record<number, string> = {};
                for (const result of detailResults) {
                    if (result.status === 'fulfilled' && result.value.student_name) {
                        discoveredNames[result.value.student_id] = result.value.student_name;
                    }
                }

                if (Object.keys(discoveredNames).length > 0) {
                    setStudentNamesById((prev) => ({ ...prev, ...discoveredNames }));
                }
            }
        } finally {
            setLoadingAssignmentGrades(false);
        }
    };

    const handleSelectAssignment = async (assignmentId: number) => {
        setSelectedAssignmentId(assignmentId);
        setShowStudentsDrawer(true);
        await loadGradesForAssignment(assignmentId);
    };

    const handleOpenGradeFeedback = async (grade: Grade) => {
        setGradeFeedbackModal({ isOpen: true, loading: true, detail: null, fallback: grade });

        try {
            const detail = await gradesAssignmentsService.getGradeDetails(grade.id);
            if (detail.student_name) {
                setStudentNamesById((prev) => ({ ...prev, [detail.student_id]: detail.student_name }));
            }
            setGradeFeedbackModal({ isOpen: true, loading: false, detail, fallback: grade });
        } catch (err) {
            console.error('Failed to load grade details:', err);
            setGradeFeedbackModal({ isOpen: true, loading: false, detail: null, fallback: grade });
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
                await loadData();
            }
        } catch (err) {
            console.error('Failed to create assignment:', err);
            alert('Failed to create assignment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAssignment = async (assignmentId: number) => {
        if (!confirm('Are you sure you want to delete this assignment?')) {
            return;
        }

        try {
            setLoading(true);
            const success = await gradesAssignmentsService.deleteAssignment(assignmentId);
            if (success) {
                await loadData();
            }
        } catch (err) {
            console.error('Failed to delete assignment:', err);
            alert('Failed to delete assignment. Please try again.');
        } finally {
            setLoading(false);
        }
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
            return;
        }

        try {
            setEditingAssignment(true);

            if (!editAssignment.title || editAssignment.title.trim().length === 0) {
                alert('Assignment title is required');
                return;
            }

            if (!editAssignment.description || editAssignment.description.trim().length < 10) {
                alert('Assignment description must be at least 10 characters long');
                return;
            }

            if (!editAssignment.rubric || editAssignment.rubric.trim().length < 10) {
                alert('Grading rubric must be at least 10 characters long');
                return;
            }

            await gradesAssignmentsService.updateAssignment(editAssignment.id, {
                title: editAssignment.title.trim(),
                description: editAssignment.description.trim(),
                max_points: editAssignment.max_points,
                subtopic: undefined
            });

            // Keep rubric update on academic endpoint where rubric is handled.
            const token = localStorage.getItem('access_token');
            const response = await fetch(`https://znd2y0sjxf.execute-api.eu-west-1.amazonaws.com/study-area/academic/assignments/${editAssignment.id}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: editAssignment.title.trim(),
                    description: editAssignment.description.trim(),
                    max_points: editAssignment.max_points,
                    rubric: editAssignment.rubric.trim()
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update rubric');
            }

            setShowEditModal(false);
            await loadData();
        } catch (err) {
            console.error('Failed to update assignment:', err);
            alert(err instanceof Error ? err.message : 'Failed to update assignment');
        } finally {
            setEditingAssignment(false);
        }
    };

    const gradedCount = useMemo(() => assignments.filter((a) => (a.graded_count || 0) > 0).length, [assignments]);
    const ungradedCount = useMemo(() => assignments.filter((a) => (a.graded_count || 0) === 0).length, [assignments]);

    const filteredAssignments = useMemo(() => {
        return assignments.filter((assignment) => {
            const matchesSubject = selectedSubject === 'all' || assignment.subject_id === selectedSubject;
            const matchesSearch =
                assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                assignment.subject_name?.toLowerCase().includes(searchTerm.toLowerCase());

            const isGraded = (assignment.graded_count || 0) > 0;
            const matchesStatus = statusFilter === 'graded' ? isGraded : !isGraded;

            return matchesSubject && matchesSearch && matchesStatus;
        });
    }, [assignments, selectedSubject, searchTerm, statusFilter]);

    const selectedAssignment = useMemo(
        () => assignments.find((a) => a.id === selectedAssignmentId) || null,
        [assignments, selectedAssignmentId]
    );

    const selectedAssignmentGrades = useMemo(() => {
        if (!selectedAssignmentId) {
            return [];
        }
        return assignmentGrades[selectedAssignmentId] || [];
    }, [assignmentGrades, selectedAssignmentId]);

    const formatPercentage = (value?: number) => {
        if (!value || Number.isNaN(value)) {
            return '0.0';
        }
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
                        <button onClick={loadData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {showCreateModal ? (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">Create New Assignment</h2>
                            <p className="text-gray-600 mt-1">Fill in assignment details</p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            <span>← Back</span>
                        </button>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Assignment Details</h3>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                                <input
                                    type="text"
                                    value={newAssignment.title}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter assignment title"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                                <select
                                    value={newAssignment.subject_id}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, subject_id: parseInt(e.target.value, 10) })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                <textarea
                                    value={newAssignment.description}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={4}
                                    placeholder="Describe assignment instructions"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Grading Rubric *</label>
                                <textarea
                                    value={newAssignment.rubric}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, rubric: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={6}
                                    placeholder="Describe grading criteria"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Points</label>
                                    <input
                                        type="number"
                                        value={newAssignment.max_points}
                                        onChange={(e) => setNewAssignment({ ...newAssignment, max_points: parseInt(e.target.value || '0', 10) })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                        <div className="p-6 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateAssignment}
                                disabled={loading || !newAssignment.title || !newAssignment.subject_id || !newAssignment.rubric}
                                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                <span>{loading ? 'Creating...' : 'Create Assignment'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">Assignment Manager</h2>
                            <p className="text-gray-600 mt-1">Assignments and grading in one place</p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>New Assignment</span>
                        </button>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex flex-col sm:flex-row gap-4 items-center">
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

                            <div className="flex items-center space-x-2">
                                <Filter className="w-5 h-5 text-gray-400" />
                                <select
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
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

                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={() => setStatusFilter('ungraded')}
                                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${statusFilter === 'ungraded'
                                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <Clock className="w-4 h-4 inline mr-1.5" />
                                Ungraded ({ungradedCount})
                            </button>
                            <button
                                onClick={() => setStatusFilter('graded')}
                                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${statusFilter === 'graded'
                                    ? 'bg-green-50 border-green-200 text-green-800'
                                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <CheckCircle className="w-4 h-4 inline mr-1.5" />
                                Graded ({gradedCount})
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                        {filteredAssignments.map((assignment) => {
                            const isSelected = assignment.id === selectedAssignmentId;
                            const isGraded = (assignment.graded_count || 0) > 0;

                            return (
                                <div
                                    key={assignment.id}
                                    onClick={() => handleSelectAssignment(assignment.id)}
                                    className={`rounded-2xl border cursor-pointer p-5 transition-all hover:shadow-md hover:-translate-y-0.5 ${isSelected
                                        ? 'border-blue-300 bg-blue-50/80 shadow-sm'
                                        : 'border-gray-200 bg-white hover:border-blue-200'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="text-lg font-semibold text-gray-900 truncate">{assignment.title}</h3>
                                            <p className="text-sm text-gray-600 mt-1 truncate">{assignment.subject_name || 'Unknown subject'}</p>
                                        </div>
                                        <span className={`text-xs px-2.5 py-1 rounded-full border ${isGraded ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                            {isGraded ? 'Graded' : 'Ungraded'}
                                        </span>
                                    </div>

                                    <div className="mt-3 text-sm text-gray-600 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                        <span>{assignment.due_date ? `Due ${new Date(assignment.due_date).toLocaleDateString()}` : 'No due date'}</span>
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                        <div className="rounded-lg bg-gray-50 px-3 py-2 border border-gray-100">
                                            <p className="text-xs text-gray-500">Students graded</p>
                                            <p className="text-lg font-semibold text-gray-900">{assignment.graded_count || 0}</p>
                                        </div>
                                        <div className="rounded-lg bg-gray-50 px-3 py-2 border border-gray-100">
                                            <p className="text-xs text-gray-500">Average score</p>
                                            <p className="text-lg font-semibold text-gray-900">{formatPercentage(assignment.average_score)}%</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenEdit(assignment);
                                            }}
                                            className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-200 transition-colors flex items-center gap-1"
                                        >
                                            <Edit className="w-3.5 h-3.5" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteAssignment(assignment.id);
                                            }}
                                            className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded hover:bg-red-200 transition-colors flex items-center gap-1"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {showStudentsDrawer && selectedAssignment && (
                <div className="fixed inset-0 z-40 flex">
                    <div className="flex-1 bg-black/25 backdrop-blur-[1px]" onClick={() => setShowStudentsDrawer(false)} />

                    <div className="w-full max-w-lg bg-white h-full shadow-2xl border-l border-gray-200 flex flex-col">
                        <div className="p-5 border-b border-gray-200 flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <h3 className="text-lg font-semibold text-gray-900 truncate">{selectedAssignment.title}</h3>
                                <p className="text-sm text-gray-600 mt-1 truncate">{selectedAssignment.subject_name || 'Unknown subject'}</p>
                                <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-3">
                                    <span>Max points: {selectedAssignment.max_points}</span>
                                    <span>Average: {formatPercentage(selectedAssignment.average_score)}%</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowStudentsDrawer(false)}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                aria-label="Close students panel"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-5 flex-1 overflow-y-auto">
                            {loadingAssignmentGrades ? (
                                <div className="py-10 text-center text-gray-500">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                                    Loading student grades...
                                </div>
                            ) : selectedAssignmentGrades.length === 0 ? (
                                <div className="py-10 text-center text-gray-500">
                                    <Clock className="w-10 h-10 mx-auto mb-2" />
                                    <p>No students graded yet for this assignment.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {selectedAssignmentGrades
                                        .sort((a, b) => new Date(b.graded_date).getTime() - new Date(a.graded_date).getTime())
                                        .map((grade) => {
                                            const maxPoints = selectedAssignment.max_points || grade.assignment_max_points || 100;
                                            const percentage = Math.round((grade.points_earned / maxPoints) * 100);

                                            return (
                                                <button
                                                    key={grade.id}
                                                    onClick={() => handleOpenGradeFeedback(grade)}
                                                    className="w-full text-left border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div>
                                                            <div className="font-semibold text-gray-900">
                                                                {grade.student_name || studentNamesById[grade.student_id] || `Student ${grade.student_id}`}
                                                            </div>
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                Graded {grade.graded_date ? new Date(grade.graded_date).toLocaleDateString() : 'N/A'}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-bold text-gray-900">{grade.points_earned}/{maxPoints}</div>
                                                            <div className="text-xs text-gray-600">{percentage}%</div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 text-xs text-blue-700 flex items-center">
                                                        <MessageSquare className="w-3.5 h-3.5 mr-1" />
                                                        Click to view feedback
                                                    </div>
                                                </button>
                                            );
                                        })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {gradeFeedbackModal.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-4xl w-full max-h-[92vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Student Feedback</h3>
                            <button
                                onClick={() => setGradeFeedbackModal({ isOpen: false, loading: false, detail: null, fallback: null })}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6">
                            {gradeFeedbackModal.loading ? (
                                <div className="py-10 text-center text-gray-500">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                                    Loading feedback...
                                </div>
                            ) : (
                                <>
                                    <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                                        <p className="text-sm text-gray-600">Student</p>
                                        <p className="font-semibold text-gray-900">
                                            {gradeFeedbackModal.detail?.student_name || gradeFeedbackModal.fallback?.student_name || 'N/A'}
                                        </p>
                                        <p className="text-sm text-gray-600 mt-3">Assignment</p>
                                        <p className="font-semibold text-gray-900">
                                            {gradeFeedbackModal.detail?.assignment_title || selectedAssignment?.title || 'N/A'}
                                        </p>
                                        <p className="text-sm text-gray-600 mt-3">Grade</p>
                                        <p className="font-semibold text-gray-900">
                                            {gradeFeedbackModal.detail
                                                ? `${gradeFeedbackModal.detail.points_earned}/${gradeFeedbackModal.detail.max_points} (${Math.round(gradeFeedbackModal.detail.percentage)}%)`
                                                : gradeFeedbackModal.fallback && selectedAssignment
                                                    ? `${gradeFeedbackModal.fallback.points_earned}/${selectedAssignment.max_points} (${Math.round((gradeFeedbackModal.fallback.points_earned / selectedAssignment.max_points) * 100)}%)`
                                                    : 'N/A'}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-2">Feedback</p>
                                        <div className="border border-gray-200 rounded-lg p-5 bg-white whitespace-pre-wrap text-sm text-gray-800 min-h-[220px] leading-6">
                                            {gradeFeedbackModal.detail?.feedback || gradeFeedbackModal.fallback?.feedback || 'No feedback available for this grade.'}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Edit Assignment</h3>
                                <p className="text-sm text-gray-600">Update assignment details and rubric</p>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 min-h-0">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Title</label>
                                    <input
                                        type="text"
                                        value={editAssignment.title}
                                        onChange={(e) => setEditAssignment({ ...editAssignment, title: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Description</label>
                                    <textarea
                                        value={editAssignment.description}
                                        onChange={(e) => setEditAssignment({ ...editAssignment, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Points</label>
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Grading Rubric</label>
                                    <textarea
                                        value={editAssignment.rubric}
                                        onChange={(e) => setEditAssignment({ ...editAssignment, rubric: e.target.value })}
                                        rows={5}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-6 border-t bg-gray-50 flex-shrink-0">
                            <p className="text-sm text-gray-600">Changes will be saved to this assignment</p>
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
                                            <Edit className="w-4 h-4" />
                                            <span>Update Assignment</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!showCreateModal && filteredAssignments.length === 0 && (
                <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
                    <p className="text-gray-600 mb-4">Try changing the filters or create a new assignment.</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Create Assignment
                    </button>
                </div>
            )}
        </div>
    );
};
