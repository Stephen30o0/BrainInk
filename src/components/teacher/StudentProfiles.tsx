import React, { useEffect, useMemo, useState } from 'react';
import {
    Send,
    TrendingUp,
    TrendingDown,
    Brain,
    Calendar,
    Target,
    Loader2,
    AlertTriangle,
    Users,
    Filter,
    Search,
    RefreshCw,
    BookOpen,
    Award,
    Mail
} from 'lucide-react';
import { teacherService, type Student } from '../../services/teacherService';

interface StudentGrade {
    id: string;
    assignmentTitle: string;
    score: number;
    maxPoints: number;
    percentage: number;
    feedback?: string;
    gradedAt?: string;
    gradedBy?: string;
}

interface SubjectSummary {
    name: string;
    studentsCount: number;
}

export const StudentProfiles: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'excellent' | 'good' | 'needs_attention' | 'struggling'>('all');
    const [sortBy, setSortBy] = useState<'name' | 'score' | 'status'>('name');
    const [showImprovementPlan, setShowImprovementPlan] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([]);
    const [loadingGrades, setLoadingGrades] = useState(false);

    const getOverallGrade = (student: Student): number => {
        const xp = student.stats?.total_xp ?? student.progress?.total_xp ?? student.totalXP ?? 0;
        return Math.min(100, Math.max(0, Math.round(xp / 20)));
    };

    const getStudentStatus = (student: Student): 'excellent' | 'good' | 'needs_attention' | 'struggling' => {
        const score = getOverallGrade(student);
        if (score >= 90) return 'excellent';
        if (score >= 80) return 'good';
        if (score >= 65) return 'needs_attention';
        return 'struggling';
    };

    const getStudentTrend = (student: Student): 'up' | 'down' | 'stable' => {
        const streak = student.progress?.login_streak ?? 0;
        if (streak >= 7) return 'up';
        if (streak <= 1) return 'down';
        return 'stable';
    };

    const loadStudents = async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await teacherService.getAllStudents();
            setStudents(data);

            if (data.length > 0 && !selectedStudentId) {
                setSelectedStudentId(data[0].id.toString());
            }
        } catch (err) {
            console.error('Failed to load students:', err);
            setError('Failed to load class and student data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const loadStudentGrades = async (studentId: string) => {
        try {
            setLoadingGrades(true);

            const assignments = await teacherService.getMyAssignments();
            if (!assignments || assignments.length === 0) {
                setStudentGrades([]);
                return;
            }

            const gradesPerAssignment = await Promise.all(
                assignments.map(async (assignment: any) => {
                    const assignmentId = Number(assignment.id);
                    if (!Number.isFinite(assignmentId)) {
                        return [] as any[];
                    }
                    const grades = await teacherService.getMyAssignmentGrades(assignmentId);
                    return grades.map((grade) => ({ grade, assignment }));
                })
            );

            const merged = gradesPerAssignment
                .flat()
                .filter(({ grade }) => Number(grade.student_id) === Number(studentId))
                .map(({ grade, assignment }): StudentGrade => {
                    const score = Number(grade.score ?? grade.points_earned ?? 0);
                    const maxPoints = Number(grade.max_points ?? assignment.max_points ?? assignment.maxPoints ?? 0);
                    const safeMax = maxPoints > 0 ? maxPoints : 1;

                    return {
                        id: `${assignment.id}-${grade.id}`,
                        assignmentTitle: assignment.title || grade.assignment?.title || `Assignment ${assignment.id}`,
                        score,
                        maxPoints: safeMax,
                        percentage: Math.round((score / safeMax) * 100),
                        feedback: grade.feedback || undefined,
                        gradedAt: grade.graded_date || grade.gradedAt || assignment.created_date,
                        gradedBy: grade.graded_by ? `Teacher #${grade.graded_by}` : 'Teacher'
                    };
                })
                .sort((a, b) => {
                    const aDate = a.gradedAt ? new Date(a.gradedAt).getTime() : 0;
                    const bDate = b.gradedAt ? new Date(b.gradedAt).getTime() : 0;
                    return bDate - aDate;
                });

            setStudentGrades(merged);
        } catch (err) {
            console.error('Failed to load student grades:', err);
            setStudentGrades([]);
        } finally {
            setLoadingGrades(false);
        }
    };

    useEffect(() => {
        loadStudents();

        const handleClassStudentsChanged = () => {
            setTimeout(() => {
                loadStudents();
            }, 500);
        };

        const handleGradesUpdated = () => {
            loadStudents();
            if (selectedStudentId) {
                loadStudentGrades(selectedStudentId);
            }
        };

        window.addEventListener('classStudentsChanged', handleClassStudentsChanged as EventListener);
        window.addEventListener('studentGradesUpdated', handleGradesUpdated as EventListener);

        return () => {
            window.removeEventListener('classStudentsChanged', handleClassStudentsChanged as EventListener);
            window.removeEventListener('studentGradesUpdated', handleGradesUpdated as EventListener);
        };
    }, [selectedStudentId]);

    useEffect(() => {
        if (selectedStudentId) {
            loadStudentGrades(selectedStudentId);
        }
    }, [selectedStudentId]);

    const filteredStudents = useMemo(() => {
        return students
            .filter((student) => {
                const fullName = `${student.fname} ${student.lname}`.toLowerCase();
                const matchesSearch = fullName.includes(searchTerm.toLowerCase());
                const matchesFilter = filterStatus === 'all' || getStudentStatus(student) === filterStatus;
                return matchesSearch && matchesFilter;
            })
            .sort((a, b) => {
                if (sortBy === 'score') {
                    return getOverallGrade(b) - getOverallGrade(a);
                }
                if (sortBy === 'status') {
                    const statusOrder = { excellent: 0, good: 1, needs_attention: 2, struggling: 3 };
                    return statusOrder[getStudentStatus(a)] - statusOrder[getStudentStatus(b)];
                }
                return `${a.fname} ${a.lname}`.localeCompare(`${b.fname} ${b.lname}`);
            });
    }, [students, searchTerm, filterStatus, sortBy]);

    const selectedStudent = useMemo(
        () => students.find((student) => student.id.toString() === selectedStudentId),
        [students, selectedStudentId]
    );

    const classStats = useMemo(() => {
        const total = students.length;
        const excellent = students.filter((student) => getStudentStatus(student) === 'excellent').length;
        const good = students.filter((student) => getStudentStatus(student) === 'good').length;
        const needsAttention = students.filter((student) => getStudentStatus(student) === 'needs_attention').length;
        const struggling = students.filter((student) => getStudentStatus(student) === 'struggling').length;
        const averageScore = total > 0 ? Math.round(students.reduce((sum, student) => sum + getOverallGrade(student), 0) / total) : 0;

        return { total, excellent, good, needsAttention, struggling, averageScore };
    }, [students]);

    const subjectSummaries = useMemo(() => {
        const counts: Record<string, number> = {};
        students.forEach((student) => {
            (student.currentSubjects || []).forEach((subject) => {
                counts[subject] = (counts[subject] || 0) + 1;
            });
        });

        return Object.entries(counts)
            .map(([name, studentsCount]) => ({ name, studentsCount } as SubjectSummary))
            .sort((a, b) => b.studentsCount - a.studentsCount)
            .slice(0, 6);
    }, [students]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
            case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'needs_attention': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'struggling': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
        if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-600" />;
        if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-600" />;
        return <div className="w-4 h-4 rounded-full bg-gray-400" />;
    };

    const handleSendMessage = () => {
        if (selectedStudent) {
            console.log('Send message to:', `${selectedStudent.fname} ${selectedStudent.lname}`);
        }
    };

    if (loading) {
        return (
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Loading class and student data...</p>
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
                        <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-4" />
                        <p className="text-red-600 mb-4">{error}</p>
                        <button
                            onClick={loadStudents}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!selectedStudent) {
        return (
            <div className="p-6 space-y-6">
                <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                    <p className="text-gray-600">Add students to your class to view combined insights.</p>
                </div>
            </div>
        );
    }

    const selectedStatus = getStudentStatus(selectedStudent);
    const selectedTrend = getStudentTrend(selectedStudent);
    const selectedGrade = getOverallGrade(selectedStudent);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Class & Student Profiles</h2>
                    <p className="text-gray-600 mt-1">Unified class overview and per-student performance using live teacher data</p>
                </div>
                <button
                    onClick={loadStudents}
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Refresh data"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                    <div className="text-2xl font-bold text-gray-900">{classStats.total}</div>
                    <div className="text-sm text-gray-600">Total Students</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                    <div className="text-2xl font-bold text-green-600">{classStats.excellent}</div>
                    <div className="text-sm text-gray-600">Excellent</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                    <div className="text-2xl font-bold text-blue-600">{classStats.good}</div>
                    <div className="text-sm text-gray-600">Good</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{classStats.needsAttention}</div>
                    <div className="text-sm text-gray-600">Needs Attention</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                    <div className="text-2xl font-bold text-red-600">{classStats.struggling}</div>
                    <div className="text-sm text-gray-600">Struggling</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                    <div className="text-2xl font-bold text-purple-600">{classStats.averageScore}%</div>
                    <div className="text-sm text-gray-600">Class Average</div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative flex-1">
                        <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'excellent' | 'good' | 'needs_attention' | 'struggling')}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Students</option>
                            <option value="excellent">Excellent</option>
                            <option value="good">Good</option>
                            <option value="needs_attention">Needs Attention</option>
                            <option value="struggling">Struggling</option>
                        </select>
                    </div>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'name' | 'score' | 'status')}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="name">Sort by Name</option>
                        <option value="score">Sort by Score</option>
                        <option value="status">Sort by Status</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Students</h3>
                        <div className="space-y-2 max-h-[32rem] overflow-y-auto">
                            {filteredStudents.map((student) => {
                                const status = getStudentStatus(student);
                                const grade = getOverallGrade(student);

                                return (
                                    <button
                                        key={student.id}
                                        onClick={() => setSelectedStudentId(student.id.toString())}
                                        className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedStudentId === student.id.toString()
                                            ? 'border-blue-200 bg-blue-50 text-blue-900'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <span className="text-2xl">{student.avatar || '👨‍🎓'}</span>
                                            <div>
                                                <p className="font-medium">{student.fname} {student.lname}</p>
                                                <p className="text-sm text-gray-600">{grade}% avg</p>
                                            </div>
                                        </div>
                                        <div className="mt-2">
                                            <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full border ${getStatusColor(status)}`}>
                                                {status.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}

                            {filteredStudents.length === 0 && (
                                <p className="text-sm text-gray-500">No students match your filters.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Subject Coverage</h3>
                        {subjectSummaries.length === 0 ? (
                            <p className="text-sm text-gray-500">No subject assignments found.</p>
                        ) : (
                            <div className="space-y-2">
                                {subjectSummaries.map((subject) => (
                                    <div key={subject.name} className="flex items-center justify-between text-sm bg-gray-50 px-3 py-2 rounded-lg">
                                        <span className="font-medium text-gray-800">{subject.name}</span>
                                        <span className="text-gray-600">{subject.studentsCount} student{subject.studentsCount !== 1 ? 's' : ''}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <span className="text-4xl">{selectedStudent.avatar || '👨‍🎓'}</span>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">{selectedStudent.fname} {selectedStudent.lname}</h3>
                                    <p className="text-gray-600">{selectedStudent.email || selectedStudent.username}</p>
                                    <div className="flex items-center space-x-4 mt-2">
                                        <span className="flex items-center text-sm text-gray-600">
                                            <Calendar className="w-4 h-4 mr-1" />
                                            Last Active: {selectedStudent.lastActive || 'N/A'}
                                        </span>
                                        <span className="text-2xl font-bold text-blue-600">{selectedGrade}%</span>
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(selectedStatus)}`}>
                                            {selectedStatus.replace('_', ' ').toUpperCase()}
                                        </span>
                                        {getTrendIcon(selectedTrend)}
                                    </div>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={handleSendMessage}
                                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    Message
                                </button>
                                <button
                                    onClick={() => setShowImprovementPlan(true)}
                                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    <Target className="w-4 h-4 mr-2" />
                                    Improvement Plan
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Current Subjects</h4>
                        {selectedStudent.currentSubjects && selectedStudent.currentSubjects.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {selectedStudent.currentSubjects.map((subject) => (
                                    <span key={subject} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-800 border border-blue-200">
                                        <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                                        {subject}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">No subjects assigned.</p>
                        )}
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-gray-900">Graded Assignments</h4>
                            {loadingGrades && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
                        </div>

                        {studentGrades.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p>No graded assignments found for this student.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {studentGrades.map((grade) => (
                                    <div key={grade.id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h5 className="font-medium text-gray-900">{grade.assignmentTitle}</h5>
                                            <div className="flex items-center space-x-2">
                                                <span className={`text-lg font-bold ${(grade.score / grade.maxPoints) >= 0.9 ? 'text-green-600' :
                                                    (grade.score / grade.maxPoints) >= 0.8 ? 'text-blue-600' :
                                                        (grade.score / grade.maxPoints) >= 0.7 ? 'text-yellow-600' :
                                                            'text-red-600'
                                                    }`}>
                                                    {grade.score}/{grade.maxPoints}
                                                </span>
                                                <span className="text-sm text-gray-500">({grade.percentage}%)</span>
                                            </div>
                                        </div>

                                        <div className="text-sm text-gray-600 mb-2">
                                            Graded by {grade.gradedBy || 'Teacher'}
                                            {grade.gradedAt ? ` on ${new Date(grade.gradedAt).toLocaleDateString()}` : ''}
                                        </div>

                                        {grade.feedback && (
                                            <div className="bg-blue-50 p-3 rounded-lg text-sm text-gray-700">
                                                {grade.feedback.length > 180 ? `${grade.feedback.substring(0, 180)}...` : grade.feedback}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">K.A.N.A. Data Insights</h4>
                        <div className="space-y-3">
                            {(selectedStudent.strengths && selectedStudent.strengths.length > 0) && (
                                <div className="p-4 rounded-lg border border-green-200 bg-green-50 text-green-800">
                                    <div className="flex items-start space-x-3">
                                        <TrendingUp className="w-4 h-4 mt-0.5" />
                                        <div>
                                            <p className="font-medium">Strengths</p>
                                            <p className="text-sm mt-1">{selectedStudent.strengths.join(', ')}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {(selectedStudent.weaknesses && selectedStudent.weaknesses.length > 0) && (
                                <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-800">
                                    <div className="flex items-start space-x-3">
                                        <AlertTriangle className="w-4 h-4 mt-0.5" />
                                        <div>
                                            <p className="font-medium">Areas to Improve</p>
                                            <p className="text-sm mt-1">{selectedStudent.weaknesses.join(', ')}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="p-4 rounded-lg border border-blue-200 bg-blue-50 text-blue-800">
                                <div className="flex items-start space-x-3">
                                    <Brain className="w-4 h-4 mt-0.5" />
                                    <div>
                                        <p className="font-medium">Learning Style</p>
                                        <p className="text-sm mt-1">{selectedStudent.learningStyle || 'Not available'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h4>
                        {selectedStudent.recentActivity && selectedStudent.recentActivity.length > 0 ? (
                            <div className="space-y-3">
                                {selectedStudent.recentActivity.map((activity, index) => (
                                    <div key={`${activity.id}-${index}`} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-900">{activity.title}</p>
                                            <p className="text-sm text-gray-600">{activity.subject || 'General'} • {new Date(activity.timestamp).toLocaleDateString()}</p>
                                        </div>
                                        {typeof activity.score === 'number' && (
                                            <span className="font-medium text-blue-600">{activity.score}%</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">No recent activity found.</p>
                        )}
                    </div>
                </div>
            </div>

            {showImprovementPlan && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Improvement Plan for {selectedStudent.fname} {selectedStudent.lname}
                        </h3>

                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <h4 className="font-medium text-blue-900 flex items-center">
                                    <Award className="w-4 h-4 mr-2" />
                                    Current Overall Score: {selectedGrade}%
                                </h4>
                                <p className="text-sm text-blue-700 mt-1">Learning style: {selectedStudent.learningStyle || 'Not available'}</p>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Focus Areas</h4>
                                {selectedStudent.weaknesses && selectedStudent.weaknesses.length > 0 ? (
                                    <ul className="space-y-2">
                                        {selectedStudent.weaknesses.map((weakness) => (
                                            <li key={weakness} className="flex items-center space-x-2 text-sm text-gray-700">
                                                <Target className="w-4 h-4 text-amber-600" />
                                                <span>{weakness}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-500">No specific weakness data available yet.</p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowImprovementPlan(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleSendMessage}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                            >
                                <Mail className="w-4 h-4 mr-2" />
                                Send to Student
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
