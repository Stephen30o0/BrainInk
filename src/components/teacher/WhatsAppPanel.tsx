import React, { useState, useEffect } from 'react';
import {
    MessageSquare,
    QrCode,
    Users,
    CheckCircle,
    Clock,
    Copy,
    RefreshCw,
    Trash2,
    Loader2,
    AlertCircle,
    Smartphone,
    FileText
} from 'lucide-react';
import { teacherService } from '../../services/teacherService';

interface WhatsAppCode {
    id: number;
    student_id: number;
    student_name?: string;
    registration_code: string;
    phone_number: string | null;
    registered_at: string | null;
    is_active: boolean;
}

interface WhatsAppSubmission {
    id: number;
    student_id: number;
    student_name?: string;
    assignment_id: number;
    assignment_title?: string;
    grade_id: number | null;
    phone_number: string;
    image_count: number;
    ai_score: number | null;
    ai_confidence: number | null;
    status: string;
    submitted_at: string;
    graded_at: string | null;
}

interface Subject {
    id: number;
    name: string;
    student_count?: number;
    students?: { id: number; name: string }[];
}

export const WhatsAppPanel: React.FC = () => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
    const [codes, setCodes] = useState<WhatsAppCode[]>([]);
    const [submissions, setSubmissions] = useState<WhatsAppSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [_error, setError] = useState<string | null>(null);
    const [activeView, setActiveView] = useState<'codes' | 'submissions'>('codes');
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    useEffect(() => {
        loadSubjects();
    }, []);

    useEffect(() => {
        if (selectedSubject) {
            loadCodes(selectedSubject);
        }
    }, [selectedSubject]);

    const loadSubjects = async () => {
        try {
            setLoading(true);
            const data = await teacherService.getMySubjects();
            setSubjects(data as any);
            if (data.length > 0) {
                setSelectedSubject(data[0].id);
            }
        } catch (err) {
            console.error('Failed to load subjects:', err);
            setError('Failed to load subjects.');
        } finally {
            setLoading(false);
        }
    };

    const loadCodes = async (subjectId: number) => {
        try {
            setLoading(true);
            const data = await teacherService.getWhatsAppCodes(subjectId);
            setCodes(data);
        } catch (err) {
            console.error('Failed to load WhatsApp codes:', err);
            setCodes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleViewToggle = (view: 'codes' | 'submissions') => {
        setActiveView(view);
        // Auto-load all submissions when switching to submissions view
        if (view === 'submissions' && selectedSubject) {
            loadAllSubmissions();
        }
    };

    const loadAllSubmissions = async () => {
        // Load submissions across all assignments for the selected subject
        try {
            const assignments = await teacherService.getMyAssignments();
            const allSubmissions: WhatsAppSubmission[] = [];
            for (const assignment of assignments.slice(0, 10)) {
                const subs = await teacherService.getWhatsAppSubmissions(assignment.id);
                allSubmissions.push(...subs);
            }
            setSubmissions(allSubmissions);
        } catch (err) {
            console.error('Failed to load submissions:', err);
        }
    };

    const handleGenerateCodes = async () => {
        if (!selectedSubject) return;

        try {
            setGenerating(true);
            // Get students in this subject
            const students = await teacherService.getStudentsInSubject(selectedSubject);
            const studentIds = students.map((s: any) => s.id);

            if (studentIds.length === 0) {
                alert('No students enrolled in this subject.');
                return;
            }

            const newCodes = await teacherService.generateWhatsAppCodes(selectedSubject, studentIds);
            setCodes(newCodes);
        } catch (err) {
            console.error('Failed to generate codes:', err);
            alert('Failed to generate codes. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    const handleRevokeCode = async (codeId: number) => {
        if (!confirm('Revoke this code? The student will no longer be able to submit via WhatsApp.')) return;

        try {
            await teacherService.revokeWhatsAppCode(codeId);
            setCodes(prev => prev.map(c => c.id === codeId ? { ...c, is_active: false } : c));
        } catch (err) {
            console.error('Failed to revoke code:', err);
            alert('Failed to revoke code.');
        }
    };

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const handleCopyAllCodes = () => {
        const activeCodes = codes.filter(c => c.is_active && !c.phone_number);
        const text = activeCodes.map(c => `${c.student_name || `Student #${c.student_id}`}: ${c.registration_code}`).join('\n');
        navigator.clipboard.writeText(text);
        alert(`${activeCodes.length} unclaimed codes copied to clipboard!`);
    };

    const claimedCount = codes.filter(c => c.phone_number).length;
    const unclaimedCount = codes.filter(c => !c.phone_number && c.is_active).length;
    const revokedCount = codes.filter(c => !c.is_active).length;

    if (loading && subjects.length === 0) {
        return (
            <div className="p-6 flex items-center justify-center py-12">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading WhatsApp panel...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <MessageSquare className="w-8 h-8 text-green-600" />
                        WhatsApp Submissions
                    </h2>
                    <p className="text-gray-600 mt-1">
                        Manage student WhatsApp registration and view submissions
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                    <div className="text-2xl font-bold text-green-600">{claimedCount}</div>
                    <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                        <Smartphone className="w-3 h-3" /> Linked Phones
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{unclaimedCount}</div>
                    <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                        <QrCode className="w-3 h-3" /> Unclaimed Codes
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                    <div className="text-2xl font-bold text-blue-600">{codes.length}</div>
                    <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                        <Users className="w-3 h-3" /> Total Codes
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                    <div className="text-2xl font-bold text-red-600">{revokedCount}</div>
                    <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Revoked
                    </div>
                </div>
            </div>

            {/* Subject Selector + Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700">Subject:</label>
                        <select
                            value={selectedSubject || ''}
                            onChange={(e) => setSelectedSubject(parseInt(e.target.value))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            {subjects.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleGenerateCodes}
                            disabled={generating || !selectedSubject}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                            {generating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <QrCode className="w-4 h-4" />
                            )}
                            Generate Codes
                        </button>
                        {codes.length > 0 && (
                            <button
                                onClick={handleCopyAllCodes}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                <Copy className="w-4 h-4" />
                                Copy Unclaimed
                            </button>
                        )}
                        <button
                            onClick={() => selectedSubject && loadCodes(selectedSubject)}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* View Toggle */}
            <div className="flex gap-2">
                <button
                    onClick={() => handleViewToggle('codes')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeView === 'codes'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    Registration Codes
                </button>
                <button
                    onClick={() => handleViewToggle('submissions')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeView === 'submissions'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    Recent Submissions
                </button>
            </div>

            {/* Codes Table */}
            {activeView === 'codes' && (
                <div className="bg-white rounded-lg border border-gray-200">
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Registration Codes</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Share these codes with students so they can link their WhatsApp number
                        </p>
                    </div>
                    {codes.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <QrCode className="w-8 h-8 mx-auto mb-2" />
                            <p>No codes generated yet. Click "Generate Codes" to create codes for students.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {codes.map(code => (
                                        <tr key={code.id} className={!code.is_active ? 'opacity-50' : ''}>
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {code.student_name || `Student #${code.student_id}`}
                                            </td>
                                            <td className="px-4 py-3">
                                                <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono font-bold">
                                                    {code.registration_code}
                                                </code>
                                            </td>
                                            <td className="px-4 py-3">
                                                {!code.is_active ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                                        Revoked
                                                    </span>
                                                ) : code.phone_number ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                                        <CheckCircle className="w-3 h-3" /> Claimed
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                                        <Clock className="w-3 h-3" /> Unclaimed
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {code.phone_number || '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleCopyCode(code.registration_code)}
                                                        className="p-1 text-gray-400 hover:text-gray-600"
                                                        title="Copy code"
                                                    >
                                                        {copiedCode === code.registration_code ? (
                                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                                        ) : (
                                                            <Copy className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                    {code.is_active && (
                                                        <button
                                                            onClick={() => handleRevokeCode(code.id)}
                                                            className="p-1 text-gray-400 hover:text-red-600"
                                                            title="Revoke code"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Submissions View */}
            {activeView === 'submissions' && (
                <div className="bg-white rounded-lg border border-gray-200">
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Recent WhatsApp Submissions</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Assignments submitted by students via WhatsApp
                        </p>
                    </div>
                    {submissions.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <FileText className="w-8 h-8 mx-auto mb-2" />
                            <p>No WhatsApp submissions yet.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {submissions.map(sub => (
                                <div key={sub.id} className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${sub.status === 'graded'
                                                ? 'bg-green-100'
                                                : sub.status === 'failed'
                                                    ? 'bg-red-100'
                                                    : 'bg-yellow-100'
                                            }`}>
                                            <MessageSquare className={`w-4 h-4 ${sub.status === 'graded'
                                                    ? 'text-green-600'
                                                    : sub.status === 'failed'
                                                        ? 'text-red-600'
                                                        : 'text-yellow-600'
                                                }`} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {sub.student_name || `Student #${sub.student_id}`}
                                                {sub.assignment_title && ` — ${sub.assignment_title}`}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {sub.image_count} photo{sub.image_count !== 1 ? 's' : ''} ·{' '}
                                                {new Date(sub.submitted_at).toLocaleDateString()} ·{' '}
                                                via WhatsApp
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {sub.ai_score !== null && (
                                            <div className="text-sm">
                                                <span className="font-medium">{sub.ai_score}</span>
                                                {sub.ai_confidence !== null && (
                                                    <span className="text-gray-500 ml-1">
                                                        ({Math.round(sub.ai_confidence)}% confidence)
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${sub.status === 'graded'
                                                ? 'bg-green-100 text-green-800'
                                                : sub.status === 'failed'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {sub.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Setup Instructions */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">How Student WhatsApp Submission Works</h4>
                <ol className="text-sm text-green-800 space-y-1 list-decimal list-inside">
                    <li>Generate registration codes for your students above</li>
                    <li>Share each student's code with them (in class or via email)</li>
                    <li>Students message the BrainInk WhatsApp number and enter their code</li>
                    <li>Once linked, students can text the bot to see open assignments</li>
                    <li>Students send photos of their work and type "done" to submit</li>
                    <li>K.A.N.A. AI grades the submission and results appear on your Grading Dashboard</li>
                </ol>
            </div>
        </div>
    );
};
