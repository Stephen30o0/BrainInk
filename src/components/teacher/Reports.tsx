import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    AlertCircle,
    BarChart3,
    BookOpen,
    Brain,
    CheckCircle,
    Clock,
    Download,
    Eye,
    FileText,
    Filter,
    GraduationCap,
    Pencil,
    Plus,
    RefreshCw,
    Settings,
    Trash2,
    TrendingUp,
    Users,
    XCircle,
} from 'lucide-react';
import { reportsService } from '@/services/reportsService';
import { teacherService } from '@/services/teacherService';

// Types
interface Report {
    id: number;
    title: string;
    description?: string;
    report_type: string;
    status: 'pending' | 'generating' | 'completed' | 'failed' | 'expired';
    format: 'pdf' | 'excel' | 'csv' | 'json';
    requested_date: string;
    generated_date?: string;
    file_name?: string;
    file_size?: number;
    access_count: number;
    is_public: boolean;
}

interface ReportTemplate {
    id: number;
    name: string;
    description?: string;
    report_type: string;
    is_active: boolean;
    is_default: boolean;
    created_date: string;
    updated_date?: string;
    template_config?: string;
    school_id?: number;
    created_by?: number;
}

interface ReportAnalytics {
    total_reports: number;
    reports_by_type: Record<string, number>;
    reports_by_status: Record<string, number>;
    reports_by_format: Record<string, number>;
    success_rate: number;
    storage_used: number;
}

const Reports: React.FC = () => {
    const [reports, setReports] = useState<Report[]>([]);
    const [templates, setTemplates] = useState<ReportTemplate[]>([]);
    const [analytics, setAnalytics] = useState<ReportAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
    const [students, setStudents] = useState<any[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);
    const [extracting, setExtracting] = useState(false);
    const [extractedData, setExtractedData] = useState<any>(null);
    // Template view/edit states
    const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
    const [isTemplateViewOpen, setIsTemplateViewOpen] = useState(false);
    const [editTemplateForm, setEditTemplateForm] = useState<Partial<ReportTemplate & { template_config: string }>>({});
    const viewFileInputRef = React.useRef<HTMLInputElement | null>(null);
    const [reExtracting, setReExtracting] = useState(false);
    // Report detail state
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    // Scroll/copy refs
    const templateJsonRef = React.useRef<HTMLTextAreaElement | null>(null);
    const templatePreviewRef = React.useRef<HTMLPreElement | null>(null);
    const reportParamsRef = React.useRef<HTMLPreElement | null>(null);
    const reportSummaryRef = React.useRef<HTMLPreElement | null>(null);
    const reportDataRef = React.useRef<HTMLPreElement | null>(null);

    // Helper: pretty-print JSON or return string, for teacher-friendly readability
    const toPretty = (value: any): string => {
        if (value === null || value === undefined || value === '') return '-';
        try {
            const maybeObj = typeof value === 'string' ? JSON.parse(value) : value;
            if (typeof maybeObj === 'string') return maybeObj;
            return JSON.stringify(maybeObj, null, 2);
        } catch {
            try {
                // Last resort: stringify non-JSON values
                return String(value);
            } catch {
                return '-';
            }
        }
    };

    // Report generation form state
    const [generateForm, setGenerateForm] = useState({
        title: '',
        report_type: '',
        template_id: '',
        subject_id: '',
        classroom_id: '',
        student_id: '',
        date_from: '',
        date_to: '',
        format: 'pdf',
        include_charts: true,
        include_summary: true,
        enhanceWithAI: true,
    });

    // Template creation form state
    const [templateForm, setTemplateForm] = useState({
        name: '',
        description: '',
        report_type: '',
        template_config: '{}',
        is_default: false,
    });

    const reportTypes = [
        { value: 'student_progress', label: 'Student Progress', icon: <GraduationCap className="w-4 h-4" /> },
        { value: 'class_performance', label: 'Class Performance', icon: <Users className="w-4 h-4" /> },
        { value: 'subject_analytics', label: 'Subject Analytics', icon: <BookOpen className="w-4 h-4" /> },
        { value: 'assignment_analysis', label: 'Assignment Analysis', icon: <FileText className="w-4 h-4" /> },
        { value: 'grade_distribution', label: 'Grade Distribution', icon: <BarChart3 className="w-4 h-4" /> },
        { value: 'teacher_performance', label: 'Teacher Performance', icon: <TrendingUp className="w-4 h-4" /> },
    ];

    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-800',
        generating: 'bg-blue-100 text-blue-800',
        completed: 'bg-green-100 text-green-800',
        failed: 'bg-red-100 text-red-800',
        expired: 'bg-gray-100 text-gray-800',
    };

    const statusIcons = {
        pending: <Clock className="w-3 h-3" />,
        generating: <RefreshCw className="w-3 h-3 animate-spin" />,
        completed: <CheckCircle className="w-3 h-3" />,
        failed: <XCircle className="w-3 h-3" />,
        expired: <AlertCircle className="w-3 h-3" />,
    };

    useEffect(() => {
        fetchReports();
        fetchTemplates();
        fetchAnalytics();
    }, []);

    useEffect(() => {
        const loadStudents = async () => {
            if (!isGenerateDialogOpen) return;
            try {
                setLoadingStudents(true);
                const list = await teacherService.getAllStudents();
                setStudents(list || []);
            } catch (e) {
                console.error('Failed to load students for report generation:', e);
            } finally {
                setLoadingStudents(false);
            }
        };
        loadStudents();
    }, [isGenerateDialogOpen]);

    const fetchReports = async () => {
        try {
            const schoolId = parseInt(localStorage.getItem('school_id') || '0');
            const data = await reportsService.getReports(schoolId);
            setReports(data);
        } catch (error) {
            console.error('Error fetching reports:', error);
            console.error('Error fetching reports');
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplates = async () => {
        try {
            const schoolId = parseInt(localStorage.getItem('school_id') || '0');
            const data = await reportsService.getReportTemplates(schoolId);
            setTemplates(data);
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const schoolId = parseInt(localStorage.getItem('school_id') || '0');
            const data = await reportsService.getReportAnalytics(schoolId);
            setAnalytics(data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        }
    };

    const generateReport = async () => {
        try {
            const schoolId = parseInt(localStorage.getItem('school_id') || '0');

            const requestData: any = {
                ...generateForm,
                school_id: schoolId,
                template_id: generateForm.template_id ? parseInt(generateForm.template_id) : undefined,
                subject_id: generateForm.subject_id ? parseInt(generateForm.subject_id) : undefined,
                classroom_id: generateForm.classroom_id ? parseInt(generateForm.classroom_id) : undefined,
                student_id: generateForm.student_id ? parseInt(generateForm.student_id) : undefined,
                date_from: generateForm.date_from ? new Date(generateForm.date_from).toISOString() : undefined,
                date_to: generateForm.date_to ? new Date(generateForm.date_to).toISOString() : undefined,
            };

            // Attach a rich, teacher-friendly student overview when student is selected
            if (requestData.student_id) {
                try {
                    const studentId = requestData.student_id as number;
                    // Pull teacher-authorized overview from reports backend
                    const overview = await reportsService.getStudentGradesOverview(studentId);
                    const grades = (overview?.grades || []) as any[];

                    // Compute overall average from API or fallback to computed
                    let overallAvg: number = Math.round(Number(overview?.overall_average_percentage ?? NaN));
                    if (!Number.isFinite(overallAvg)) {
                        const pcs = grades.map((g: any) => typeof g.percentage === 'number'
                            ? g.percentage
                            : (g.points_earned && (g.assignment_max_points || g.max_points))
                                ? Math.round((g.points_earned / (g.assignment_max_points || g.max_points)) * 100)
                                : (g.score && g.maxPoints)
                                    ? Math.round((g.score / g.maxPoints) * 100)
                                    : 0
                        );
                        overallAvg = pcs.length ? Math.round(pcs.reduce((a: number, b: number) => a + b, 0) / pcs.length) : 0;
                    }

                    // Build subject-level summaries from grades (no academic endpoints)
                    const subjectMap: Record<string, {
                        subject_id?: number;
                        subject_name: string;
                        pcs: number[];
                        last?: string;
                    }> = {};
                    for (const g of grades) {
                        const sid = g.subject_id || g.subjectId;
                        const sname = g.subject_name || g.subject || 'General';
                        const key = String(sid ?? sname);
                        const pct = typeof g.percentage === 'number'
                            ? g.percentage
                            : (g.points_earned && (g.assignment_max_points || g.max_points))
                                ? Math.round((g.points_earned / (g.assignment_max_points || g.max_points)) * 100)
                                : (g.score && g.maxPoints)
                                    ? Math.round((g.score / g.maxPoints) * 100)
                                    : 0;
                        const dateStr = g.graded_date || g.date || g.created_at;
                        if (!subjectMap[key]) subjectMap[key] = { subject_id: sid, subject_name: sname, pcs: [], last: undefined };
                        subjectMap[key].pcs.push(pct || 0);
                        if (dateStr) {
                            if (!subjectMap[key].last || new Date(dateStr) > new Date(subjectMap[key].last!)) subjectMap[key].last = dateStr;
                        }
                    }
                    const subjectSummaries = Object.values(subjectMap).map(s => {
                        const avg = s.pcs.length ? Math.round(s.pcs.reduce((a, b) => a + b, 0) / s.pcs.length) : 0;
                        const high = s.pcs.length ? s.pcs.reduce((a, b) => Math.max(a, b), 0) : 0;
                        const lowBase = s.pcs.length ? s.pcs.reduce((a, b) => Math.min(a, b), 100) : 100;
                        return {
                            subject_id: s.subject_id ?? 0,
                            subject_name: s.subject_name,
                            average_percentage: avg,
                            graded_count: s.pcs.length,
                            highest: high || 0,
                            lowest: lowBase === 100 ? 0 : lowBase,
                            last_graded: s.last ? new Date(s.last).toISOString() : undefined,
                        };
                    });

                    // Build TeacherView table
                    const bySubject: Record<string, { subject: string; count: number; sum: number; high: number; low: number; lastDate?: string }>
                        = {};
                    for (const g of grades) {
                        const subject = g.subject_name || g.subject || 'General';
                        const pct = typeof g.percentage === 'number'
                            ? g.percentage
                            : (g.points_earned && (g.assignment_max_points || g.max_points))
                                ? Math.round((g.points_earned / (g.assignment_max_points || g.max_points)) * 100)
                                : (g.score && g.maxPoints)
                                    ? Math.round((g.score / g.maxPoints) * 100)
                                    : 0;
                        const dateStr = g.graded_date || g.date || g.created_at;
                        if (!bySubject[subject]) bySubject[subject] = { subject, count: 0, sum: 0, high: 0, low: 100, lastDate: undefined };
                        const b = bySubject[subject];
                        b.count += 1;
                        b.sum += pct || 0;
                        b.high = Math.max(b.high, pct || 0);
                        b.low = Math.min(b.low, pct || 0);
                        if (dateStr) {
                            if (!b.lastDate || new Date(dateStr) > new Date(b.lastDate)) b.lastDate = dateStr;
                        }
                    }
                    const columns = ['Subject', 'Avg %', 'Assignments', 'High', 'Low', 'Last Graded'];
                    const rows = Object.values(bySubject).map(b => [
                        b.subject,
                        b.count ? Math.round(b.sum / b.count) : 0,
                        b.count,
                        b.high || 0,
                        b.low === 100 ? 0 : b.low,
                        b.lastDate ? new Date(b.lastDate).toLocaleDateString() : '-'
                    ]);

                    // Recent grades
                    const recentGrades = grades
                        .map(g => ({
                            title: g.title || g.assignment_title || 'Assignment',
                            subject: g.subject_name || g.subject || 'General',
                            percentage: typeof g.percentage === 'number'
                                ? g.percentage
                                : (g.points_earned && (g.assignment_max_points || g.max_points))
                                    ? Math.round((g.points_earned / (g.assignment_max_points || g.max_points)) * 100)
                                    : (g.score && g.maxPoints)
                                        ? Math.round((g.score / g.maxPoints) * 100)
                                        : 0,
                            graded_date: g.graded_date || g.date || g.created_at,
                        }))
                        .sort((a, b) => new Date(b.graded_date || '').getTime() - new Date(a.graded_date || '').getTime())
                        .slice(0, 5);

                    // Grade distribution
                    const dist = { A: 0, B: 0, C: 0, D: 0, F: 0 } as Record<'A' | 'B' | 'C' | 'D' | 'F', number>;
                    for (const g of grades) {
                        const p = typeof g.percentage === 'number'
                            ? g.percentage
                            : (g.points_earned && (g.assignment_max_points || g.max_points))
                                ? Math.round((g.points_earned / (g.assignment_max_points || g.max_points)) * 100)
                                : (g.score && g.maxPoints)
                                    ? Math.round((g.score / g.maxPoints) * 100)
                                    : 0;
                        if (p >= 90) dist.A++; else if (p >= 80) dist.B++; else if (p >= 70) dist.C++; else if (p >= 60) dist.D++; else dist.F++;
                    }

                    // Strengths/Weaknesses
                    const sortedSubs = [...subjectSummaries].sort((a, b) => b.average_percentage - a.average_percentage);
                    const strengths = sortedSubs.slice(0, 2).map(s => s.subject_name);
                    const weaknesses = sortedSubs.slice(-2).map(s => s.subject_name);

                    // Student profile
                    const student = students.find(s => s.id === studentId);
                    const studentProfile = student ? {
                        id: student.id,
                        name: `${student.fname || (student as any).first_name || ''} ${student.lname || (student as any).last_name || ''}`.trim() || student.username || `Student ${student.id}`,
                        classroom: (student as any).classroom_name || (student as any).class_name || undefined,
                        year: (student as any).academic_year || undefined,
                        email: student.email,
                    } : { id: studentId };

                    requestData.custom_parameters = {
                        teacherView: {
                            layout: 'table',
                            title: 'Academic Performance Overview',
                            columns,
                            rows,
                            student: studentProfile,
                        },
                        studentOverview: {
                            overall_average: overallAvg,
                            subject_summaries: subjectSummaries,
                            recent_grades: recentGrades,
                            grade_distribution: dist,
                            strengths,
                            weaknesses,
                        },
                    };
                } catch (e) {
                    console.warn('Student enrichment skipped:', e);
                }
            }

            if (generateForm.enhanceWithAI) {
                await reportsService.generateEnhancedReport(requestData);
                console.log('Enhanced report generation started with K.A.N.A. AI insights');
            } else {
                await reportsService.generateReport(requestData);
                console.log('Report generation started');
            }

            setIsGenerateDialogOpen(false);
            setGenerateForm({
                title: '',
                report_type: '',
                template_id: '',
                subject_id: '',
                classroom_id: '',
                student_id: '',
                date_from: '',
                date_to: '',
                format: 'pdf',
                include_charts: true,
                include_summary: true,
                enhanceWithAI: true,
            });
            fetchReports();
        } catch (error) {
            console.error('Error generating report:', error);
            console.error('Error generating report');
        }
    };

    const downloadReport = async (reportId: number) => {
        try {
            await reportsService.downloadReport(reportId);
            console.log('Report downloaded');
        } catch (error) {
            console.error('Error downloading report:', error);
            console.error('Error downloading report');
        }
    };

    const deleteReport = async (reportId: number) => {
        try {
            await reportsService.deleteReport(reportId);
            console.log('Report deleted');
            fetchReports();
        } catch (error) {
            console.error('Error deleting report:', error);
            console.error('Error deleting report');
        }
    };

    const createTemplate = async () => {
        try {
            const schoolId = parseInt(localStorage.getItem('school_id') || '0');

            await reportsService.createReportTemplate({
                ...templateForm,
                school_id: schoolId,
            });

            console.log('Template created');
            setIsTemplateDialogOpen(false);
            setTemplateForm({
                name: '',
                description: '',
                report_type: '',
                template_config: '{}',
                is_default: false,
            });
            fetchTemplates();
        } catch (error) {
            console.error('Error creating template:', error);
            console.error('Error creating template');
        }
    };

    const openTemplateView = (t: ReportTemplate) => {
        setSelectedTemplate(t);
        setEditTemplateForm({
            name: t.name,
            description: t.description || '',
            report_type: t.report_type,
            is_active: t.is_active,
            is_default: t.is_default,
            template_config: t.template_config || '{}',
        });
        setIsTemplateViewOpen(true);
    };

    const saveTemplateUpdate = async () => {
        if (!selectedTemplate) return;
        try {
            const updates: any = { ...editTemplateForm };
            // Ensure strings, not undefined
            if (typeof updates.description === 'undefined') delete updates.description;
            if (typeof updates.template_config === 'string') {
                // Keep as string; backend validates JSON
            }
            await reportsService.updateReportTemplate(selectedTemplate.id, updates);
            await fetchTemplates();
            setIsTemplateViewOpen(false);
        } catch (err) {
            console.error('Failed to update template:', err);
        }
    };

    const removeTemplate = async (t: ReportTemplate) => {
        try {
            await reportsService.deleteReportTemplate(t.id);
            await fetchTemplates();
            if (isTemplateViewOpen) setIsTemplateViewOpen(false);
        } catch (err) {
            console.error('Failed to delete template:', err);
        }
    };

    const openReportDetails = async (reportId: number) => {
        try {
            const data = await reportsService.getReport(reportId);
            setSelectedReport(data);
            setIsReportDialogOpen(true);
        } catch (err) {
            console.error('Failed to fetch report details:', err);
        }
    };

    const filteredReports = reports.filter(report => {
        if (filterType !== 'all' && report.report_type !== filterType) return false;
        if (filterStatus !== 'all' && report.status !== filterStatus) return false;
        return true;
    });

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatReportType = (type: string) => {
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                    <p className="text-muted-foreground">
                        Generate and manage comprehensive academic reports
                    </p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Settings className="w-4 h-4 mr-2" />
                                Templates
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Create Report Template</DialogTitle>
                                <DialogDescription>
                                    Create a reusable template for generating reports
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="template-name" className="text-right">
                                        Name
                                    </Label>
                                    <Input
                                        id="template-name"
                                        value={templateForm.name}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="template-type" className="text-right">
                                        Type
                                    </Label>
                                    <Select
                                        value={templateForm.report_type}
                                        onValueChange={(value: string) => setTemplateForm(prev => ({ ...prev, report_type: value }))}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select report type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {reportTypes.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    <div className="flex items-center gap-2">
                                                        {type.icon}
                                                        {type.label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">OCR Extract</Label>
                                    <div className="col-span-3 flex items-center gap-2">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".png,.jpg,.jpeg,.bmp,.tiff,.webp,.pdf"
                                            className="hidden"
                                            onChange={async (e) => {
                                                const f = e.target.files?.[0];
                                                if (!f) return;
                                                try {
                                                    setExtracting(true);
                                                    const data = await reportsService.extractReportCard(f);
                                                    setExtractedData(data);
                                                    // Auto-fill template_config so the preview is persisted when creating the template
                                                    try {
                                                        const jsonStr = JSON.stringify(data);
                                                        setTemplateForm(prev => ({ ...prev, template_config: jsonStr }));
                                                    } catch { /* ignore stringify issues */ }
                                                    console.log('Extracted report card JSON:', data);
                                                } catch (err) {
                                                    console.error('Failed to extract report card:', err);
                                                } finally {
                                                    setExtracting(false);
                                                    // Guard: element may be unmounted
                                                    try {
                                                        if (e && e.target && 'value' in e.target) {
                                                            (e.target as HTMLInputElement).value = '';
                                                        }
                                                    } catch { }
                                                }
                                            }}
                                        />
                                        <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={extracting}>
                                            {extracting ? 'Extracting…' : 'Upload Report Card'}
                                        </Button>
                                    </div>
                                </div>
                                {extractedData && (
                                    <div className="grid grid-cols-4 items-start gap-4">
                                        <Label className="text-right">Preview</Label>
                                        <pre className="col-span-3 bg-muted p-3 rounded max-h-60 overflow-auto text-xs">{JSON.stringify(extractedData, null, 2)}</pre>
                                    </div>
                                )}
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="template-description" className="text-right">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="template-description"
                                        value={templateForm.description}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                                        className="col-span-3"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={createTemplate}>Create Template</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Generate Report
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Generate New Report</DialogTitle>
                                <DialogDescription>
                                    Create a comprehensive report for your school data
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="title" className="text-right">
                                        Title
                                    </Label>
                                    <Input
                                        id="title"
                                        value={generateForm.title}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGenerateForm(prev => ({ ...prev, title: e.target.value }))}
                                        className="col-span-3"
                                    />
                                </div>

                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="report-type" className="text-right">
                                        Type
                                    </Label>
                                    <Select
                                        value={generateForm.report_type}
                                        onValueChange={(value: string) => setGenerateForm(prev => ({ ...prev, report_type: value }))}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select report type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {reportTypes.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    <div className="flex items-center gap-2">
                                                        {type.icon}
                                                        {type.label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="template" className="text-right">
                                        Template
                                    </Label>
                                    <Select
                                        value={generateForm.template_id}
                                        onValueChange={(value: string) => setGenerateForm(prev => ({ ...prev, template_id: value }))}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select template (optional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {templates.map((template) => (
                                                <SelectItem key={template.id} value={template.id.toString()}>
                                                    {template.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="student" className="text-right">
                                        Student
                                    </Label>
                                    <Select
                                        value={generateForm.student_id}
                                        onValueChange={(value: string) => setGenerateForm(prev => ({ ...prev, student_id: value }))}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder={loadingStudents ? 'Loading students…' : 'Select student (optional)'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {students.map((s) => (
                                                <SelectItem key={s.id} value={String(s.id)}>
                                                    {(s.fname || s.first_name || '') + ' ' + (s.lname || s.last_name || '') || s.username || `Student ${s.id}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="format" className="text-right">
                                        Format
                                    </Label>
                                    <Select
                                        value={generateForm.format}
                                        onValueChange={(value: string) => setGenerateForm(prev => ({ ...prev, format: value }))}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pdf">PDF</SelectItem>
                                            <SelectItem value="excel">Excel</SelectItem>
                                            <SelectItem value="csv">CSV</SelectItem>
                                            <SelectItem value="json">JSON</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="date-from" className="text-right">
                                        Date From
                                    </Label>
                                    <Input
                                        id="date-from"
                                        type="date"
                                        value={generateForm.date_from}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGenerateForm(prev => ({ ...prev, date_from: e.target.value }))}
                                        className="col-span-3"
                                    />
                                </div>

                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="date-to" className="text-right">
                                        Date To
                                    </Label>
                                    <Input
                                        id="date-to"
                                        type="date"
                                        value={generateForm.date_to}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGenerateForm(prev => ({ ...prev, date_to: e.target.value }))}
                                        className="col-span-3"
                                    />
                                </div>

                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="ai-enhance" className="text-right">
                                        <div className="flex items-center gap-2">
                                            <Brain className="w-4 h-4" />
                                            K.A.N.A. AI
                                        </div>
                                    </Label>
                                    <div className="col-span-3 flex items-center gap-2">
                                        <Switch
                                            id="ai-enhance"
                                            checked={generateForm.enhanceWithAI}
                                            onCheckedChange={(checked: boolean) => setGenerateForm(prev => ({ ...prev, enhanceWithAI: checked }))}
                                        />
                                        <span className="text-sm text-muted-foreground">
                                            Enhance with AI insights and recommendations
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={generateReport}>Generate Report</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Analytics Cards */}
            {analytics && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analytics.total_reports}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analytics.success_rate.toFixed(1)}%</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatBytes(analytics.storage_used)}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
                            <Settings className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{templates.filter(t => t.is_active).length}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Label htmlFor="filter-type">Report Type</Label>
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    {reportTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex-1">
                            <Label htmlFor="filter-status">Status</Label>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="generating">Generating</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                    <SelectItem value="expired">Expired</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Templates List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Templates ({templates.length})</span>
                        <Button variant="outline" size="sm" onClick={fetchTemplates}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Active</TableHead>
                                <TableHead>Default</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {templates.map((t) => (
                                <TableRow key={t.id}>
                                    <TableCell className="font-medium">{t.name}</TableCell>
                                    <TableCell>{formatReportType(t.report_type)}</TableCell>
                                    <TableCell>
                                        <Badge className={t.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                            {t.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{t.is_default ? 'Yes' : 'No'}</TableCell>
                                    <TableCell>{new Date(t.created_date).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => openTemplateView(t)} title="View / Edit">
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => openTemplateView(t)} title="Edit">
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => removeTemplate(t)} title="Delete">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {templates.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            No templates yet. Create one using the Templates button above.
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Reports Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Reports ({filteredReports.length})</span>
                        <Button variant="outline" size="sm" onClick={fetchReports}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Format</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredReports.map((report) => (
                                <TableRow key={report.id}>
                                    <TableCell className="font-medium">{report.title}</TableCell>
                                    <TableCell>{formatReportType(report.report_type)}</TableCell>
                                    <TableCell>
                                        <Badge className={statusColors[report.status]}>
                                            <div className="flex items-center gap-1">
                                                {statusIcons[report.status]}
                                                {report.status}
                                            </div>
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="uppercase">{report.format}</TableCell>
                                    <TableCell>
                                        {new Date(report.requested_date).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        {report.file_size ? formatBytes(report.file_size) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openReportDetails(report.id)}
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            {report.status === 'completed' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => downloadReport(report.id)}
                                                >
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => deleteReport(report.id)}
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {filteredReports.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            No reports found. Generate your first report to get started.
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Template View/Edit Dialog */}
            <Dialog open={isTemplateViewOpen} onOpenChange={setIsTemplateViewOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Template Details</DialogTitle>
                        <DialogDescription>View and edit your report template</DialogDescription>
                    </DialogHeader>
                    {selectedTemplate && (
                        <div className="grid gap-4 py-2">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Name</Label>
                                <Input
                                    className="col-span-3"
                                    value={editTemplateForm.name || ''}
                                    onChange={(e) => setEditTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Type</Label>
                                <Select
                                    value={String(editTemplateForm.report_type || '')}
                                    onValueChange={(value) => setEditTemplateForm(prev => ({ ...prev, report_type: value }))}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select report type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {reportTypes.map(rt => (
                                            <SelectItem key={rt.value} value={rt.value}>
                                                <div className="flex items-center gap-2">{rt.icon}{rt.label}</div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label className="text-right">Description</Label>
                                <Textarea
                                    className="col-span-3"
                                    value={editTemplateForm.description || ''}
                                    onChange={(e) => setEditTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Active</Label>
                                <div className="col-span-3"><Switch checked={!!editTemplateForm.is_active} onCheckedChange={(v) => setEditTemplateForm(prev => ({ ...prev, is_active: v }))} /></div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Default</Label>
                                <div className="col-span-3"><Switch checked={!!editTemplateForm.is_default} onCheckedChange={(v) => setEditTemplateForm(prev => ({ ...prev, is_default: v }))} /></div>
                            </div>
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label className="text-right">Template JSON</Label>
                                <div className="col-span-3 space-y-2">
                                    <div className="flex gap-2 justify-end">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                try { navigator.clipboard.writeText(editTemplateForm.template_config || ''); } catch { }
                                            }}
                                        >Copy</Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => { if (templateJsonRef.current) templateJsonRef.current.scrollTop = 0; }}
                                        >Top</Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => { if (templateJsonRef.current) templateJsonRef.current.scrollTop = templateJsonRef.current.scrollHeight; }}
                                        >Bottom</Button>
                                    </div>
                                    <Textarea
                                        ref={templateJsonRef}
                                        className="font-mono text-xs h-48"
                                        value={editTemplateForm.template_config || ''}
                                        onChange={(e) => setEditTemplateForm(prev => ({ ...prev, template_config: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* Optionally re-extract from a report card to update saved preview */}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">OCR Extract</Label>
                                <div className="col-span-3 flex items-center gap-2">
                                    <input
                                        ref={viewFileInputRef}
                                        type="file"
                                        accept=".png,.jpg,.jpeg,.bmp,.tiff,.webp,.pdf"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const f = e.target.files?.[0];
                                            if (!f) return;
                                            try {
                                                setReExtracting(true);
                                                const data = await reportsService.extractReportCard(f);
                                                // Pretty-print into Template JSON and preview
                                                try {
                                                    const jsonStr = JSON.stringify(data, null, 2);
                                                    setEditTemplateForm(prev => ({ ...prev, template_config: jsonStr }));
                                                } catch {
                                                    setEditTemplateForm(prev => ({ ...prev, template_config: '{}' }));
                                                }
                                            } catch (err) {
                                                console.error('Failed to extract in template view:', err);
                                            } finally {
                                                setReExtracting(false);
                                                try { if (e?.target) (e.target as HTMLInputElement).value = ''; } catch { }
                                            }
                                        }}
                                    />
                                    <Button variant="outline" onClick={() => viewFileInputRef.current?.click()} disabled={reExtracting}>
                                        {reExtracting ? 'Extracting…' : 'Upload Report Card'}
                                    </Button>
                                    <span className="text-xs text-muted-foreground">Re-extract to replace the saved preview</span>
                                </div>
                            </div>

                            {/* Read-only preview of saved JSON */}
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label className="text-right">Preview</Label>
                                <div className="col-span-3 space-y-2">
                                    <div className="flex gap-2 justify-end">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                try {
                                                    const txt = (() => {
                                                        try {
                                                            const parsed = editTemplateForm.template_config ? JSON.parse(editTemplateForm.template_config) : {};
                                                            return JSON.stringify(parsed, null, 2);
                                                        } catch {
                                                            return editTemplateForm.template_config || '{}';
                                                        }
                                                    })();
                                                    navigator.clipboard.writeText(txt);
                                                } catch { }
                                            }}
                                        >Copy</Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => { if (templatePreviewRef.current) templatePreviewRef.current.scrollTop = 0; }}
                                        >Top</Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => { if (templatePreviewRef.current) templatePreviewRef.current.scrollTop = templatePreviewRef.current.scrollHeight; }}
                                        >Bottom</Button>
                                    </div>
                                    <pre ref={templatePreviewRef} className="bg-muted p-3 rounded max-h-60 overflow-auto text-xs">
                                        {(() => {
                                            try {
                                                const parsed = editTemplateForm.template_config ? JSON.parse(editTemplateForm.template_config) : {};
                                                return JSON.stringify(parsed, null, 2);
                                            } catch {
                                                return editTemplateForm.template_config || '{}';
                                            }
                                        })()}
                                    </pre>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Meta</Label>
                                <div className="col-span-3 text-sm text-muted-foreground">
                                    <div>Created: {new Date(selectedTemplate.created_date).toLocaleString()}</div>
                                    {selectedTemplate.updated_date && <div>Updated: {new Date(selectedTemplate.updated_date).toLocaleString()}</div>}
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="flex items-center justify-between">
                        <Button variant="destructive" onClick={() => selectedTemplate && removeTemplate(selectedTemplate)}>
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsTemplateViewOpen(false)}>Close</Button>
                            <Button onClick={saveTemplateUpdate}>Save Changes</Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Report Details Dialog */}
            <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Report Details</DialogTitle>
                        <DialogDescription>Full report information</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 max-h-[65vh] overflow-auto">
                        {selectedReport ? (
                            <>
                                {/* Teacher View (timetable) and Student Overview */}
                                {(() => {
                                    try {
                                        const paramsObj = selectedReport?.parameters ? (typeof selectedReport.parameters === 'string' ? JSON.parse(selectedReport.parameters) : selectedReport.parameters) : undefined;
                                        const tv = paramsObj?.custom_parameters?.teacherView || paramsObj?.teacherView;
                                        const ov = paramsObj?.custom_parameters?.studentOverview || paramsObj?.studentOverview;
                                        return (
                                            <>
                                                {tv && tv.columns && tv.rows && (
                                                    <div className="mb-3">
                                                        <div className="text-sm text-muted-foreground mb-1">Teacher View</div>
                                                        {tv.title && <div className="font-medium mb-1">{tv.title}</div>}
                                                        {tv.student && (
                                                            <div className="text-xs text-muted-foreground mb-2">
                                                                {tv.student.name || `Student ${tv.student.id}`}
                                                                {tv.student.classroom ? ` • ${tv.student.classroom}` : ''}
                                                                {tv.student.year ? ` • ${tv.student.year}` : ''}
                                                            </div>
                                                        )}
                                                        <div className="overflow-auto max-h-60 border rounded">
                                                            <table className="w-full text-xs">
                                                                <thead className="bg-muted sticky top-0">
                                                                    <tr>
                                                                        {tv.columns.map((c: string, idx: number) => (
                                                                            <th key={idx} className="text-left px-2 py-1 whitespace-nowrap">{c}</th>
                                                                        ))}
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {tv.rows.map((row: any[], rIdx: number) => (
                                                                        <tr key={rIdx} className={rIdx % 2 ? 'bg-muted/40' : ''}>
                                                                            {row.map((cell: any, cIdx: number) => (
                                                                                <td key={cIdx} className="px-2 py-1 whitespace-nowrap">{String(cell)}</td>
                                                                            ))}
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}
                                                {ov && (
                                                    <div className="mb-3">
                                                        <div className="text-sm text-muted-foreground mb-1">Student Overview</div>
                                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                                            <div>Overall Average: <span className="font-medium">{ov.overall_average}%</span></div>
                                                            <div>Strengths: <span className="font-medium">{(ov.strengths || []).join(', ') || '-'}</span></div>
                                                            <div>Weaknesses: <span className="font-medium">{(ov.weaknesses || []).join(', ') || '-'}</span></div>
                                                        </div>
                                                        {ov.subject_summaries && ov.subject_summaries.length > 0 && (
                                                            <div className="mt-2 overflow-auto max-h-60 border rounded">
                                                                <table className="w-full text-xs">
                                                                    <thead className="bg-muted sticky top-0">
                                                                        <tr>
                                                                            <th className="text-left px-2 py-1">Subject</th>
                                                                            <th className="text-left px-2 py-1">Avg %</th>
                                                                            <th className="text-left px-2 py-1">Count</th>
                                                                            <th className="text-left px-2 py-1">High</th>
                                                                            <th className="text-left px-2 py-1">Low</th>
                                                                            <th className="text-left px-2 py-1">Last</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {ov.subject_summaries.map((s: any, i: number) => (
                                                                            <tr key={i} className={i % 2 ? 'bg-muted/40' : ''}>
                                                                                <td className="px-2 py-1">{s.subject_name}</td>
                                                                                <td className="px-2 py-1">{s.average_percentage}%</td>
                                                                                <td className="px-2 py-1">{s.graded_count}</td>
                                                                                <td className="px-2 py-1">{s.highest}</td>
                                                                                <td className="px-2 py-1">{s.lowest}</td>
                                                                                <td className="px-2 py-1">{s.last_graded ? new Date(s.last_graded).toLocaleDateString() : '-'}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        );
                                    } catch {
                                        return null;
                                    }
                                })()}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-muted-foreground">Title</div>
                                        <div className="font-medium">{selectedReport.title}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Type</div>
                                        <div className="font-medium">{formatReportType(selectedReport.report_type)}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Status</div>
                                        <div className="font-medium capitalize">{selectedReport.status}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Format</div>
                                        <div className="font-medium uppercase">{selectedReport.format}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Requested</div>
                                        <div className="font-medium">{new Date(selectedReport.requested_date).toLocaleString()}</div>
                                    </div>
                                    {selectedReport.generated_date && (
                                        <div>
                                            <div className="text-sm text-muted-foreground">Generated</div>
                                            <div className="font-medium">{new Date(selectedReport.generated_date).toLocaleString()}</div>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="text-sm text-muted-foreground">Parameters</div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => { try { navigator.clipboard.writeText(toPretty(selectedReport.parameters)); } catch { } }}>Copy</Button>
                                            <Button variant="outline" size="sm" onClick={() => { if (reportParamsRef.current) reportParamsRef.current.scrollTop = 0; }}>Top</Button>
                                            <Button variant="outline" size="sm" onClick={() => { if (reportParamsRef.current) reportParamsRef.current.scrollTop = reportParamsRef.current.scrollHeight; }}>Bottom</Button>
                                        </div>
                                    </div>
                                    <pre ref={reportParamsRef} className="bg-muted rounded p-2 text-xs overflow-auto max-h-60 whitespace-pre-wrap break-words">{toPretty(selectedReport.parameters)}</pre>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="text-sm text-muted-foreground">Summary</div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => { try { navigator.clipboard.writeText(toPretty(selectedReport.summary_stats)); } catch { } }}>Copy</Button>
                                            <Button variant="outline" size="sm" onClick={() => { if (reportSummaryRef.current) reportSummaryRef.current.scrollTop = 0; }}>Top</Button>
                                            <Button variant="outline" size="sm" onClick={() => { if (reportSummaryRef.current) reportSummaryRef.current.scrollTop = reportSummaryRef.current.scrollHeight; }}>Bottom</Button>
                                        </div>
                                    </div>
                                    <pre ref={reportSummaryRef} className="bg-muted rounded p-2 text-xs overflow-auto max-h-60 whitespace-pre-wrap break-words">{toPretty(selectedReport.summary_stats)}</pre>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="text-sm text-muted-foreground">Data</div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => { try { navigator.clipboard.writeText(toPretty(selectedReport.report_data)); } catch { } }}>Copy</Button>
                                            <Button variant="outline" size="sm" onClick={() => { if (reportDataRef.current) reportDataRef.current.scrollTop = 0; }}>Top</Button>
                                            <Button variant="outline" size="sm" onClick={() => { if (reportDataRef.current) reportDataRef.current.scrollTop = reportDataRef.current.scrollHeight; }}>Bottom</Button>
                                        </div>
                                    </div>
                                    <pre ref={reportDataRef} className="bg-muted rounded p-2 text-xs overflow-auto max-h-60 whitespace-pre-wrap break-words">{toPretty(selectedReport.report_data)}</pre>
                                </div>
                            </>
                        ) : (
                            <div className="text-sm text-muted-foreground">No report selected</div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>Close</Button>
                        {selectedReport?.status === 'completed' && (
                            <Button onClick={() => downloadReport(selectedReport.id)}>
                                <Download className="w-4 h-4 mr-2" /> Download
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export { Reports };
