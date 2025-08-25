import axios from 'axios';

interface ReportGenerationRequest {
    title: string;
    report_type: string;
    template_id?: number;
    subject_id?: number;
    classroom_id?: number;
    student_id?: number;
    teacher_id?: number;
    assignment_id?: number;
    date_from?: string;
    date_to?: string;
    format: string;
    include_charts?: boolean;
    include_summary?: boolean;
    custom_parameters?: any;
}

interface QuickReportRequest {
    report_type: string;
    scope_id: number;
    date_range_days?: number;
    format?: string;
}

interface KanaReportRequest {
    reportType: string;
    reportData: any;
    schoolId: number;
}

class ReportsService {
    private pythonBackendUrl = 'https://brainink-backend.onrender.com';
    private kanaBackendUrl = 'https://kana-backend-app.onrender.com';

    private getAuthHeaders() {
        const token = this.getToken();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        } else {
            console.warn('[ReportsService] No token found for Authorization header. Requests may be unauthorized (401).');
        }
        return headers;
    }

    private getToken(): string | null {
        // Try common storage keys first
        const candidates: Array<string | null> = [
            localStorage.getItem('access_token') || sessionStorage.getItem('access_token'),
            localStorage.getItem('token') || sessionStorage.getItem('token'),
            localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token'),
        ];

        // Try user-like objects
        const userLike = localStorage.getItem('user')
            || sessionStorage.getItem('user')
            || localStorage.getItem('currentUser')
            || sessionStorage.getItem('currentUser')
            || localStorage.getItem('auth')
            || sessionStorage.getItem('auth');
        if (userLike) {
            try {
                const parsed = JSON.parse(userLike);
                const maybeToken = parsed?.access_token || parsed?.token || parsed?.data?.access_token;
                if (maybeToken) {
                    candidates.unshift(maybeToken);
                }
            } catch {
                // ignore JSON parse errors
            }
        }

        let token = (candidates.find(Boolean) as string | undefined) || null;
        if (token) {
            token = token.trim();
            if (token.toLowerCase().startsWith('bearer ')) {
                token = token.slice(7).trim();
            }
        }
        if (token) {
            console.log('Token from storage:', `${token.substring(0, 20)}...`);
        }
        return token;
    }

    // Normalization helpers
    private normalizeReportType(type?: string): string | undefined {
        if (!type) return undefined;
        const t = String(type).toLowerCase().trim();
        const map: Record<string, string> = {
            'student progress': 'student_progress',
            'class performance': 'class_performance',
            'subject analytics': 'subject_analytics',
            'assignment analysis': 'assignment_analysis',
            'grade distribution': 'grade_distribution',
            'attendance report': 'attendance_report',
            'teacher performance': 'teacher_performance',
            'school overview': 'school_overview'
        };
        const normalized = map[t] || t.replace(/\s+/g, '_');
        const allowed = new Set([
            'student_progress', 'class_performance', 'subject_analytics', 'assignment_analysis', 'grade_distribution', 'attendance_report', 'teacher_performance', 'school_overview'
        ]);
        return allowed.has(normalized) ? normalized : undefined;
    }

    private normalizeFormat(fmt?: string): string | undefined {
        if (!fmt) return undefined;
        const f = String(fmt).toLowerCase().trim();
        const allowed = new Set(['pdf', 'excel', 'csv', 'json']);
        return allowed.has(f) ? f : undefined;
    }

    private normalizeGenerationRequest(request: ReportGenerationRequest): ReportGenerationRequest {
        const r: any = { ...request };
        r.report_type = this.normalizeReportType(r.report_type) || r.report_type;
        r.format = this.normalizeFormat(r.format) || r.format || 'pdf';
        // coerce string IDs to numbers
        ['template_id', 'subject_id', 'classroom_id', 'student_id', 'teacher_id', 'assignment_id'].forEach((k) => {
            if (r[k] !== undefined && r[k] !== null && typeof r[k] === 'string' && r[k] !== '') {
                const n = Number(r[k]);
                if (!Number.isNaN(n)) r[k] = n;
            }
        });
        return r as ReportGenerationRequest;
    }

    private normalizeTemplatePayload(template: any) {
        const payload: any = { ...template };
        payload.report_type = this.normalizeReportType(payload.report_type) || payload.report_type || 'student_progress';
        if (!payload.name || !String(payload.name).trim()) {
            throw new Error('Template name is required');
        }
        if (payload.template_config && typeof payload.template_config !== 'string') {
            try { payload.template_config = JSON.stringify(payload.template_config); } catch { payload.template_config = '{}'; }
        }
        if (typeof payload.is_active === 'undefined') payload.is_active = true;
        if (typeof payload.is_default === 'undefined') payload.is_default = false;
        if (typeof payload.school_id === 'undefined' || payload.school_id === null) {
            const sid = Number(localStorage.getItem('school_id') || '0');
            payload.school_id = sid;
        }
        return payload;
    }

    // Python Backend API calls
    async generateReport(request: ReportGenerationRequest) {
        try {
            const normalized = this.normalizeGenerationRequest(request);
            const response = await axios.post(
                `${this.pythonBackendUrl}/study-area/reports/generate`,
                normalized,
                { headers: this.getAuthHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('Error generating report:', error);
            throw error;
        }
    }

    async getReports(schoolId: number, reportType?: string, status?: string) {
        try {
            const params = new URLSearchParams({ school_id: schoolId.toString() });
            if (reportType) params.append('report_type', reportType);
            if (status) params.append('status', status);

            const response = await axios.get(
                `${this.pythonBackendUrl}/study-area/reports/?${params.toString()}`,
                { headers: this.getAuthHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching reports:', error);
            throw error;
        }
    }

    async getReport(reportId: number) {
        try {
            const response = await axios.get(
                `${this.pythonBackendUrl}/study-area/reports/${reportId}`,
                { headers: this.getAuthHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching report:', error);
            throw error;
        }
    }

    async downloadReport(reportId: number) {
        try {
            const response = await axios.get(
                `${this.pythonBackendUrl}/study-area/reports/${reportId}/download`,
                { headers: this.getAuthHeaders(), responseType: 'blob' }
            );
            return response.data;
        } catch (error) {
            console.error('Error downloading report:', error);
            throw error;
        }
    }

    async deleteReport(reportId: number) {
        try {
            const response = await axios.delete(
                `${this.pythonBackendUrl}/study-area/reports/${reportId}`,
                { headers: this.getAuthHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('Error deleting report:', error);
            throw error;
        }
    }

    async generateQuickReport(request: QuickReportRequest) {
        try {
            const payload = {
                ...request,
                report_type: this.normalizeReportType(request.report_type) || request.report_type,
                format: this.normalizeFormat(request.format) || request.format || 'pdf'
            };
            const response = await axios.post(
                `${this.pythonBackendUrl}/study-area/reports/quick`,
                payload,
                { headers: this.getAuthHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('Error generating quick report:', error);
            throw error;
        }
    }

    async getReportPreview(reportType: string, scopeId: number, dateRangeDays: number = 30) {
        try {
            const response = await axios.get(
                `${this.pythonBackendUrl}/study-area/reports/preview/${reportType}/${scopeId}?date_range_days=${dateRangeDays}`,
                { headers: this.getAuthHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching report preview:', error);
            throw error;
        }
    }

    async getReportAnalytics(schoolId: number, days: number = 30) {
        try {
            const response = await axios.get(
                `${this.pythonBackendUrl}/study-area/reports/analytics/overview?school_id=${schoolId}&days=${days}`,
                { headers: this.getAuthHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching report analytics:', error);
            throw error;
        }
    }

    // Teacher-authorized Grades (Reports scope)
    async getStudentGradesOverview(studentId: number) {
        try {
            const response = await axios.get(
                `${this.pythonBackendUrl}/study-area/reports/grades/student/${studentId}`,
                { headers: this.getAuthHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching student grades overview (reports):', error);
            throw error;
        }
    }

    async getStudentGradesInSubject(studentId: number, subjectId: number) {
        try {
            const response = await axios.get(
                `${this.pythonBackendUrl}/study-area/reports/grades/student/${studentId}/subject/${subjectId}`,
                { headers: this.getAuthHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching student grades in subject (reports):', error);
            throw error;
        }
    }

    // Report Templates
    async createReportTemplate(template: any) {
        try {
            const payload = this.normalizeTemplatePayload(template);
            const response = await axios.post(
                `${this.pythonBackendUrl}/study-area/reports/templates/`,
                payload,
                { headers: this.getAuthHeaders() }
            );
            return response.data;
        } catch (error) {
            // Surface backend error details to help diagnose 500s
            const anyErr: any = error;
            const detail = anyErr?.response?.data?.detail || anyErr?.message;
            if (detail) {
                console.error('Error creating report template (detail):', detail);
            }
            console.error('Error creating report template:', error);
            throw error;
        }
    }

    async getReportTemplates(schoolId: number, reportType?: string, isActive?: boolean) {
        try {
            const params = new URLSearchParams({ school_id: schoolId.toString() });
            if (reportType) params.append('report_type', reportType);
            if (isActive !== undefined) params.append('is_active', isActive.toString());

            const response = await axios.get(
                `${this.pythonBackendUrl}/study-area/reports/templates/?${params.toString()}`,
                { headers: this.getAuthHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching report templates:', error);
            throw error;
        }
    }

    async updateReportTemplate(templateId: number, updates: any) {
        try {
            const payload = { ...updates };
            if (payload.report_type) payload.report_type = this.normalizeReportType(payload.report_type) || payload.report_type;
            if (payload.template_config && typeof payload.template_config !== 'string') {
                try { payload.template_config = JSON.stringify(payload.template_config); } catch { /* ignore */ }
            }
            const response = await axios.put(
                `${this.pythonBackendUrl}/study-area/reports/templates/${templateId}`,
                payload,
                { headers: this.getAuthHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('Error updating report template:', error);
            throw error;
        }
    }

    async deleteReportTemplate(templateId: number) {
        try {
            const response = await axios.delete(
                `${this.pythonBackendUrl}/study-area/reports/templates/${templateId}`,
                { headers: this.getAuthHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('Error deleting report template:', error);
            throw error;
        }
    }

    // K.A.N.A. AI-Enhanced Reports
    async generateAIReportInsights(request: KanaReportRequest) {
        try {
            const response = await axios.post(
                `${this.kanaBackendUrl}/api/kana/generate-report-data`,
                request
            );
            return response.data;
        } catch (error) {
            console.error('Error generating AI report insights:', error);
            throw error;
        }
    }

    async generateReportRecommendations(reportType: string, historicalData: any, currentData: any) {
        try {
            const response = await axios.post(
                `${this.kanaBackendUrl}/api/kana/report-recommendations`,
                {
                    reportType,
                    historicalData,
                    currentData
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error generating report recommendations:', error);
            throw error;
        }
    }

    async generateReportSummary(reportData: any, reportType: string, timeframe: string) {
        try {
            const response = await axios.post(
                `${this.kanaBackendUrl}/api/kana/report-summary`,
                {
                    reportData,
                    reportType,
                    timeframe
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error generating report summary:', error);
            throw error;
        }
    }

    // Report-card OCR extraction (Gemini-native via Kana backend)
    async extractReportCard(file: File) {
        const form = new FormData();
        form.append('file', file);
        try {
            const response = await axios.post(
                `${this.kanaBackendUrl}/api/kana/report-card/extract`,
                form,
                { headers: { /* no explicit content-type; browser sets boundary */ } }
            );
            return response.data;
        } catch (error) {
            console.error('Error extracting report card (Kana):', error);
            throw error;
        }
    }

    // Enhanced Report Generation with AI
    async generateEnhancedReport(request: ReportGenerationRequest & { enhanceWithAI?: boolean }) {
        try {
            // First generate the basic report
            const basicReport = await this.generateReport(request);

            // If AI enhancement is requested, get AI insights
            if (request.enhanceWithAI) {
                const schoolId = parseInt(localStorage.getItem('school_id') || '0');

                // Get relevant data for the report type
                const reportData = await this.getReportDataForAI(request);

                // Generate AI insights
                const aiInsights = await this.generateAIReportInsights({
                    reportType: request.report_type,
                    reportData,
                    schoolId
                });

                // Generate recommendations if historical data exists
                let recommendations = null;
                try {
                    const historicalData = await this.getHistoricalReportData(request);
                    recommendations = await this.generateReportRecommendations(
                        request.report_type,
                        historicalData,
                        reportData
                    );
                } catch (e) {
                    console.log('No historical data available for recommendations');
                }

                return {
                    ...basicReport,
                    aiInsights: aiInsights.aiInsights,
                    recommendations: recommendations?.recommendations,
                    enhancedAt: new Date().toISOString()
                };
            }

            return basicReport;
        } catch (error) {
            console.error('Error generating enhanced report:', error);
            throw error;
        }
    }

    // Helper methods
    private async getReportDataForAI(request: ReportGenerationRequest) {
        // This would fetch the actual data needed for AI analysis
        // For now, return basic structure
        return {
            reportType: request.report_type,
            scope: {
                subjectId: request.subject_id,
                classroomId: request.classroom_id,
                studentId: request.student_id,
                teacherId: request.teacher_id,
                assignmentId: request.assignment_id
            },
            dateRange: {
                from: request.date_from,
                to: request.date_to
            }
        };
    }

    private async getHistoricalReportData(_request: ReportGenerationRequest) {
        // This would fetch historical data for trend analysis
        // For now, return empty structure
        return {
            previousPeriods: [],
            trends: {},
            benchmarks: {}
        };
    }

    // Utility method to format report data for display
    formatReportData(report: any) {
        return {
            ...report,
            formattedDate: new Date(report.requested_date).toLocaleDateString(),
            formattedSize: report.file_size ? this.formatBytes(report.file_size) : 'N/A',
            statusColor: this.getStatusColor(report.status),
            typeLabel: this.formatReportType(report.report_type)
        };
    }

    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    private getStatusColor(status: string): string {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            generating: 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
            failed: 'bg-red-100 text-red-800',
            expired: 'bg-gray-100 text-gray-800',
        };
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    }

    private formatReportType(type: string): string {
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
}

export const reportsService = new ReportsService();
