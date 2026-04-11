import React, { useEffect, useMemo, useState } from 'react';
import {
    Users,
    AlertTriangle,
    ClipboardList,
    BarChart3,
    Upload,
    FileText,
    UserPlus,
    Loader2,
    Image,
    Download,
    X
} from 'lucide-react';
import { teacherService } from '../../services/teacherService';

const assignmentUploadImages = [
    {
        id: 'assignment-upload-1',
        title: 'Primary Algebra Foundations',
        src: '/teacher-images/assignment-upload-1.jpeg',
        alt: 'Sample assignment upload image 1',
        downloadName: 'assignment-upload-sample-1.jpeg'
    },
    {
        id: 'assignment-upload-2',
        title: 'Algebra quiz',
        src: '/teacher-images/assignment-upload-2.jpeg',
        alt: 'Sample assignment upload image 2',
        downloadName: 'assignment-upload-sample-2.jpeg'
    }
];

type DetailPanelKey = 'students' | 'attention' | 'todo' | 'performance' | null;

interface TeacherStudent {
    id: number;
    name?: string;
    fname?: string;
    lname?: string;
    user?: {
        fname?: string;
        lname?: string;
        email?: string;
    };
    is_active?: boolean;
}

interface TeacherAssignment {
    id: number;
    title: string;
    subject_id: number;
    subject_name?: string;
    max_points?: number;
    due_date?: string;
    graded_count?: number;
    average_score?: number;
}

interface SubjectWithStudents {
    id: number;
    name: string;
    student_count?: number;
    students?: Array<{ id?: number }>;
}

interface AttentionGradeItem {
    assignmentId: number;
    assignmentTitle: string;
    points: number;
    maxPoints: number;
    percentage: number;
    gradedDate?: string;
}

interface AttentionStudentItem {
    studentId: number;
    studentName: string;
    grades: AttentionGradeItem[];
    lowestPercentage: number;
}

interface TodoItem {
    assignmentId: number;
    assignmentTitle: string;
    subjectName: string;
    dueDate?: string;
    pendingSubmissions: number;
    gradedCount: number;
    expectedCount: number;
}

const getStudentName = (student: TeacherStudent): string => {
    return (
        student.name ||
        `${student.fname || ''} ${student.lname || ''}`.trim() ||
        `${student.user?.fname || ''} ${student.user?.lname || ''}`.trim() ||
        `Student ${student.id}`
    );
};

const formatDate = (iso?: string): string => {
    if (!iso) {
        return 'No due date';
    }
    return new Date(iso).toLocaleDateString();
};

export const TeacherOverview: React.FC = () => {
    const [students, setStudents] = useState<TeacherStudent[]>([]);
    const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
    const [subjectStudentCounts, setSubjectStudentCounts] = useState<Record<number, number>>({});
    const [subjectCountsLoading, setSubjectCountsLoading] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [activePanel, setActivePanel] = useState<DetailPanelKey>(null);

    const [attentionLoading, setAttentionLoading] = useState(false);
    const [attentionLoaded, setAttentionLoaded] = useState(false);
    const [attentionStudents, setAttentionStudents] = useState<AttentionStudentItem[]>([]);
    const [imagesModalOpen, setImagesModalOpen] = useState(false);

    useEffect(() => {
        loadDashboardData();

        const handleClassStudentsChanged = () => {
            loadDashboardData();
        };

        window.addEventListener('classStudentsChanged', handleClassStudentsChanged);
        return () => window.removeEventListener('classStudentsChanged', handleClassStudentsChanged);
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load only essential data first for faster first paint.
            const [studentsResult, assignmentsResult] = await Promise.allSettled([
                teacherService.getMyStudentsAcrossSubjects(),
                teacherService.getMyAssignments()
            ]);

            const rawStudents = studentsResult.status === 'fulfilled' ? (studentsResult.value || []) : [];
            const rawAssignments = assignmentsResult.status === 'fulfilled' ? (assignmentsResult.value || []) : [];

            setStudents(rawStudents as TeacherStudent[]);
            setAssignments(rawAssignments as TeacherAssignment[]);

            // Reset calculated panel data after a fresh dashboard load.
            setAttentionLoaded(false);
            setAttentionStudents([]);
        } catch (err) {
            console.error('Dashboard load failed:', err);
            setError('Failed to load dashboard data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const loadSubjectStudentCounts = async () => {
        try {
            setSubjectCountsLoading(true);
            const subjects = await teacherService.getMySubjectsWithStudents();
            const counts: Record<number, number> = {};

            (subjects as SubjectWithStudents[]).forEach((subject) => {
                const fromCount = typeof subject.student_count === 'number' ? subject.student_count : undefined;
                const fromList = Array.isArray(subject.students) ? subject.students.length : 0;
                counts[subject.id] = fromCount ?? fromList;
            });

            setSubjectStudentCounts(counts);
        } catch (err) {
            console.error('Failed to load subject student counts:', err);
        } finally {
            setSubjectCountsLoading(false);
        }
    };

    const uniqueStudents = useMemo(() => {
        const map = new Map<number, TeacherStudent>();
        students.forEach((student) => {
            if (!map.has(student.id)) {
                map.set(student.id, student);
            }
        });
        return Array.from(map.values());
    }, [students]);

    const studentsById = useMemo(() => {
        const map = new Map<number, TeacherStudent>();
        uniqueStudents.forEach((student) => map.set(student.id, student));
        return map;
    }, [uniqueStudents]);

    const totalStudents = uniqueStudents.length;
    const activeStudents = uniqueStudents.filter((s) => s.is_active !== false).length;

    const classPerformanceAverage = useMemo(() => {
        const gradedAssignments = assignments.filter((a) => Number(a.graded_count || 0) > 0 && typeof a.average_score === 'number');
        if (gradedAssignments.length === 0) {
            return 0;
        }

        let weightedTotal = 0;
        let weightedCount = 0;

        gradedAssignments.forEach((assignment) => {
            const weight = Math.max(assignment.graded_count || 0, 1);
            weightedTotal += (assignment.average_score || 0) * weight;
            weightedCount += weight;
        });

        if (weightedCount === 0) {
            return 0;
        }

        return Math.round((weightedTotal / weightedCount) * 10) / 10;
    }, [assignments]);

    const todoItems = useMemo<TodoItem[]>(() => {
        const items = assignments
            .map((assignment) => {
                const expectedCount = subjectStudentCounts[assignment.subject_id] ?? 0;
                const gradedCount = assignment.graded_count || 0;
                const pending = Math.max(0, expectedCount - gradedCount);

                return {
                    assignmentId: assignment.id,
                    assignmentTitle: assignment.title,
                    subjectName: assignment.subject_name || 'Unknown subject',
                    dueDate: assignment.due_date,
                    pendingSubmissions: pending,
                    gradedCount,
                    expectedCount
                };
            })
            .filter((item) => item.pendingSubmissions > 0);

        return items.sort((a, b) => {
            if (!a.dueDate && !b.dueDate) return b.pendingSubmissions - a.pendingSubmissions;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
    }, [assignments, subjectStudentCounts]);

    const todoCount = todoItems.length;

    const loadAttentionData = async () => {
        if (attentionLoading || attentionLoaded) {
            return;
        }

        try {
            setAttentionLoading(true);

            const assignmentsWithGrades = assignments.filter((a) => Number(a.graded_count || 0) > 0);
            if (assignmentsWithGrades.length === 0) {
                setAttentionStudents([]);
                setAttentionLoaded(true);
                return;
            }

            const gradeResponses = await Promise.allSettled(
                assignmentsWithGrades.map((assignment) => teacherService.getMyAssignmentGrades(assignment.id))
            );

            const attentionMap = new Map<number, AttentionStudentItem>();

            gradeResponses.forEach((response, index) => {
                if (response.status !== 'fulfilled') {
                    return;
                }

                const assignment = assignmentsWithGrades[index];
                const maxPoints = assignment.max_points || 100;

                response.value.forEach((grade: any) => {
                    const safeMax = maxPoints > 0 ? maxPoints : 100;
                    const percentage = Math.round((grade.points_earned / safeMax) * 100);

                    if (percentage >= 50) {
                        return;
                    }

                    const studentId = grade.student_id;
                    const mappedStudent = studentsById.get(studentId);
                    const fallbackName = mappedStudent ? getStudentName(mappedStudent) : `Student ${studentId}`;
                    const studentName = grade.student_name || fallbackName;

                    const gradeItem: AttentionGradeItem = {
                        assignmentId: assignment.id,
                        assignmentTitle: assignment.title,
                        points: grade.points_earned,
                        maxPoints: safeMax,
                        percentage,
                        gradedDate: grade.graded_date
                    };

                    const existing = attentionMap.get(studentId);
                    if (existing) {
                        existing.grades.push(gradeItem);
                        existing.lowestPercentage = Math.min(existing.lowestPercentage, percentage);
                    } else {
                        attentionMap.set(studentId, {
                            studentId,
                            studentName,
                            grades: [gradeItem],
                            lowestPercentage: percentage
                        });
                    }
                });
            });

            const result = Array.from(attentionMap.values())
                .map((student) => ({
                    ...student,
                    grades: student.grades.sort((a, b) => a.percentage - b.percentage)
                }))
                .sort((a, b) => a.lowestPercentage - b.lowestPercentage || a.studentName.localeCompare(b.studentName));

            setAttentionStudents(result);
            setAttentionLoaded(true);
        } catch (err) {
            console.error('Failed to load needs-attention students:', err);
            setAttentionStudents([]);
            setAttentionLoaded(true);
        } finally {
            setAttentionLoading(false);
        }
    };

    const needsAttentionCount = attentionLoaded ? attentionStudents.length : null;

    const togglePanel = async (panel: Exclude<DetailPanelKey, null>) => {
        setActivePanel((previous) => (previous === panel ? null : panel));

        if (panel === 'attention' && !attentionLoaded) {
            await loadAttentionData();
        }

        if (panel === 'todo' && !subjectCountsLoading && Object.keys(subjectStudentCounts).length === 0) {
            await loadSubjectStudentCounts();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                    <p className="text-gray-600 text-sm mt-3">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center max-w-md px-6">
                    <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
                    <p className="text-gray-600 text-sm mb-4">{error}</p>
                    <button
                        onClick={loadDashboardData}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
            <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'upload' }))}
                            className="flex items-center justify-center space-x-3 px-6 py-5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                        >
                            <Upload className="w-5 h-5" />
                            <span className="text-xl font-semibold">Grade with Kana</span>
                        </button>
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'assignments' }))}
                            className="flex items-center justify-center space-x-3 px-6 py-5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                        >
                            <FileText className="w-5 h-5" />
                            <span className="text-xl font-semibold">Create Assignment</span>
                        </button>
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'students' }))}
                            className="flex items-center justify-center space-x-3 px-6 py-5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                        >
                            <UserPlus className="w-5 h-5" />
                            <span className="text-xl font-semibold">Student Profiles</span>
                        </button>
                    </div>

                    {imagesModalOpen && (
                        <div
                            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
                            onClick={() => setImagesModalOpen(false)}
                        >
                            <div
                                className="w-full max-w-5xl bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
                                onClick={(event) => event.stopPropagation()}
                            >
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900">Images</h3>
                                    <button
                                        onClick={() => setImagesModalOpen(false)}
                                        className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                                        aria-label="Close images popup"
                                    >
                                        <X className="w-5 h-5 text-gray-600" />
                                    </button>
                                </div>

                                <div className="p-6 max-h-[80vh] overflow-y-auto">
                                    <p className="text-sm text-gray-700 mb-4">
                                        These images are for uploading for the assignments.
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {assignmentUploadImages.map((image) => (
                                            <div key={image.id} className="border border-gray-200 rounded-lg p-3">
                                                <div className="relative">
                                                    <img
                                                        src={image.src}
                                                        alt={image.alt}
                                                        className="w-full h-64 object-cover rounded-md border border-gray-100"
                                                    />
                                                    <div className="absolute top-0 left-0 right-0 px-3 py-2 bg-white/95 border-b border-gray-200 rounded-t-md">
                                                        <p className="text-sm font-semibold text-gray-900">{image.title}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-3">
                                                    <a
                                                        href={image.src}
                                                        download={image.downloadName}
                                                        className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                        Download
                                                    </a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        <button
                            onClick={() => togglePanel('students')}
                            className={`text-left bg-white p-6 rounded-xl border shadow-sm transition-all ${activePanel === 'students' ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-200 hover:shadow-md'}`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-2">Total Students</p>
                                    <p className="text-4xl font-bold text-gray-900">{totalStudents}</p>
                                    <p className="text-sm text-green-600 mt-2">{activeStudents} active</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <Users className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={() => togglePanel('attention')}
                            className={`text-left bg-white p-6 rounded-xl border shadow-sm transition-all ${activePanel === 'attention' ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-200 hover:shadow-md'}`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-2">Need Attention</p>
                                    <p className="text-4xl font-bold text-gray-900">{needsAttentionCount === null ? '-' : needsAttentionCount}</p>
                                    <p className="text-sm text-amber-600 mt-2">Below 50% in any assignment</p>
                                </div>
                                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={() => togglePanel('todo')}
                            className={`text-left bg-white p-6 rounded-xl border shadow-sm transition-all ${activePanel === 'todo' ? 'border-amber-300 ring-2 ring-amber-100' : 'border-gray-200 hover:shadow-md'}`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-2">Teacher Todo</p>
                                    <p className="text-4xl font-bold text-gray-900">{subjectCountsLoading ? '-' : todoCount}</p>
                                    <p className="text-sm text-amber-600 mt-2">Assignments pending grading</p>
                                </div>
                                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                                    <ClipboardList className="w-6 h-6 text-amber-600" />
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={() => togglePanel('performance')}
                            className={`text-left bg-white p-6 rounded-xl border shadow-sm transition-all ${activePanel === 'performance' ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-gray-200 hover:shadow-md'}`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-2">Class Performance</p>
                                    <p className="text-4xl font-bold text-gray-900">{classPerformanceAverage}%</p>
                                    <p className="text-sm text-emerald-600 mt-2">Average across graded work</p>
                                </div>
                                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                    <BarChart3 className="w-6 h-6 text-emerald-600" />
                                </div>
                            </div>
                        </button>
                    </div>

                    <div className="flex justify-center">
                        <button
                            onClick={() => setImagesModalOpen(true)}
                            className="flex items-center justify-center gap-3 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                        >
                            <Image className="w-5 h-5" />
                            <span className="text-lg font-semibold">Images</span>
                        </button>
                    </div>

                    {activePanel === 'students' && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                            <div className="p-6 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">Your Students</h3>
                                <p className="text-sm text-gray-600">Students linked to your subjects</p>
                            </div>
                            <div className="p-6">
                                {uniqueStudents.length === 0 ? (
                                    <p className="text-sm text-gray-600">No students found.</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                        {uniqueStudents.map((student) => (
                                            <div key={student.id} className="border border-gray-200 rounded-lg px-4 py-3">
                                                <p className="font-medium text-gray-900">{getStudentName(student)}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activePanel === 'attention' && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                            <div className="p-6 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">Students Needing Attention</h3>
                                <p className="text-sm text-gray-600">Real grades below 50% in at least one assignment</p>
                            </div>
                            <div className="p-6">
                                {attentionLoading ? (
                                    <div className="text-center py-8 text-gray-600">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Loading attention list...
                                    </div>
                                ) : attentionStudents.length === 0 ? (
                                    <p className="text-sm text-gray-600">No students currently below 50%.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {attentionStudents.map((student) => (
                                            <div key={student.studentId} className="border border-red-100 rounded-lg p-4 bg-red-50/40">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-semibold text-gray-900">{student.studentName}</p>
                                                    <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
                                                        Lowest {student.lowestPercentage}%
                                                    </span>
                                                </div>
                                                <div className="mt-3 space-y-2">
                                                    {student.grades.map((grade) => (
                                                        <div key={`${student.studentId}-${grade.assignmentId}-${grade.gradedDate || ''}`} className="text-sm text-gray-700 flex flex-wrap gap-x-4 gap-y-1">
                                                            <span className="font-medium">{grade.assignmentTitle}</span>
                                                            <span>{grade.points}/{grade.maxPoints}</span>
                                                            <span className="text-red-700">{grade.percentage}%</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activePanel === 'todo' && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                            <div className="p-6 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">Teacher Todo</h3>
                                <p className="text-sm text-gray-600">Assignments that still need grading</p>
                            </div>
                            <div className="p-6">
                                {subjectCountsLoading ? (
                                    <div className="text-center py-8 text-gray-600">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Loading todo items...
                                    </div>
                                ) : todoItems.length === 0 ? (
                                    <p className="text-sm text-gray-600">No pending grading tasks right now.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {todoItems.map((item) => (
                                            <div key={item.assignmentId} className="border border-amber-100 rounded-lg p-4 bg-amber-50/40">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <p className="font-semibold text-gray-900">{item.assignmentTitle}</p>
                                                    <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                                                        {item.pendingSubmissions} pending
                                                    </span>
                                                </div>
                                                <div className="mt-2 text-sm text-gray-600 flex flex-wrap gap-4">
                                                    <span>{item.subjectName}</span>
                                                    <span>Graded {item.gradedCount}/{item.expectedCount}</span>
                                                    <span>Due {formatDate(item.dueDate)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activePanel === 'performance' && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                            <div className="p-6 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">Class Performance</h3>
                                <p className="text-sm text-gray-600">Average score from graded assignments</p>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {assignments
                                        .filter((assignment) => Number(assignment.graded_count || 0) > 0)
                                        .sort((a, b) => (b.average_score || 0) - (a.average_score || 0))
                                        .map((assignment) => (
                                            <div key={assignment.id} className="border border-emerald-100 rounded-lg p-4 bg-emerald-50/40">
                                                <p className="font-semibold text-gray-900">{assignment.title}</p>
                                                <p className="text-sm text-gray-600 mt-1">{assignment.subject_name || 'Unknown subject'}</p>
                                                <p className="text-sm text-emerald-700 mt-2">
                                                    Average {Math.round((assignment.average_score || 0) * 10) / 10}%
                                                </p>
                                            </div>
                                        ))}
                                </div>
                                {assignments.filter((assignment) => Number(assignment.graded_count || 0) > 0).length === 0 && (
                                    <p className="text-sm text-gray-600">No graded assignments yet.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
