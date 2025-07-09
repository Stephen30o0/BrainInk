import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    TrendingUp,
    Users,
    CheckCircle,
    Clock,
    Star,
    Award,
    FileText,
    Search,
    Filter,
    Download,
    Send,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { teacherService } from '../../services/teacherService';
import { gradesAssignmentsService, Grade, AssignmentWithGrades, StudentGradeReport } from '../../services/gradesAssignmentsService';

interface GradingStudent {
    id: number;
    name: string;
    email: string;
    current_grade?: Grade;
    needs_grading: boolean;
    average_score: number;
}

export const GradingDashboard: React.FC = () => {
    const [assignments, setAssignments] = useState<AssignmentWithGrades[]>([]);
    const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithGrades | null>(null);
    const [students, setStudents] = useState<GradingStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [gradingLoading, setGradingLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'graded' | 'pending'>('all');
    const [analytics, setAnalytics] = useState<any>(null);
    const [recentActivity, setRecentActivity] = useState<Grade[]>([]);

    // Bulk grading state
    const [bulkGradeScore, setBulkGradeScore] = useState('');
    const [bulkGradeFeedback, setBulkGradeFeedback] = useState('');
    const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedAssignment) {
            loadStudentsForAssignment(selectedAssignment);
        }
    }, [selectedAssignment]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [assignmentsData, analyticsData, recentActivityData] = await Promise.all([
                teacherService.getAssignmentsNeedingGrading(),
                teacherService.getGradingAnalytics(),
                gradesAssignmentsService.getRecentGradingActivity(10)
            ]);

            setAssignments(assignmentsData);
            setAnalytics(analyticsData);
            setRecentActivity(recentActivityData);

            // Auto-select first assignment if available
            if (assignmentsData.length > 0 && !selectedAssignment) {
                setSelectedAssignment(assignmentsData[0]);
            }

            console.log('📊 Loaded grading data:', assignmentsData.length, 'assignments needing grading');
        } catch (err) {
            console.error('Error loading grading data:', err);
            setError('Failed to load grading data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const loadStudentsForAssignment = async (assignment: AssignmentWithGrades) => {
        try {
            setGradingLoading(true);

            // Get all students for the subject
            const subjectStudents = await teacherService.getStudentsInSubject(assignment.subject_id);

            // Create grading data for each student
            const gradingStudents: GradingStudent[] = subjectStudents.map(student => {
                const existingGrade = assignment.grades?.find(grade => grade.student_id === student.id);

                return {
                    id: student.id,
                    name: `${student.fname} ${student.lname}`,
                    email: student.email || `${student.username}@brainink.com`,
                    current_grade: existingGrade,
                    needs_grading: !existingGrade,
                    average_score: 85 // TODO: Get real average from student data
                };
            });

            setStudents(gradingStudents);
            console.log('👥 Loaded', gradingStudents.length, 'students for assignment grading');
        } catch (error) {
            console.error('❌ Failed to load students for assignment:', error);
        } finally {
            setGradingLoading(false);
        }
    };

    const handleGradeStudent = async (studentId: number, score: number, feedback?: string) => {
        if (!selectedAssignment) return;

        try {
            setGradingLoading(true);

            const gradeData = {
                assignment_id: selectedAssignment.id,
                student_id: studentId,
                points_earned: score,
                feedback: feedback
            };

            const grade = await gradesAssignmentsService.createGrade(gradeData);

            if (grade) {
                console.log('✅ Grade submitted successfully');

                // Update local state
                setStudents(prev => prev.map(student =>
                    student.id === studentId
                        ? { ...student, current_grade: grade, needs_grading: false }
                        : student
                ));

                // Refresh assignment data
                await loadData();
            }
        } catch (error) {
            console.error('❌ Failed to submit grade:', error);
            alert('Failed to submit grade. Please try again.');
        } finally {
            setGradingLoading(false);
        }
    };

    const handleBulkGrading = async () => {
        if (!selectedAssignment || selectedStudents.size === 0 || !bulkGradeScore) {
            alert('Please select students and enter a score for bulk grading.');
            return;
        }

        try {
            setGradingLoading(true);

            const score = parseInt(bulkGradeScore);
            if (isNaN(score) || score < 0 || score > selectedAssignment.max_points) {
                alert(`Score must be between 0 and ${selectedAssignment.max_points}`);
                return;
            }

            const bulkGradeData = {
                assignment_id: selectedAssignment.id,
                grades: Array.from(selectedStudents).map(studentId => ({
                    student_id: studentId,
                    points_earned: score,
                    feedback: bulkGradeFeedback || undefined
                }))
            };

            const result = await gradesAssignmentsService.createBulkGrades(bulkGradeData);

            console.log('✅ Bulk grading completed:', result.total_successful, 'successful,', result.total_failed, 'failed');

            if (result.total_successful > 0) {
                // Clear bulk grading form
                setBulkGradeScore('');
                setBulkGradeFeedback('');
                setSelectedStudents(new Set());

                // Refresh data
                await loadData();
                if (selectedAssignment) {
                    await loadStudentsForAssignment(selectedAssignment);
                }
            }

            if (result.total_failed > 0) {
                alert(`Bulk grading completed with ${result.total_failed} failures. Check console for details.`);
            }
        } catch (error) {
            console.error('❌ Failed to perform bulk grading:', error);
            alert('Failed to perform bulk grading. Please try again.');
        } finally {
            setGradingLoading(false);
        }
    };

    const toggleStudentSelection = (studentId: number) => {
        const newSelected = new Set(selectedStudents);
        if (newSelected.has(studentId)) {
            newSelected.delete(studentId);
        } else {
            newSelected.add(studentId);
        }
        setSelectedStudents(newSelected);
    };

    const selectAllPendingStudents = () => {
        const pendingStudents = students.filter(student => student.needs_grading);
        setSelectedStudents(new Set(pendingStudents.map(student => student.id)));
    };

    // Filter students
    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' ||
            (filterStatus === 'graded' && !student.needs_grading) ||
            (filterStatus === 'pending' && student.needs_grading);
        return matchesSearch && matchesFilter;
    });

    const getGradeColor = (percentage: number) => {
        if (percentage >= 90) return 'text-green-600 bg-green-50';
        if (percentage >= 80) return 'text-blue-600 bg-blue-50';
        if (percentage >= 70) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    if (loading) {
        return (
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Loading grading dashboard...</p>
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
                    <h2 className="text-3xl font-bold text-gray-900">Grading Dashboard</h2>
                    <p className="text-gray-600 mt-1">Grade assignments and track student progress</p>
                </div>
            </div>

            {/* Analytics Overview */}
            {analytics && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                        <div className="text-2xl font-bold text-yellow-600">{analytics.assignmentsNeedingGrading}</div>
                        <div className="text-sm text-gray-600">Need Grading</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                        <div className="text-2xl font-bold text-green-600">{analytics.totalGrades}</div>
                        <div className="text-sm text-gray-600">Total Graded</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                        <div className="text-2xl font-bold text-purple-600">{analytics.averageClassScore}%</div>
                        <div className="text-sm text-gray-600">Class Average</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                        <div className="text-2xl font-bold text-blue-600">{analytics.gradingProgress}%</div>
                        <div className="text-sm text-gray-600">Progress</div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Assignments List */}
                <div className="bg-white rounded-lg border border-gray-200">
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Assignments Needing Grading</h3>
                    </div>
                    <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                        {assignments.map((assignment) => (
                            <div
                                key={assignment.id}
                                onClick={() => setSelectedAssignment(assignment)}
                                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedAssignment?.id === assignment.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                                        <p className="text-sm text-gray-600">{assignment.subject_name}</p>
                                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                            <span>👥 {assignment.total_students} students</span>
                                            <span>✅ {assignment.graded_count} graded</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-medium text-yellow-600">
                                            {assignment.total_students - assignment.graded_count} pending
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {assignments.length === 0 && (
                            <div className="p-8 text-center text-gray-500">
                                <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                                <p>All assignments are graded!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Student Grading */}
                <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200">
                    {selectedAssignment ? (
                        <>
                            <div className="p-4 border-b border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{selectedAssignment.title}</h3>
                                        <p className="text-sm text-gray-600">Max Points: {selectedAssignment.max_points}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-gray-600">Progress</div>
                                        <div className="text-lg font-semibold">
                                            {selectedAssignment.graded_count}/{selectedAssignment.total_students}
                                        </div>
                                    </div>
                                </div>

                                {/* Bulk Grading */}
                                {selectedStudents.size > 0 && (
                                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                                        <h4 className="font-medium text-blue-900 mb-2">
                                            Bulk Grade {selectedStudents.size} Students
                                        </h4>
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="number"
                                                placeholder="Score"
                                                value={bulkGradeScore}
                                                onChange={(e) => setBulkGradeScore(e.target.value)}
                                                className="w-20 px-2 py-1 border border-blue-300 rounded text-sm"
                                                min={0}
                                                max={selectedAssignment.max_points}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Feedback (optional)"
                                                value={bulkGradeFeedback}
                                                onChange={(e) => setBulkGradeFeedback(e.target.value)}
                                                className="flex-1 px-2 py-1 border border-blue-300 rounded text-sm"
                                            />
                                            <button
                                                onClick={handleBulkGrading}
                                                disabled={gradingLoading}
                                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                Grade All
                                            </button>
                                            <button
                                                onClick={() => setSelectedStudents(new Set())}
                                                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Filters */}
                                <div className="flex items-center space-x-4">
                                    <div className="relative flex-1">
                                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search students..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value as 'all' | 'graded' | 'pending')}
                                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="all">All Students</option>
                                        <option value="pending">Pending Grading</option>
                                        <option value="graded">Already Graded</option>
                                    </select>
                                    <button
                                        onClick={selectAllPendingStudents}
                                        className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                    >
                                        Select All Pending
                                    </button>
                                </div>
                            </div>

                            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                                {gradingLoading ? (
                                    <div className="p-8 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                                        <p className="text-gray-600">Loading students...</p>
                                    </div>
                                ) : (
                                    filteredStudents.map((student) => (
                                        <StudentGradingRow
                                            key={student.id}
                                            student={student}
                                            assignment={selectedAssignment}
                                            onGrade={handleGradeStudent}
                                            isSelected={selectedStudents.has(student.id)}
                                            onToggleSelect={() => toggleStudentSelection(student.id)}
                                            disabled={gradingLoading}
                                        />
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            <FileText className="w-8 h-8 mx-auto mb-2" />
                            <p>Select an assignment to start grading</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Activity */}
            {recentActivity.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200">
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Recent Grading Activity</h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {recentActivity.slice(0, 5).map((grade, index) => (
                            <div key={index} className="p-4 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {grade.student_name} - {grade.assignment_title}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {new Date(grade.graded_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className={`px-2 py-1 rounded text-sm font-medium ${getGradeColor(grade.percentage || 0)}`}>
                                    {grade.points_earned}/{grade.assignment_max_points} ({grade.percentage}%)
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Student Grading Row Component
interface StudentGradingRowProps {
    student: GradingStudent;
    assignment: AssignmentWithGrades;
    onGrade: (studentId: number, score: number, feedback?: string) => void;
    isSelected: boolean;
    onToggleSelect: () => void;
    disabled: boolean;
}

const StudentGradingRow: React.FC<StudentGradingRowProps> = ({
    student,
    assignment,
    onGrade,
    isSelected,
    onToggleSelect,
    disabled
}) => {
    const [score, setScore] = useState('');
    const [feedback, setFeedback] = useState('');
    const [showGradeForm, setShowGradeForm] = useState(false);

    const handleSubmitGrade = () => {
        const numScore = parseInt(score);
        if (isNaN(numScore) || numScore < 0 || numScore > assignment.max_points) {
            alert(`Score must be between 0 and ${assignment.max_points}`);
            return;
        }

        onGrade(student.id, numScore, feedback || undefined);
        setScore('');
        setFeedback('');
        setShowGradeForm(false);
    };

    const getGradeDisplay = () => {
        if (!student.current_grade) return null;

        const percentage = gradesAssignmentsService.calculatePercentage(
            student.current_grade.points_earned,
            assignment.max_points
        );

        return (
            <div className={`px-2 py-1 rounded text-sm font-medium ${getGradeColor(percentage)}`}>
                {student.current_grade.points_earned}/{assignment.max_points} ({percentage}%)
            </div>
        );
    };

    const getGradeColor = (percentage: number) => {
        if (percentage >= 90) return 'text-green-600 bg-green-50';
        if (percentage >= 80) return 'text-blue-600 bg-blue-50';
        if (percentage >= 70) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    return (
        <div className="p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    {student.needs_grading && (
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={onToggleSelect}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                    )}
                    <div>
                        <h4 className="font-medium text-gray-900">{student.name}</h4>
                        <p className="text-sm text-gray-600">{student.email}</p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    {student.current_grade ? (
                        <>
                            {getGradeDisplay()}
                            <span className="text-sm text-green-600">✓ Graded</span>
                        </>
                    ) : (
                        <>
                            {showGradeForm ? (
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="number"
                                        placeholder="Score"
                                        value={score}
                                        onChange={(e) => setScore(e.target.value)}
                                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                        min={0}
                                        max={assignment.max_points}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Feedback"
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                    <button
                                        onClick={handleSubmitGrade}
                                        disabled={disabled}
                                        className="px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setShowGradeForm(false)}
                                        className="px-2 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowGradeForm(true)}
                                    disabled={disabled}
                                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Grade
                                </button>
                            )}
                            <span className="text-sm text-yellow-600">⏳ Pending</span>
                        </>
                    )}
                </div>
            </div>

            {student.current_grade?.feedback && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                    <strong>Feedback:</strong> {student.current_grade.feedback}
                </div>
            )}
        </div>
    );
};
