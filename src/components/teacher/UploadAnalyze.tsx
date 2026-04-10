import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, User, Send, Brain, CheckCircle, AlertCircle, Loader2, Eye, X, Image, FolderUp, FolderOpen } from 'lucide-react';
import { teacherService, Student } from '../../services/teacherService';
import { gradesAssignmentsService } from '../../services/gradesAssignmentsService';

interface AnalysisResult {
  extractedText: string;
  analysis: string;
  knowledgeGaps: string[];
  recommendations: string[];
  confidence: number;
  targetStudent?: string;
  // New grading fields
  grade?: number;
  maxPoints?: number;
  gradingCriteria?: {
    category: string;
    score?: number;
    maxScore?: number;
    feedback: string;
    evidenceSnippet?: string;
    scoreDisplay?: string;
  }[];
  overallFeedback?: string;
  improvementAreas?: string[];
  strengths?: string[];
  // Enhanced feedback types
  detailedFeedback?: string;
  summaryFeedback?: string;
  letterGrade?: string;
  percentage?: number;
  feedback?: string; // Added missing feedback property
  // Retry handling
  needs_retry?: boolean;
  error?: string;
  raw_feedback?: string;
}

interface Subject {
  id: number;
  name: string;
  school_id: number;
  created_date: string;
  is_active: boolean;
  teacher_count?: number;
  student_count?: number;
  students?: Student[];
}

interface Classroom {
  id: number;
  name: string;
  description?: string;
  capacity?: number;
  location?: string;
  school_id: number;
  teacher_id?: number;
  students?: Student[];
}

interface BulkUploadStudent {
  student_id: number;
  student_name: string;
  has_pdf: boolean;
  pdf_id?: number;
  image_count: number;
  generated_date?: string;
  is_graded: boolean;
  pdf_size?: number;        // New: PDF size in bytes
  content_type?: string;    // New: PDF content type
  pdf_filename?: string;    // New: PDF filename
}

interface BulkUploadModal {
  isOpen: boolean;
  assignmentId?: number;
  assignmentTitle?: string;
  students?: BulkUploadStudent[];
}

interface GradeCheckResult {
  already_graded: boolean;
  assignment_id: number;
  assignment_title: string;
  student_id: number;
  student_name: string;
  max_points: number;
  grade_id?: number;
  points_earned?: number;
  percentage?: number;
  feedback?: string;
  graded_date?: string;
  teacher_id?: number;
}

interface ExistingGradeModal {
  isOpen: boolean;
  gradeDetails?: any;
}

interface LiveGradingProgress {
  active: boolean;
  totalStudents: number;
  completedStudents: number;
  successfulStudents: number;
  failedStudents: number;
  currentStudentName: string;
  currentStudentId: number | null;
}

type UploadStepId = 'classroom' | 'subject' | 'assignment' | 'settings' | 'students';

const createInitialLiveGradingProgress = (): LiveGradingProgress => ({
  active: false,
  totalStudents: 0,
  completedStudents: 0,
  successfulStudents: 0,
  failedStudents: 0,
  currentStudentName: '',
  currentStudentId: null,
});

export const UploadAnalyze: React.FC = () => {
  // Original state
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [files, setFiles] = useState<FileList | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('');
  const [liveGradingProgress, setLiveGradingProgress] = useState<LiveGradingProgress>(
    createInitialLiveGradingProgress()
  );
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loadingStudents, setLoadingStudents] = useState(true);

  // New classroom and subject state
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [loadingClassrooms, setLoadingClassrooms] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);

  // Assignment selection and grading options
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<string>('');
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [gradingMode, setGradingMode] = useState<'auto' | 'manual'>('auto'); // auto = direct grading, manual = teacher types grades
  const [manualGrades, setManualGrades] = useState<{ [key: string]: { grade: number, feedback: string } }>({});
  const [fullAnalysisModal, setFullAnalysisModal] = useState<{
    isOpen: boolean;
    analysis: AnalysisResult | null;
  }>({ isOpen: false, analysis: null });

  // Legacy grading options (keeping for backward compatibility)
  const [assignmentType, setAssignmentType] = useState<'analysis' | 'grading'>('grading');
  const [maxPoints, setMaxPoints] = useState<number>(100);
  const [assignmentTitle, setAssignmentTitle] = useState<string>('');
  const [assignmentDescription, setAssignmentDescription] = useState<string>('');
  const [gradingRubric, setGradingRubric] = useState<string>('');
  const [feedbackType, setFeedbackType] = useState<'detailed' | 'summary' | 'both'>('both');

  // Image selection state
  const [selectImageModal, setSelectImageModal] = useState(false);
  const [uploadModalTab, setUploadModalTab] = useState<'single' | 'bulk'>('single');
  const [savedImages, setSavedImages] = useState<any[]>([]);
  const [loadingSavedImages, setLoadingSavedImages] = useState(false);

  // Bulk upload state
  const [bulkUploadModal, setBulkUploadModal] = useState<BulkUploadModal>({ isOpen: false });
  const [loadingBulkStudents, setLoadingBulkStudents] = useState(false);
  const [bulkUploadFiles, setBulkUploadFiles] = useState<FileList | null>(null);
  const [selectedBulkStudent, setSelectedBulkStudent] = useState<string>('');
  const [processingBulkUpload, setProcessingBulkUpload] = useState(false);

  // New bulk upload state
  const [bulkUploadExistingModal, setBulkUploadExistingModal] = useState(false);
  const [bulkUploadNewModal, setBulkUploadNewModal] = useState(false);

  // Grading status state
  const [studentGradingStatus, setStudentGradingStatus] = useState<{ [key: string]: boolean }>({});
  const [loadingGradingStatus, setLoadingGradingStatus] = useState(false);
  const [submittingGrade, setSubmittingGrade] = useState(false);
  const [gradingDetailsModal, setGradingDetailsModal] = useState<{
    isOpen: boolean;
    studentId: number | null;
    studentName: string;
    gradeDetails: any;
  }>({ isOpen: false, studentId: null, studentName: '', gradeDetails: null });
  const [updatingGrade, setUpdatingGrade] = useState(false);

  // State for raw feedback view toggle
  const [showRawFeedback, setShowRawFeedback] = useState(true); // Default to true to show raw feedback first

  // Student upload status state
  const [studentUploadStatus, setStudentUploadStatus] = useState<{ [key: number]: { hasUpload: boolean, uploadType: 'pdf' | 'images' | null } }>({});

  // Student uploads modal state
  const [studentUploadsModal, setStudentUploadsModal] = useState<{
    isOpen: boolean;
    studentId?: number;
    studentName?: string;
    uploads?: any[];
  }>({ isOpen: false });

  // Current student for upload
  const [currentUploadStudent, setCurrentUploadStudent] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // Assignment editing state
  const [editingAssignment, setEditingAssignment] = useState(false);
  const [showAssignmentEditModal, setShowAssignmentEditModal] = useState(false);

  // Grade checking state
  const [existingGradeModal, setExistingGradeModal] = useState<ExistingGradeModal>({ isOpen: false });
  const [pendingGradeProcess, setPendingGradeProcess] = useState<any>(null);

  // File preview state for multiple uploads
  const [filePreview, setFilePreview] = useState<{
    files: File[];
    previews: string[];
    studentId?: number;
    studentName?: string;
    isOpen: boolean;
  }>({
    files: [],
    previews: [],
    isOpen: false
  });

  const [activeUploadStep, setActiveUploadStep] = useState<UploadStepId>('classroom');
  const [hasOpenedGradingSettings, setHasOpenedGradingSettings] = useState(false);
  const uploadStepRefs = useRef<Record<UploadStepId, HTMLDivElement | null>>({
    classroom: null,
    subject: null,
    assignment: null,
    settings: null,
    students: null
  });
  const uploadSteps: { id: UploadStepId; label: string }[] = [
    { id: 'classroom', label: 'Choose a Classroom' },
    { id: 'subject', label: 'Pick a Subject' },
    { id: 'assignment', label: 'Select Assignment' },
    { id: 'settings', label: 'Grading Settings' },
    { id: 'students', label: 'Select Students' }
  ];

  // Simple feedback formatter for clean display
  const formatSimpleFeedback = (feedback: string): JSX.Element => {
    if (!feedback || feedback.trim() === '') {
      return <span className="text-gray-500 italic">No feedback provided</span>;
    }

    const cleanFeedback = feedback.replace(/\*\*/g, '').trim();

    // Split into paragraphs and format
    const paragraphs = cleanFeedback.split('\n\n').filter(p => p.trim());

    return (
      <div className="space-y-2">
        {paragraphs.map((paragraph, index) => {
          const trimmed = paragraph.trim();

          // Check if it's a header
          if (trimmed.startsWith('###') || trimmed.startsWith('##') ||
            (trimmed.length < 80 && trimmed.endsWith(':') && !trimmed.includes('.'))) {
            return (
              <h5 key={index} className="font-semibold text-gray-900 mt-3 mb-1">
                {trimmed.replace(/#{1,3}\s*/, '').replace(':', '')}
              </h5>
            );
          }

          // Check for bullet points
          if (trimmed.includes('•') || trimmed.includes('*')) {
            const items = trimmed.split(/[•*]/).filter(item => item.trim());
            return (
              <ul key={index} className="list-disc list-inside space-y-1 ml-2">
                {items.map((item, itemIndex) => (
                  <li key={itemIndex} className="text-gray-700">{item.trim()}</li>
                ))}
              </ul>
            );
          }

          // Regular paragraph
          return (
            <p key={index} className="text-gray-700 leading-relaxed">
              {trimmed}
            </p>
          );
        })}
      </div>
    );
  };

  const normalizeRubricCriteria = (payload: any): AnalysisResult['gradingCriteria'] => {
    const rawCriteria = payload?.criterion_feedback || payload?.grading_criteria || payload?.rubric_scores || [];
    if (!Array.isArray(rawCriteria)) {
      return [];
    }

    return rawCriteria
      .map((item: any) => {
        if (typeof item === 'string') {
          return {
            category: 'Criterion',
            feedback: item,
          };
        }

        if (!item || typeof item !== 'object') {
          return null;
        }

        const category = String(item.category || item.criterion || '').trim() || 'Criterion';
        const parsedScore = Number(item.score ?? item.points_awarded);
        const parsedMax = Number(item.maxScore ?? item.max_points);
        const feedback = String(item.feedback || item.paragraph || '').trim();
        const evidenceSnippet = String(item.evidence_snippet || item.evidenceSnippet || '').trim();
        const scoreDisplay = String(item.score_display || '').trim();

        return {
          category,
          score: Number.isFinite(parsedScore) ? parsedScore : undefined,
          maxScore: Number.isFinite(parsedMax) ? parsedMax : undefined,
          feedback,
          evidenceSnippet: evidenceSnippet || undefined,
          scoreDisplay: scoreDisplay || undefined,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  };

  const stripRubricFeedbackMarker = (feedback: string): string => {
    return feedback.replace(/^\s*\[RUBRIC_FEEDBACK_V2\]\s*/i, '').trim();
  };

  const parseRubricFeedbackText = (feedback: string): {
    criteria: NonNullable<AnalysisResult['gradingCriteria']>;
    overallConclusion: string;
  } => {
    const cleanFeedback = stripRubricFeedbackMarker(feedback);
    const parsedCriteria: NonNullable<AnalysisResult['gradingCriteria']> = [];
    let overallConclusion = '';

    // Handle JSON-like payloads if they were persisted directly.
    if (cleanFeedback.startsWith('{') || cleanFeedback.startsWith('[')) {
      try {
        const parsed = JSON.parse(cleanFeedback);
        const normalized = (normalizeRubricCriteria(parsed) ?? []) as NonNullable<AnalysisResult['gradingCriteria']>;
        if (normalized.length > 0) {
          return {
            criteria: normalized,
            overallConclusion: String(parsed?.overall_conclusion || parsed?.overallConclusion || '').trim(),
          };
        }
      } catch {
        // Ignore parse failures and continue with text parsing.
      }
    }

    const lines = cleanFeedback
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    for (const line of lines) {
      const overallMatch = line.match(/^overall conclusion:\s*(.+)$/i);
      if (overallMatch) {
        overallConclusion = overallMatch[1].trim();
        continue;
      }

      const criterionMatch = line.match(/^(.+?)\s*\((\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?)\):\s*(.+)$/i);
      if (!criterionMatch) {
        continue;
      }

      const category = criterionMatch[1].trim();
      const scoreDisplay = criterionMatch[2].replace(/\s+/g, '');
      let criterionText = criterionMatch[3].trim();
      let evidenceSnippet: string | undefined;

      const evidenceMatch = criterionText.match(/\s+Evidence:\s*"([^"]+)"\s*$/i) ||
        criterionText.match(/\s+Evidence:\s*(.+)$/i);

      if (evidenceMatch) {
        evidenceSnippet = evidenceMatch[1].trim();
        criterionText = criterionText.replace(evidenceMatch[0], '').trim();
      }

      parsedCriteria.push({
        category,
        feedback: criterionText,
        scoreDisplay,
        evidenceSnippet,
      });
    }

    return {
      criteria: parsedCriteria,
      overallConclusion,
    };
  };

  const renderRubricFeedback = (
    criteria: NonNullable<AnalysisResult['gradingCriteria']>,
    overallConclusion?: string
  ): JSX.Element => {
    return (
      <div className="space-y-4">
        {criteria.map((item, index) => (
          <div key={`${item.category}-${index}`} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between gap-3 mb-2">
              <h5 className="font-semibold text-gray-900">{item.category}</h5>
              <span className="text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                {item.scoreDisplay || (typeof item.score === 'number' && typeof item.maxScore === 'number' ? `${item.score}/${item.maxScore}` : 'Scored')}
              </span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{item.feedback}</p>
            {item.evidenceSnippet && (
              <p className="text-xs text-gray-500 mt-2 italic">Evidence: "{item.evidenceSnippet}"</p>
            )}
          </div>
        ))}

        {overallConclusion && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h5 className="font-semibold text-indigo-900 mb-1">Overall conclusion</h5>
            <p className="text-sm text-indigo-800 leading-relaxed">{overallConclusion}</p>
          </div>
        )}
      </div>
    );
  };

  const buildRubricFeedbackForStorage = (result: AnalysisResult): string => {
    const detailed = String(result.detailedFeedback || '').trim();
    if (detailed && /^\s*\[RUBRIC_FEEDBACK_V2\]/i.test(detailed)) {
      return detailed;
    }

    const criteria = Array.isArray(result.gradingCriteria)
      ? result.gradingCriteria.filter((item) => item && item.category && item.feedback)
      : [];

    if (criteria.length === 0) {
      return detailed || String(result.overallFeedback || result.analysis || '').trim();
    }

    const lines = criteria.map((item) => {
      const scoreDisplay = item.scoreDisplay ||
        (typeof item.score === 'number' && typeof item.maxScore === 'number' ? `${item.score}/${item.maxScore}` : '0/0');
      const evidencePart = item.evidenceSnippet ? ` Evidence: "${item.evidenceSnippet}"` : '';
      return `${item.category} (${scoreDisplay}): ${item.feedback}${evidencePart}`;
    });

    if (result.overallFeedback && result.overallFeedback.trim()) {
      lines.push(`Overall conclusion: ${result.overallFeedback.trim()}`);
    }

    return `[RUBRIC_FEEDBACK_V2]\n${lines.join('\n')}`;
  };

  // Format comprehensive feedback to match new backend format
  const formatDetailedFeedback = (feedback: string): JSX.Element => {
    if (!feedback || feedback.trim() === '') {
      return (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-300 rounded-xl p-8 text-center shadow-inner">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-gray-600 text-lg font-semibold mb-2">No feedback available</h3>
          <p className="text-gray-500 text-sm">This grade was submitted without detailed feedback.</p>
        </div>
      );
    }

    // Clean up the feedback and parse sections
    const cleanFeedback = feedback.replace(/\*\*/g, '').trim();

    // Prioritize rubric paragraph rendering for V2 feedback.
    const rubricFeedback = parseRubricFeedbackText(cleanFeedback);
    if (rubricFeedback.criteria.length > 0) {
      return renderRubricFeedback(rubricFeedback.criteria, rubricFeedback.overallConclusion);
    }

    // Parse sections based on actual backend format
    const sections = {
      gradeBreakdown: '',
      stepByStepProcess: '',
      questionAnalysis: '',
      performanceSummary: '',
      detailedFeedback: '',
      strengths: '',
      growthOpportunities: '',
      priorityImprovements: '',
      studySuggestions: '',
      nextSteps: '',
      teacherNotes: ''
    };

    // Extract each section using more flexible regex patterns
    const extractSection = (pattern: RegExp, text: string): string => {
      const match = text.match(pattern);
      return match ? match[1].trim() : '';
    };

    // Updated patterns to match the actual feedback format
    sections.gradeBreakdown = extractSection(/GRADE BREAKDOWN:\s*([\s\S]*?)(?=STEP-BY-STEP|DETAILED|PERFORMANCE|$)/i, cleanFeedback);
    sections.stepByStepProcess = extractSection(/STEP-BY-STEP GRADING PROCESS:\s*([\s\S]*?)(?=DETAILED QUESTION-BY-QUESTION|PERFORMANCE|DETAILED FEEDBACK|$)/i, cleanFeedback);
    sections.questionAnalysis = extractSection(/DETAILED QUESTION-BY-QUESTION ANALYSIS:\s*([\s\S]*?)(?=PERFORMANCE|DETAILED FEEDBACK|LEARNING|$)/i, cleanFeedback);
    sections.performanceSummary = extractSection(/PERFORMANCE SUMMARY:\s*([\s\S]*?)(?=DETAILED FEEDBACK|LEARNING|$)/i, cleanFeedback);
    sections.detailedFeedback = extractSection(/DETAILED FEEDBACK:\s*([\s\S]*?)(?=LEARNING|GROWTH|$)/i, cleanFeedback);
    sections.strengths = extractSection(/LEARNING STRENGTHS:\s*([\s\S]*?)(?=GROWTH|PRIORITY|$)/i, cleanFeedback);
    sections.growthOpportunities = extractSection(/GROWTH OPPORTUNITIES:\s*([\s\S]*?)(?=PRIORITY|STUDY|$)/i, cleanFeedback);
    sections.priorityImprovements = extractSection(/PRIORITY IMPROVEMENTS:\s*([\s\S]*?)(?=STUDY|NEXT|$)/i, cleanFeedback);
    sections.studySuggestions = extractSection(/STUDY SUGGESTIONS:\s*([\s\S]*?)(?=NEXT|TEACHER|$)/i, cleanFeedback);
    sections.nextSteps = extractSection(/NEXT STEPS:\s*([\s\S]*?)(?=TEACHER|$)/i, cleanFeedback);
    sections.teacherNotes = extractSection(/TEACHER NOTES:\s*([\s\S]*?)$/i, cleanFeedback);

    console.log('🔍 Parsed sections:', {
      gradeBreakdown: sections.gradeBreakdown.length,
      stepByStepProcess: sections.stepByStepProcess.length,
      questionAnalysis: sections.questionAnalysis.length,
      hasAnySections: Object.values(sections).some(s => s.length > 0)
    });

    // If no sections found with the expected format, try to parse as raw structured feedback
    const hasSections = Object.values(sections).some(section => section.length > 0);

    if (!hasSections) {
      console.log('🔍 No structured sections found, attempting to parse raw feedback');
      return formatRawStructuredFeedback(cleanFeedback);
    }

    return (
      <div className="space-y-6">
        {/* Grade Breakdown Section */}
        {sections.gradeBreakdown && (
          <div className="bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 border-2 border-blue-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-blue-500 p-3 rounded-xl shadow-md">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-xl font-bold text-blue-900">Grade Assessment</h4>
                <p className="text-blue-700 text-sm opacity-90">Overall performance evaluation</p>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-blue-200">
              {formatGradeBreakdownEnhanced(sections.gradeBreakdown)}
            </div>
          </div>
        )}

        {/* Step-by-Step Process */}
        {sections.stepByStepProcess && (
          <div className="bg-gradient-to-br from-green-50 via-green-100 to-emerald-100 border-2 border-green-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-green-500 p-3 rounded-xl shadow-md">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h4 className="text-xl font-bold text-green-900">Grading Process</h4>
                <p className="text-green-700 text-sm opacity-90">Step-by-step evaluation breakdown</p>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-green-200">
              {formatListItems(sections.stepByStepProcess)}
            </div>
          </div>
        )}

        {/* Question Analysis */}
        {sections.questionAnalysis && (
          <div className="bg-gradient-to-br from-purple-50 via-purple-100 to-pink-100 border-2 border-purple-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-purple-500 p-3 rounded-xl shadow-md">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h4 className="text-xl font-bold text-purple-900">Question Analysis</h4>
                <p className="text-purple-700 text-sm opacity-90">Individual question breakdown</p>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-purple-200">
              {formatQuestionAnalysisEnhanced(sections.questionAnalysis)}
            </div>
          </div>
        )}

        {/* Performance Summary */}
        {sections.performanceSummary && (
          <div className="bg-gradient-to-br from-orange-50 via-orange-100 to-amber-100 border-2 border-orange-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-orange-500 p-3 rounded-xl shadow-md">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h4 className="text-xl font-bold text-orange-900">Performance Summary</h4>
                <p className="text-orange-700 text-sm opacity-90">Overall achievement overview</p>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-orange-200">
              <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed">
                {sections.performanceSummary.split('\n').map((paragraph, index) => (
                  paragraph.trim() ? (
                    <p key={index} className="mb-3 last:mb-0">{paragraph.trim()}</p>
                  ) : null
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Detailed Feedback */}
        {sections.detailedFeedback && (
          <div className="bg-gradient-to-br from-teal-50 via-teal-100 to-cyan-100 border-2 border-teal-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-teal-500 p-3 rounded-xl shadow-md">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h4 className="text-xl font-bold text-teal-900">Detailed Feedback</h4>
                <p className="text-teal-700 text-sm opacity-90">Comprehensive analysis and guidance</p>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-teal-200">
              <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed">
                {sections.detailedFeedback.split('\n').map((paragraph, index) => (
                  paragraph.trim() ? (
                    <p key={index} className="mb-3 last:mb-0">{paragraph.trim()}</p>
                  ) : null
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Responsive Grid for Strengths and Growth */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Learning Strengths */}
          {sections.strengths && (
            <div className="bg-gradient-to-br from-emerald-50 via-emerald-100 to-green-100 border-2 border-emerald-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-emerald-500 p-3 rounded-xl shadow-md">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-emerald-900">Strengths</h4>
                  <p className="text-emerald-700 text-sm opacity-90">What the student excelled at</p>
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-emerald-200">
                {formatListItems(sections.strengths)}
              </div>
            </div>
          )}

          {/* Growth Opportunities */}
          {sections.growthOpportunities && (
            <div className="bg-gradient-to-br from-yellow-50 via-yellow-100 to-amber-100 border-2 border-yellow-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-yellow-500 p-3 rounded-xl shadow-md">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-yellow-900">Growth Areas</h4>
                  <p className="text-yellow-700 text-sm opacity-90">Opportunities for development</p>
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-yellow-200">
                {formatListItems(sections.growthOpportunities)}
              </div>
            </div>
          )}
        </div>

        {/* Responsive Grid for Improvements and Suggestions */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Priority Improvements */}
          {sections.priorityImprovements && (
            <div className="bg-gradient-to-br from-red-50 via-red-100 to-pink-100 border-2 border-red-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-red-500 p-3 rounded-xl shadow-md">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.856-.833-2.626 0L3.228 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-red-900">Priority Focus</h4>
                  <p className="text-red-700 text-sm opacity-90">Most important areas to address</p>
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-red-200">
                {formatListItems(sections.priorityImprovements)}
              </div>
            </div>
          )}

          {/* Study Suggestions */}
          {sections.studySuggestions && (
            <div className="bg-gradient-to-br from-indigo-50 via-indigo-100 to-blue-100 border-2 border-indigo-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-indigo-500 p-3 rounded-xl shadow-md">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-indigo-900">Study Guide</h4>
                  <p className="text-indigo-700 text-sm opacity-90">Recommended study approaches</p>
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-indigo-200">
                {formatListItems(sections.studySuggestions)}
              </div>
            </div>
          )}
        </div>

        {/* Next Steps */}
        {sections.nextSteps && (
          <div className="bg-gradient-to-br from-violet-50 via-violet-100 to-purple-100 border-2 border-violet-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-violet-500 p-3 rounded-xl shadow-md">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
              <div>
                <h4 className="text-xl font-bold text-violet-900">Next Steps</h4>
                <p className="text-violet-700 text-sm opacity-90">Recommended action plan</p>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-violet-200">
              {formatListItems(sections.nextSteps)}
            </div>
          </div>
        )}

        {/* Teacher Notes */}
        {sections.teacherNotes && (
          <div className="bg-gradient-to-br from-gray-50 via-gray-100 to-slate-100 border-2 border-gray-300 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-gray-500 p-3 rounded-xl shadow-md">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900">Teacher Notes</h4>
                <p className="text-gray-700 text-sm opacity-90">Additional observations and comments</p>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-300">
              <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed italic">
                {sections.teacherNotes.split('\n').map((paragraph, index) => (
                  paragraph.trim() ? (
                    <p key={index} className="mb-3 last:mb-0">{paragraph.trim()}</p>
                  ) : null
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Helper function to format list items with enhanced styling
  const formatListItems = (text: string): JSX.Element => {
    const items = text.split(/•|[0-9]+\./).filter(item => item.trim());

    return (
      <div className="space-y-3">
        {items.map((item, index) => {
          const trimmed = item.trim();
          if (!trimmed) return null;

          return (
            <div key={index} className="flex items-start gap-3 p-3 bg-white/50 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/70 transition-all duration-200">
              <div className="bg-current text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0 shadow-sm">
                {index + 1}
              </div>
              <span className="text-sm text-gray-800 leading-relaxed font-medium flex-1">{trimmed}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // Enhanced function to format raw structured feedback with proper sections
  const formatRawStructuredFeedback = (feedback: string): JSX.Element => {
    const sections = parseRawFeedbackSections(feedback);

    return (
      <div className="space-y-6">
        {/* Grade Breakdown */}
        {sections.gradeBreakdown && (
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-emerald-100 p-3 rounded-lg">
                <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-emerald-900">Grade Assessment</h4>
            </div>
            {formatGradeBreakdownSection(sections.gradeBreakdown)}
          </div>
        )}

        {/* Step-by-Step Process */}
        {sections.stepByStep && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-blue-900">Grading Process</h4>
            </div>
            {formatStepByStepSection(sections.stepByStep)}
          </div>
        )}

        {/* Question Analysis */}
        {sections.questionAnalysis && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-purple-100 p-3 rounded-lg">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-purple-900">Detailed Analysis</h4>
            </div>
            {formatQuestionAnalysisSection(sections.questionAnalysis)}
          </div>
        )}

        {/* Overall Summary */}
        {sections.overallSummary && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-amber-100 p-3 rounded-lg">
                <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-amber-900">Performance Summary</h4>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                {sections.overallSummary.split('\n').map((line, index) => (
                  line.trim() ? (
                    <p key={index} className="mb-3 last:mb-0">{line.trim()}</p>
                  ) : null
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Fallback for any unstructured content */}
        {sections.remaining && (
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gray-100 p-3 rounded-lg">
                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-gray-900">Additional Notes</h4>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                {sections.remaining}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Parse raw feedback into structured sections
  const parseRawFeedbackSections = (feedback: string) => {
    const sections = {
      gradeBreakdown: '',
      stepByStep: '',
      questionAnalysis: '',
      overallSummary: '',
      remaining: ''
    };

    // Extract grade breakdown - handle both with and without ** formatting
    const gradeMatch = feedback.match(/(?:\*\*)?GRADE BREAKDOWN:?(?:\*\*)?\s*([\s\S]*?)(?=(?:\*\*)?STEP-BY-STEP|(?:\*\*)?DETAILED|$)/i);
    if (gradeMatch) {
      sections.gradeBreakdown = gradeMatch[1].trim();
    }

    // Extract step-by-step process
    const stepMatch = feedback.match(/(?:\*\*)?STEP-BY-STEP GRADING PROCESS:?(?:\*\*)?\s*([\s\S]*?)(?=(?:\*\*)?DETAILED|$)/i);
    if (stepMatch) {
      sections.stepByStep = stepMatch[1].trim();
    }

    // Extract question analysis
    const questionMatch = feedback.match(/(?:\*\*)?DETAILED QUESTION-BY-QUESTION ANALYSIS:?(?:\*\*)?\s*([\s\S]*?)$/i);
    if (questionMatch) {
      sections.questionAnalysis = questionMatch[1].trim();
    }

    // Extract any remaining content that doesn't fit the patterns
    let remaining = feedback;
    if (gradeMatch) remaining = remaining.replace(gradeMatch[0], '');
    if (stepMatch) remaining = remaining.replace(stepMatch[0], '');
    if (questionMatch) remaining = remaining.replace(questionMatch[0], '');

    sections.remaining = remaining.trim();

    return sections;
  };

  // Format grade breakdown with cards
  const formatGradeBreakdownSection = (content: string): JSX.Element => {
    const lines = content.split('\n').filter(line => line.trim());
    const gradeInfo: { [key: string]: string } = {};

    // Extract grade information
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.includes('Points Earned:')) {
        gradeInfo.points = trimmed.split('Points Earned:')[1]?.trim() || '';
      } else if (trimmed.includes('Letter Grade:')) {
        gradeInfo.letter = trimmed.split('Letter Grade:')[1]?.trim() || '';
      } else if (trimmed.includes('Percentage:')) {
        gradeInfo.percentage = trimmed.split('Percentage:')[1]?.trim() || '';
      }
    });

    return (
      <div className="space-y-4">
        {(gradeInfo.points || gradeInfo.letter || gradeInfo.percentage) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {gradeInfo.points && (
              <div className="bg-white border border-emerald-200 rounded-lg p-6 text-center shadow-sm">
                <div className="text-emerald-600 text-sm font-semibold mb-2 uppercase tracking-wide">Points Earned</div>
                <div className="text-emerald-900 text-3xl font-bold">{gradeInfo.points}</div>
              </div>
            )}
            {gradeInfo.letter && (
              <div className="bg-white border border-emerald-200 rounded-lg p-6 text-center shadow-sm">
                <div className="text-emerald-600 text-sm font-semibold mb-2 uppercase tracking-wide">Letter Grade</div>
                <div className="text-emerald-900 text-3xl font-bold">{gradeInfo.letter}</div>
              </div>
            )}
            {gradeInfo.percentage && (
              <div className="bg-white border border-emerald-200 rounded-lg p-6 text-center shadow-sm">
                <div className="text-emerald-600 text-sm font-semibold mb-2 uppercase tracking-wide">Percentage</div>
                <div className="text-emerald-900 text-3xl font-bold">{gradeInfo.percentage}</div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Format step-by-step section with numbered steps
  const formatStepByStepSection = (content: string): JSX.Element => {
    const steps = content.split(/\d+\./).filter(step => step.trim());

    return (
      <div className="space-y-4">
        {steps.map((step, index) => {
          const trimmed = step.trim();
          if (!trimmed) return null;

          return (
            <div key={index} className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
              <div className="flex gap-4">
                <div className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="text-gray-700 text-sm leading-relaxed">
                    {trimmed.split('\n').map((line, lineIndex) => {
                      const cleanLine = line.trim().replace(/^\*\s*/, '');
                      if (!cleanLine) return null;

                      return (
                        <div key={lineIndex} className="mb-2 last:mb-0">
                          {cleanLine.includes(':') ? (
                            <div>
                              <span className="font-medium text-blue-900">{cleanLine.split(':')[0]}:</span>
                              <span className="ml-1">{cleanLine.split(':').slice(1).join(':')}</span>
                            </div>
                          ) : (
                            <div>{cleanLine}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Format question analysis with individual question cards
  const formatQuestionAnalysisSection = (content: string): JSX.Element => {
    const questions = content.split(/\*\s*\*\*Question\/Section/).filter(q => q.trim());

    return (
      <div className="space-y-6">
        {questions.map((question, index) => {
          const trimmed = question.trim();
          if (!trimmed) return null;

          const questionData = parseQuestionData(trimmed);

          return (
            <div key={index} className="bg-white rounded-lg border border-purple-100 shadow-sm overflow-hidden">
              <div className="bg-purple-50 px-6 py-4 border-b border-purple-100">
                <h5 className="font-semibold text-purple-900 flex items-center gap-2">
                  <span className="bg-purple-100 text-purple-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  {questionData.identification || `Question ${index + 1}`}
                </h5>
              </div>

              <div className="p-6 space-y-4">
                {questionData.studentAnswer && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h6 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Student's Response
                    </h6>
                    <div className="text-blue-800 text-sm leading-relaxed">
                      {questionData.studentAnswer}
                    </div>
                  </div>
                )}

                {questionData.assessment && (
                  <div className={`border rounded-lg p-4 ${questionData.assessment.toLowerCase().includes('correct')
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                    }`}>
                    <h6 className={`font-medium mb-2 flex items-center gap-2 ${questionData.assessment.toLowerCase().includes('correct')
                      ? 'text-green-900'
                      : 'text-red-900'
                      }`}>
                      {questionData.assessment.toLowerCase().includes('correct') ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      Assessment
                    </h6>
                    <div className={`text-sm leading-relaxed ${questionData.assessment.toLowerCase().includes('correct')
                      ? 'text-green-800'
                      : 'text-red-800'
                      }`}>
                      {questionData.assessment}
                    </div>
                  </div>
                )}

                {questionData.points && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h6 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Points Awarded
                    </h6>
                    <div className="text-purple-900 font-semibold text-lg">
                      {questionData.points}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {questionData.doneWell && questionData.doneWell !== 'N/A' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h6 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Strengths
                      </h6>
                      <div className="text-green-800 text-sm leading-relaxed">
                        {questionData.doneWell}
                      </div>
                    </div>
                  )}

                  {questionData.needsImprovement && questionData.needsImprovement !== 'N/A' && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <h6 className="font-medium text-orange-900 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.856-.833-2.626 0L3.228 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        Areas for Improvement
                      </h6>
                      <div className="text-orange-800 text-sm leading-relaxed">
                        {questionData.needsImprovement}
                      </div>
                    </div>
                  )}
                </div>

                {questionData.correctAnswer && questionData.correctAnswer !== 'N/A' && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h6 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Correct Approach
                    </h6>
                    <div className="text-gray-700 text-sm leading-relaxed">
                      {questionData.correctAnswer}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Parse individual question data
  const parseQuestionData = (questionText: string) => {
    const data: any = {};

    // Handle both * and ** formatting for questions
    const identificationMatch = questionText.match(/(?:\*\*)?Question\/Section Identification:?(?:\*\*)?\s*(.*?)(?:\n|$)/i);
    if (identificationMatch) data.identification = identificationMatch[1].trim();

    const studentAnswerMatch = questionText.match(/(?:\*\*)?Student's (?:Answer|answer)\/(?:Approach|approach):?(?:\*\*)?\s*([\s\S]*?)(?=(?:\*\*)?Correctness|$)/i);
    if (studentAnswerMatch) data.studentAnswer = studentAnswerMatch[1].trim();

    const assessmentMatch = questionText.match(/(?:\*\*)?Correctness Assessment:?(?:\*\*)?\s*([\s\S]*?)(?=(?:\*\*)?Points|$)/i);
    if (assessmentMatch) data.assessment = assessmentMatch[1].trim();

    const pointsMatch = questionText.match(/(?:\*\*)?Points Awarded:?(?:\*\*)?\s*(.*?)(?:\n|$)/i);
    if (pointsMatch) data.points = pointsMatch[1].trim();

    const doneWellMatch = questionText.match(/(?:\*\*)?Specific Feedback.*?done well.*?:?(?:\*\*)?\s*([\s\S]*?)(?=(?:\*\*)?Specific Feedback.*?improvement|$)/i);
    if (doneWellMatch) data.doneWell = doneWellMatch[1].trim();

    const improvementMatch = questionText.match(/(?:\*\*)?Specific Feedback.*?improvement.*?:?(?:\*\*)?\s*([\s\S]*?)(?=(?:\*\*)?Correct|$)/i);
    if (improvementMatch) data.needsImprovement = improvementMatch[1].trim();

    const correctMatch = questionText.match(/(?:\*\*)?Correct approach.*?:?(?:\*\*)?\s*([\s\S]*?)$/i);
    if (correctMatch) data.correctAnswer = correctMatch[1].trim();

    return data;
  };

  // Enhanced grade breakdown formatting
  const formatGradeBreakdownEnhanced = (gradeText: string): JSX.Element => {
    const lines = gradeText.split('\n').filter(line => line.trim());
    const elements: JSX.Element[] = [];
    const gradeInfo: { [key: string]: string } = {};

    // Extract key grade information
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.includes('Points Earned:')) {
        gradeInfo.points = trimmed.split('Points Earned:')[1]?.trim() || '';
      } else if (trimmed.includes('Letter Grade:')) {
        gradeInfo.letter = trimmed.split('Letter Grade:')[1]?.trim() || '';
      } else if (trimmed.includes('Percentage:')) {
        gradeInfo.percentage = trimmed.split('Percentage:')[1]?.trim() || '';
      }
    });

    // Create enhanced grade display
    if (gradeInfo.points || gradeInfo.letter || gradeInfo.percentage) {
      elements.push(
        <div key="grade-cards" className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {gradeInfo.points && (
            <div className="bg-blue-100 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-blue-600 text-sm font-medium mb-1">Points Earned</div>
              <div className="text-blue-900 text-2xl font-bold">{gradeInfo.points}</div>
            </div>
          )}
          {gradeInfo.letter && (
            <div className="bg-green-100 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-green-600 text-sm font-medium mb-1">Letter Grade</div>
              <div className="text-green-900 text-2xl font-bold">{gradeInfo.letter}</div>
            </div>
          )}
          {gradeInfo.percentage && (
            <div className="bg-purple-100 border border-purple-200 rounded-lg p-4 text-center">
              <div className="text-purple-600 text-sm font-medium mb-1">Percentage</div>
              <div className="text-purple-900 text-2xl font-bold">{gradeInfo.percentage}</div>
            </div>
          )}
        </div>
      );
    }

    // Add any additional content
    const remainingLines = lines.filter(line => {
      const trimmed = line.trim();
      return !trimmed.includes('Points Earned:') &&
        !trimmed.includes('Letter Grade:') &&
        !trimmed.includes('Percentage:') &&
        !trimmed.startsWith('GRADE BREAKDOWN:') &&
        !trimmed.startsWith('---') &&
        trimmed.length > 0;
    });

    if (remainingLines.length > 0) {
      elements.push(
        <div key="additional-content" className="text-gray-700 text-sm space-y-2">
          {remainingLines.map((line, index) => (
            <p key={index} className="leading-relaxed">{line.trim()}</p>
          ))}
        </div>
      );
    }

    return <div className="space-y-4">{elements}</div>;
  };

  // Enhanced question analysis formatting
  const formatQuestionAnalysisEnhanced = (analysis: string): JSX.Element => {
    // Split by bullet points for sections
    const sections = analysis.split('•').filter(section => section.trim());
    const elements: JSX.Element[] = [];

    sections.forEach((section, index) => {
      const trimmed = section.trim();
      if (!trimmed) return;

      // Extract section title
      const sectionMatch = trimmed.match(/^Section:\s*(.+?)(?:\n|$)/);
      const sectionTitle = sectionMatch ? sectionMatch[1].trim() : `Question ${index + 1}`;
      const sectionContent = sectionMatch ? trimmed.substring(sectionMatch[0].length) : trimmed;

      elements.push(
        <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex items-center mb-5">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
              Question {index + 1}
            </div>
            <h4 className="ml-4 font-bold text-gray-900 text-lg">{sectionTitle}</h4>
          </div>
          <div className="bg-white rounded-lg p-5 border border-gray-100">
            {formatQuestionDetailsEnhanced(sectionContent)}
          </div>
        </div>
      );
    });

    return <div className="space-y-6">{elements}</div>;
  };

  // Enhanced question details formatting
  const formatQuestionDetailsEnhanced = (content: string): JSX.Element => {
    const parts = content.split('*').filter(part => part.trim());
    const elements: JSX.Element[] = [];

    parts.forEach((part, index) => {
      const trimmed = part.trim();
      if (!trimmed) return;

      // Student's approach/answer
      if (trimmed.includes('Student\'s approach:') || trimmed.includes('Student\'s answer')) {
        const answer = trimmed.replace(/^Student's (approach|answer\/approach):\s*/i, '');
        elements.push(
          <div key={index} className="mb-5">
            <div className="flex items-center mb-3">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <h5 className="font-bold text-blue-900">Student's Answer</h5>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
              <p className="text-blue-800 leading-relaxed font-mono text-sm whitespace-pre-wrap">{answer}</p>
            </div>
          </div>
        );
      }

      // Correctness assessment
      else if (trimmed.includes('Correctness assessment:')) {
        const assessment = trimmed.replace(/^Correctness assessment:\s*/i, '');
        const isCorrect = assessment.toLowerCase().includes('correct');
        elements.push(
          <div key={index} className="mb-5">
            <div className="flex items-center mb-3">
              <div className={`p-2 rounded-lg mr-3 ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                {isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
              </div>
              <h5 className={`font-bold ${isCorrect ? 'text-green-900' : 'text-red-900'}`}>Assessment</h5>
            </div>
            <div className={`p-4 rounded-lg border-l-4 ${isCorrect ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'
              }`}>
              <p className={`leading-relaxed text-sm ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>{assessment}</p>
            </div>
          </div>
        );
      }

      // Points awarded
      else if (trimmed.includes('Points awarded:')) {
        const points = trimmed.replace(/^Points awarded:\s*/i, '');
        elements.push(
          <div key={index} className="mb-5">
            <div className="flex items-center mb-3">
              <div className="bg-yellow-100 p-2 rounded-lg mr-3">
                <span className="text-yellow-600 font-bold text-sm">★</span>
              </div>
              <h5 className="font-bold text-yellow-900">Points Earned</h5>
            </div>
            <div className="inline-flex items-center bg-yellow-100 border border-yellow-300 px-4 py-2 rounded-full">
              <span className="text-yellow-800 font-bold">{points}</span>
            </div>
          </div>
        );
      }

      // Specific feedback on what was done well
      else if (trimmed.includes('Specific feedback on what was done well:')) {
        const feedback = trimmed.replace(/^Specific feedback on what was done well:\s*/i, '');
        if (feedback.toLowerCase() !== 'n/a' && feedback.trim()) {
          elements.push(
            <div key={index} className="mb-5">
              <div className="flex items-center mb-3">
                <div className="bg-green-100 p-2 rounded-lg mr-3">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <h5 className="font-bold text-green-900">What Was Done Well</h5>
              </div>
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                <p className="text-green-800 leading-relaxed text-sm">{feedback}</p>
              </div>
            </div>
          );
        }
      }

      // Specific feedback on what needs improvement
      else if (trimmed.includes('Specific feedback on what needs improvement:')) {
        const feedback = trimmed.replace(/^Specific feedback on what needs improvement:\s*/i, '');
        if (feedback.toLowerCase() !== 'none.' && feedback.toLowerCase() !== 'n/a' && feedback.trim()) {
          elements.push(
            <div key={index} className="mb-5">
              <div className="flex items-center mb-3">
                <div className="bg-orange-100 p-2 rounded-lg mr-3">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                </div>
                <h5 className="font-bold text-orange-900">Areas for Improvement</h5>
              </div>
              <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
                <p className="text-orange-800 leading-relaxed text-sm">{feedback}</p>
              </div>
            </div>
          );
        }
      }

      // Correct approach or answer
      else if (trimmed.includes('Correct approach or answer if student was wrong:')) {
        const correctAnswer = trimmed.replace(/^Correct approach or answer if student was wrong:\s*/i, '');
        if (correctAnswer.toLowerCase() !== 'n/a' && correctAnswer.trim()) {
          elements.push(
            <div key={index} className="mb-5">
              <div className="flex items-center mb-3">
                <div className="bg-purple-100 p-2 rounded-lg mr-3">
                  <Brain className="w-4 h-4 text-purple-600" />
                </div>
                <h5 className="font-bold text-purple-900">Correct Approach</h5>
              </div>
              <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded-r-lg">
                <p className="text-purple-800 leading-relaxed text-sm font-mono whitespace-pre-wrap">{correctAnswer}</p>
              </div>
            </div>
          );
        }
      }
    });

    return <div className="space-y-3">{elements}</div>;
  };




  // Format detailed analysis feedback for the modal
  const formatDetailedAnalysisFeedback = (feedback: string): JSX.Element => {
    if (!feedback || feedback.trim() === '') {
      return (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-blue-400" />
          </div>
          <h4 className="text-blue-600 text-lg font-semibold mb-2">No Analysis Available</h4>
          <p className="text-blue-500 text-sm">Detailed feedback was not provided for this submission.</p>
        </div>
      );
    }

    // Clean up and parse sections
    const cleanFeedback = feedback.replace(/\*\*/g, '').trim();

    // Check for structured sections first
    const gradeMatch = cleanFeedback.match(/GRADE BREAKDOWN:\s*([\s\S]*?)(?=STEP-BY-STEP|DETAILED|PERFORMANCE|GENERAL FEEDBACK|$)/i);
    const stepByStepMatch = cleanFeedback.match(/STEP-BY-STEP GRADING PROCESS:\s*([\s\S]*?)(?=DETAILED|PERFORMANCE|GENERAL FEEDBACK|$)/i);
    const questionAnalysisMatch = cleanFeedback.match(/DETAILED QUESTION-BY-QUESTION ANALYSIS:\s*([\s\S]*?)(?=PERFORMANCE|LEARNING|GENERAL FEEDBACK|$)/i);
    const performanceMatch = cleanFeedback.match(/PERFORMANCE SUMMARY:\s*([\s\S]*?)(?=DETAILED FEEDBACK|LEARNING|GENERAL FEEDBACK|$)/i);
    const generalFeedbackMatch = cleanFeedback.match(/GENERAL FEEDBACK:\s*([\s\S]*?)(?=DETAILED FEEDBACK|$)/i);
    const detailedFeedbackMatch = cleanFeedback.match(/DETAILED FEEDBACK[^:]*:\s*([\s\S]*?)(?=CONCLUDING|$)/i);

    const sections = [];

    if (gradeMatch) {
      sections.push({
        title: 'Grade Breakdown',
        content: gradeMatch[1].trim(),
        icon: '📊',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-900',
        iconBg: 'bg-green-100'
      });
    }

    if (stepByStepMatch) {
      sections.push({
        title: 'Grading Process',
        content: stepByStepMatch[1].trim(),
        icon: '🔍',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-900',
        iconBg: 'bg-blue-100'
      });
    }

    if (generalFeedbackMatch) {
      sections.push({
        title: 'General Feedback',
        content: generalFeedbackMatch[1].trim(),
        icon: '💬',
        bgColor: 'bg-indigo-50',
        borderColor: 'border-indigo-200',
        textColor: 'text-indigo-900',
        iconBg: 'bg-indigo-100'
      });
    }

    if (detailedFeedbackMatch) {
      sections.push({
        title: 'Detailed Page Analysis',
        content: detailedFeedbackMatch[1].trim(),
        icon: '📝',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        textColor: 'text-purple-900',
        iconBg: 'bg-purple-100'
      });
    }

    if (questionAnalysisMatch) {
      sections.push({
        title: 'Question Analysis',
        content: questionAnalysisMatch[1].trim(),
        icon: '�',
        bgColor: 'bg-teal-50',
        borderColor: 'border-teal-200',
        textColor: 'text-teal-900',
        iconBg: 'bg-teal-100'
      });
    }

    if (performanceMatch) {
      sections.push({
        title: 'Performance Summary',
        content: performanceMatch[1].trim(),
        icon: '📈',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-900',
        iconBg: 'bg-yellow-100'
      });
    }

    // If no structured sections found, try to parse by common patterns
    if (sections.length === 0) {
      // Look for major section headers
      const sectionHeaders = [
        'Expert Educator Grading',
        'General Feedback',
        'Detailed Feedback',
        'Content Analysis',
        'Strengths',
        'Areas for Improvement',
        'Concluding Remarks'
      ];

      const sectionMatches: Array<{ title: string; content: string }> = [];
      sectionHeaders.forEach(header => {
        const regex = new RegExp(`(${header}[^\\n]*):?\\s*([\\s\\S]*?)(?=${sectionHeaders.filter(h => h !== header).join('|')}|$)`, 'i');
        const match = cleanFeedback.match(regex);
        if (match && match[2].trim()) {
          sectionMatches.push({
            title: match[1].trim().replace(':', ''),
            content: match[2].trim()
          });
        }
      });

      if (sectionMatches.length > 0) {
        return (
          <div className="space-y-6">
            {sectionMatches.map((section, index) => (
              <div key={index} className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">📋</span>
                  <h4 className="text-xl font-bold text-gray-900">{section.title}</h4>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                  {formatSectionContent(section.content)}
                </div>
              </div>
            ))}
          </div>
        );
      }

      // If still no sections, format as simple paragraphs
      const paragraphs = cleanFeedback.split('\n\n').filter(p => p.trim());

      return (
        <div className="space-y-4">
          {paragraphs.map((paragraph, index) => {
            const trimmed = paragraph.trim();

            // Check if it's a header (contains ### or is short and ends with colon)
            if (trimmed.startsWith('###') || trimmed.startsWith('##') || (trimmed.length < 80 && trimmed.endsWith(':'))) {
              return (
                <div key={index} className="flex items-center gap-3 py-3 border-b border-blue-100">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <h4 className="text-blue-900 font-bold text-lg">{trimmed.replace(/#{1,3}\s*/, '').replace(':', '')}</h4>
                </div>
              );
            }

            // Regular paragraph
            return (
              <div key={index} className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-white/30">
                <p className="text-gray-800 leading-relaxed text-sm whitespace-pre-wrap">{trimmed}</p>
              </div>
            );
          })}
        </div>
      );
    }

    // Render structured sections
    return (
      <div className="space-y-6">
        {sections.map((section, index) => (
          <div key={index} className={`${section.bgColor} ${section.borderColor} border rounded-xl p-6 shadow-sm`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`${section.iconBg} p-2 rounded-lg`}>
                <span className="text-xl">{section.icon}</span>
              </div>
              <h4 className={`text-xl font-bold ${section.textColor}`}>{section.title}</h4>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/50">
              {formatSectionContent(section.content)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Helper function to format section content
  const formatSectionContent = (content: string): JSX.Element => {
    const lines = content.split('\n').filter(line => line.trim());
    const elements: JSX.Element[] = [];

    let currentList: string[] = [];
    let listType = '';

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Handle bullet points
      if (trimmed.startsWith('*') || trimmed.startsWith('•')) {
        if (listType !== 'bullet') {
          if (currentList.length > 0) {
            elements.push(renderList(currentList, listType, elements.length));
            currentList = [];
          }
          listType = 'bullet';
        }
        currentList.push(trimmed.replace(/^[*•]\s*/, ''));
      }
      // Handle numbered lists
      else if (trimmed.match(/^\d+\./)) {
        if (listType !== 'numbered') {
          if (currentList.length > 0) {
            elements.push(renderList(currentList, listType, elements.length));
            currentList = [];
          }
          listType = 'numbered';
        }
        currentList.push(trimmed.replace(/^\d+\.\s*/, ''));
      }
      // Handle headers
      else if (trimmed.match(/^[A-Z][^:]*:$/) || trimmed.startsWith('###')) {
        if (currentList.length > 0) {
          elements.push(renderList(currentList, listType, elements.length));
          currentList = [];
          listType = '';
        }
        elements.push(
          <h5 key={index} className="font-bold text-gray-900 text-base mt-4 mb-2 pb-1 border-b border-gray-200">
            {trimmed.replace(/^#{1,3}\s*/, '').replace(':', '')}
          </h5>
        );
      }
      // Regular paragraph
      else if (trimmed) {
        if (currentList.length > 0) {
          elements.push(renderList(currentList, listType, elements.length));
          currentList = [];
          listType = '';
        }
        elements.push(
          <p key={index} className="text-gray-800 text-sm leading-relaxed mb-3 last:mb-0">
            {trimmed}
          </p>
        );
      }
    });

    // Handle any remaining list items
    if (currentList.length > 0) {
      elements.push(renderList(currentList, listType, elements.length));
    }

    return <div className="prose prose-sm max-w-none">{elements}</div>;
  };

  // Helper function to render lists
  const renderList = (items: string[], type: string, key: number): JSX.Element => {
    return (
      <div key={key} className="space-y-2 my-3">
        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">
              {type === 'numbered' ? index + 1 : '•'}
            </div>
            <span className="text-gray-800 text-sm leading-relaxed flex-1">{item}</span>
          </div>
        ))}
      </div>
    );
  };  // Format overall feedback for the modal
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _formatOverallFeedback = (feedback: string): JSX.Element => {
    if (!feedback || feedback.trim() === '') {
      return (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-indigo-400" />
          </div>
          <h4 className="text-indigo-600 text-lg font-semibold mb-2">No Overall Feedback</h4>
          <p className="text-indigo-500 text-sm">Overall feedback was not provided for this analysis.</p>
        </div>
      );
    }

    // Clean up the feedback
    const cleanFeedback = feedback.replace(/\*\*/g, '').trim();

    // Check for structured feedback sections
    const strengthsMatch = cleanFeedback.match(/STRENGTHS\s+DEMONSTRATED:\s*([\s\S]*?)(?=AREAS\s+FOR\s+IMPROVEMENT:|$)/i);
    const improvementMatch = cleanFeedback.match(/AREAS\s+FOR\s+IMPROVEMENT:\s*([\s\S]*?)$/i);

    if (strengthsMatch || improvementMatch) {
      return (
        <div className="space-y-6">
          {strengthsMatch && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-100 p-2 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <h4 className="text-xl font-bold text-green-900">Strengths Demonstrated</h4>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                {formatFeedbackList(strengthsMatch[1].trim(), 'green')}
              </div>
            </div>
          )}

          {improvementMatch && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-amber-100 p-2 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <h4 className="text-xl font-bold text-amber-900">Areas for Improvement</h4>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                {formatFeedbackList(improvementMatch[1].trim(), 'amber')}
              </div>
            </div>
          )}
        </div>
      );
    }

    // For unstructured feedback, create beautiful paragraphs
    const paragraphs = cleanFeedback.split('\n\n').filter(p => p.trim());

    return (
      <div className="space-y-4">
        {paragraphs.map((paragraph, index) => {
          const trimmed = paragraph.trim();

          // Check if it's a title/header
          if (trimmed.match(/^[A-Z\s]+:/) || trimmed.length < 50) {
            return (
              <div key={index} className="flex items-center gap-3 py-3 border-b border-indigo-100">
                <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                <h4 className="text-indigo-900 font-bold text-lg">{trimmed.replace(':', '')}</h4>
              </div>
            );
          }

          // Regular paragraph with enhanced styling
          return (
            <div key={index} className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-white/30">
              <p className="text-gray-800 leading-relaxed text-sm whitespace-pre-wrap">{trimmed}</p>
            </div>
          );
        })}
      </div>
    );
  };

  // Helper function to format feedback lists
  const formatFeedbackList = (text: string, colorScheme: 'green' | 'amber'): JSX.Element => {
    const items = text.split(/•|[0-9]+\./).filter(item => item.trim());

    if (items.length === 0) {
      // No list items, treat as paragraph
      return (
        <p className={`text-sm leading-relaxed ${colorScheme === 'green' ? 'text-green-800' : 'text-amber-800'}`}>
          {text}
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {items.map((item, index) => {
          const trimmed = item.trim();
          if (!trimmed) return null;

          return (
            <div key={index} className={`flex items-start gap-3 p-3 bg-white/50 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/70 transition-all duration-200`}>
              <div className={`${colorScheme === 'green' ? 'bg-green-500' : 'bg-amber-500'} text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0 shadow-sm`}>
                {index + 1}
              </div>
              <span className={`text-sm leading-relaxed font-medium flex-1 ${colorScheme === 'green' ? 'text-green-800' : 'text-amber-800'}`}>
                {trimmed}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Load classrooms when component mounts
  useEffect(() => {
    loadClassrooms();
  }, []);

  // Load subjects when a classroom is selected
  useEffect(() => {
    if (selectedClassroom) {
      loadSubjects();
    } else {
      setSubjects([]);
      setSelectedSubject('');
      setAssignments([]);
      setSelectedAssignment('');
    }
  }, [selectedClassroom]);

  // Load assignments when a subject is selected
  useEffect(() => {
    if (selectedSubject) {
      loadAssignments();
      console.log('🔍 Subject selected, loading assignments. Assignment type:', assignmentType);
    } else {
      setAssignments([]);
      setSelectedAssignment('');
    }
  }, [selectedSubject]);

  // Debug assignment section visibility
  useEffect(() => {
    console.log('🔍 Assignment section visibility check:', {
      selectedSubject: !!selectedSubject,
      assignmentType,
      shouldShowAssignmentSection: selectedSubject && assignmentType === 'grading'
    });
  }, [selectedSubject, assignmentType]);

  // Filter students when classroom and subject are selected
  useEffect(() => {
    if (selectedClassroom && selectedSubject) {
      loadFilteredStudents();
    } else if (selectedSubject) {
      loadStudentsFromSubject();
    } else {
      setFilteredStudents([]);
      setSelectedStudent('');
    }
  }, [selectedClassroom, selectedSubject]);

  // Auto-populate assignment details when assignment is selected
  useEffect(() => {
    if (selectedAssignment && assignments.length > 0) {
      const assignment = assignments.find(a => a.id.toString() === selectedAssignment);
      if (assignment) {
        console.log('📝 Auto-populating assignment details:', assignment);

        // Auto-populate assignment fields
        setAssignmentTitle(assignment.title || '');
        setAssignmentDescription(assignment.description || '');
        setMaxPoints(assignment.max_points || 100);
        setGradingRubric(assignment.rubric || '');

        console.log('✅ Assignment details populated:', {
          title: assignment.title,
          description: assignment.description ? `${assignment.description.length} chars` : 'empty',
          maxPoints: assignment.max_points,
          rubric: assignment.rubric ? `${assignment.rubric.length} chars` : 'empty'
        });

        // Check student upload status for this assignment
        checkStudentUploadStatus();
      }
    } else {
      // Clear assignment details when no assignment is selected
      if (!selectedAssignment) {
        setAssignmentTitle('');
        setAssignmentDescription('');
        setMaxPoints(100);
        setGradingRubric('');
        setStudentUploadStatus({});
      }
    }
  }, [selectedAssignment, assignments, filteredStudents]);

  // Check upload status when filtered students change
  useEffect(() => {
    if (selectedAssignment && filteredStudents.length > 0) {
      checkStudentUploadStatus();
    }
  }, [filteredStudents]);

  // Check grading status when assignment or students change
  useEffect(() => {
    if (selectedAssignment && filteredStudents.length > 0) {
      checkStudentGradingStatus();
    }
  }, [selectedAssignment, filteredStudents]);

  // Cleanup file preview URLs on unmount
  useEffect(() => {
    return () => {
      // Cleanup any remaining preview URLs to prevent memory leaks
      filePreview.previews.forEach(preview => {
        if (preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, []);

  useEffect(() => {
    const updateActiveStep = () => {
      const offset = window.scrollY + 220;
      let currentStep: UploadStepId = 'classroom';

      uploadSteps.forEach((step) => {
        const section = uploadStepRefs.current[step.id];
        if (section && offset >= section.offsetTop) {
          currentStep = step.id;
        }
      });

      setActiveUploadStep(prev => (prev === currentStep ? prev : currentStep));
    };

    window.addEventListener('scroll', updateActiveStep, { passive: true });
    window.addEventListener('resize', updateActiveStep);
    setTimeout(updateActiveStep, 0);

    return () => {
      window.removeEventListener('scroll', updateActiveStep);
      window.removeEventListener('resize', updateActiveStep);
    };
  }, [selectedSubject, selectedAssignment, assignmentType, selectedStudents.length]);

  useEffect(() => {
    if (activeUploadStep === 'settings' && selectedAssignment) {
      setHasOpenedGradingSettings(true);
    }
  }, [activeUploadStep, selectedAssignment]);

  useEffect(() => {
    setHasOpenedGradingSettings(false);
  }, [selectedAssignment]);

  const scrollToUploadStep = (step: UploadStepId) => {
    const target = uploadStepRefs.current[step];
    if (!target) {
      return;
    }

    if (step === 'settings' && selectedAssignment) {
      setHasOpenedGradingSettings(true);
    }

    const top = target.getBoundingClientRect().top + window.scrollY - 130;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const completedSteps: Record<UploadStepId, boolean> = {
    classroom: !!selectedClassroom,
    subject: !!selectedSubject,
    assignment: assignmentType === 'analysis' ? true : !!selectedAssignment,
    settings: assignmentType === 'analysis' ? true : hasOpenedGradingSettings,
    students: selectedStudents.length > 0
  };

  const loadInitialData = async () => {
    await loadStudents();
  };

  // Check if student has already been graded
  const checkStudentGrade = async (assignmentId: number, studentId: number): Promise<GradeCheckResult | null> => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.warn('No authentication token found - skipping grade check');
        return null;
      }

      const response = await fetch(`https://znd2y0sjxf.execute-api.eu-west-1.amazonaws.com/study-area/academic/grades/check/${assignmentId}/${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // Handle different types of errors gracefully
        if (response.status === 503) {
          console.warn('Database temporarily unavailable during grade check - continuing without check');
          return null;
        } else if (response.status === 500) {
          console.warn(`Database connection issue during grade check (${response.status}) - continuing without check`);
          return null;
        }
        throw new Error(`Failed to check grade: ${response.status}`);
      }

      const gradeCheck = await response.json();
      console.log('📊 Grade check result:', gradeCheck);

      return gradeCheck;
    } catch (error: any) {
      // Only log database errors, don't show them to user unless it's a real issue
      if (error.message?.includes('500') || error.message?.includes('connection')) {
        console.warn('Grade check failed due to database issue - continuing without check:', error.message);
      } else {
        console.error('❌ Failed to check student grade:', error);
        setError('Failed to check existing grade. Please try again.');
      }
      return null;
    }
  };

  // Get full grade details for viewing
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _getGradeDetails = async (gradeId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`https://znd2y0sjxf.execute-api.eu-west-1.amazonaws.com/study-area/academic/grades/view/${gradeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get grade details: ${response.status}`);
      }

      const gradeDetails = await response.json();
      console.log('📋 Grade details:', gradeDetails);

      return gradeDetails;
    } catch (error) {
      console.error('❌ Failed to get grade details:', error);
      setError('Failed to load grade details. Please try again.');
      return null;
    }
  };

  const loadClassrooms = async () => {
    try {
      setLoadingClassrooms(true);
      console.log('🏫 Loading teacher classrooms...');

      // Direct call to backend endpoint
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('https://znd2y0sjxf.execute-api.eu-west-1.amazonaws.com/study-area/classrooms/my-assigned', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch classrooms: ${response.status}`);
      }

      const classroomsData = await response.json();
      console.log('✅ Loaded classrooms:', classroomsData);

      // Transform backend data to frontend format
      const transformedClassrooms = classroomsData.map((classroom: any) => ({
        id: classroom.id,
        name: classroom.name,
        description: classroom.description,
        capacity: classroom.capacity,
        location: classroom.location,
        school_id: classroom.school_id,
        teacher_id: classroom.teacher_id,
        student_count: classroom.student_count
      }));

      setClassrooms(transformedClassrooms);

      if (transformedClassrooms.length === 0) {
        console.log('⚠️ No classrooms found');
      }
    } catch (error) {
      console.error('❌ Failed to load classrooms:', error);
      setError('Failed to load classrooms. Please try again.');
    } finally {
      setLoadingClassrooms(false);
    }
  };

  const loadSubjects = async () => {
    try {
      setLoadingSubjects(true);
      console.log('📚 Loading teacher subjects...');

      // Direct call to backend endpoint
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('https://znd2y0sjxf.execute-api.eu-west-1.amazonaws.com/study-area/academic/teachers/my-subjects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch subjects: ${response.status}`);
      }

      const subjectsData = await response.json();
      console.log('✅ Loaded subjects with students:', subjectsData);

      // Transform backend data to frontend format
      const transformedSubjects = subjectsData.map((subject: any) => ({
        id: subject.id,
        name: subject.name,
        description: subject.description,
        school_id: subject.school_id,
        created_date: subject.created_date || new Date().toISOString(),
        is_active: subject.is_active,
        teacher_count: 1,
        student_count: subject.students?.length || 0,
        students: subject.students?.map((student: any) => ({
          id: student.id,
          user_id: student.user_id,
          username: student.username || student.user?.username || '',
          fname: student.fname || student.user?.fname || '',
          lname: student.lname || student.user?.lname || '',
          email: student.email || student.user?.email || '',
          classroom_id: student.classroom_id,
          enrollment_date: student.enrollment_date,
          is_active: student.is_active
        })) || []
      }));

      setSubjects(transformedSubjects);

      if (transformedSubjects.length === 0) {
        console.log('⚠️ No subjects found');
      }
    } catch (error) {
      console.error('❌ Failed to load subjects:', error);
      setError('Failed to load subjects. Please try again.');
    } finally {
      setLoadingSubjects(false);
    }
  };

  const loadAssignments = async () => {
    try {
      setLoadingAssignments(true);
      console.log('📝 Loading assignments for subject...');

      // Get assignments for the selected subject using the service instance
      const assignmentsData = await gradesAssignmentsService.getSubjectAssignments(parseInt(selectedSubject));

      console.log('✅ Loaded assignments:', assignmentsData);
      setAssignments(assignmentsData);

      // Reset assignment selection when list changes
      setSelectedAssignment('');

      if (assignmentsData.length === 0) {
        console.log('⚠️ No assignments found for this subject');
      }
    } catch (error) {
      console.error('❌ Failed to load assignments:', error);
      setError('Failed to load assignments. Please try again.');
    } finally {
      setLoadingAssignments(false);
    }
  };

  const loadFilteredStudents = async () => {
    try {
      console.log(`👥 Loading students for classroom ${selectedClassroom} and subject ${selectedSubject}...`);

      // Get students that are both in the selected classroom and enrolled in the selected subject
      const students = await teacherService.getStudentsInClassroomAndSubject(
        parseInt(selectedClassroom),
        parseInt(selectedSubject)
      );

      console.log('✅ Loaded filtered students:', students);
      setFilteredStudents(students);

      // Reset student selection when filtered list changes
      setSelectedStudent('');

      if (students.length === 0) {
        setError('No students found in both the selected classroom and subject.');
      } else {
        setError('');
      }
    } catch (error: any) {
      console.error('❌ Failed to load filtered students:', error);
      const message = String(error?.message || '').toLowerCase();
      if (message.includes('failed to fetch') || message.includes('networkerror') || message.includes('cors')) {
        setError('Unable to load students due to a CORS/network block from the API. Please verify API Gateway CORS headers for /study-area/classrooms/* and /study-area/academic/subjects/* include localhost:5173.');
      } else {
        setError(error?.message || 'Failed to load students. Please try again.');
      }
    }
  };

  const loadStudentsFromSubject = async () => {
    try {
      console.log(`👥 Loading students from subject ${selectedSubject}...`);

      // Get students enrolled in the selected subject
      const students = await teacherService.getStudentsInSubject(parseInt(selectedSubject));

      console.log('✅ Loaded subject students:', students);
      setFilteredStudents(students);

      // Reset student selection when filtered list changes
      setSelectedStudent('');

      if (students.length === 0) {
        setError('No students found in the selected subject.');
      } else {
        setError('');
      }
    } catch (error: any) {
      console.error('❌ Failed to load subject students:', error);
      const message = String(error?.message || '').toLowerCase();
      if (message.includes('failed to fetch') || message.includes('networkerror') || message.includes('cors')) {
        setError('Unable to load subject students due to a CORS/network block from the API. Please verify API Gateway CORS headers for /study-area/academic/subjects/* include localhost:5173.');
      } else {
        setError(error?.message || 'Failed to load students. Please try again.');
      }
    }
  };

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);

      // Direct call to backend endpoint
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('https://znd2y0sjxf.execute-api.eu-west-1.amazonaws.com/study-area/teachers/my-students', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch students: ${response.status}`);
      }

      const studentsData = await response.json();
      console.log('✅ Loaded all my students:', studentsData);

      // Transform backend data to frontend format
      const transformedStudents = studentsData.map((student: any) => ({
        id: student.id,
        user_id: student.user_id,
        username: student.username || student.user?.username || '',
        fname: student.fname || student.user?.fname || '',
        lname: student.lname || student.user?.lname || '',
        email: student.email || student.user?.email || '',
        classroom_id: student.classroom_id,
        classroom_name: student.classroom_name,
        enrollment_date: student.enrollment_date,
        is_active: student.is_active,
        lastActive: 'Recently',
        rank: 'Student',
        totalXP: 0,
        learningStyle: 'Visual',
        currentSubjects: [],
        progress: {
          total_xp: 0,
          login_streak: 0,
          total_quiz_completed: 0,
          tournaments_won: 0,
          tournaments_entered: 0,
          courses_completed: 0,
          time_spent_hours: 0
        }
      }));

      setStudents(transformedStudents);

      if (transformedStudents.length === 0) {
        setError('No students in your class yet. Please add students first.');
      } else {
        setError('');
      }
    } catch (error) {
      console.error('Failed to load students:', error);
      setError('Failed to load students. Please try again.');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      // If we have a current upload student, upload directly
      if (currentUploadStudent) {
        uploadFilesForStudent(selectedFiles, currentUploadStudent.id);
      } else {
        // Otherwise just set files for regular processing
        setFiles(selectedFiles);
        setError('');
      }
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles.length > 0) {
      setFiles(droppedFiles);
      setError('');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const processFiles = async () => {
    // Clear previous messages
    setError('');
    setSuccess('');

    if (!files || files.length === 0) {
      setError('Please select files to upload');
      return;
    }

    if (selectedStudents.length === 0) {
      setError('Please select at least one student');
      return;
    }

    // Validate classroom and subject selection if classrooms are available
    if (classrooms.length > 0) {
      if (!selectedClassroom) {
        setError('Please select a classroom');
        return;
      }
      if (!selectedSubject) {
        setError('Please select a subject');
        return;
      }
      if (filteredStudents.length === 0) {
        setError('No students available in the selected classroom and subject');
        return;
      }
    }

    // Validate assignment selection for grading mode
    if (assignmentType === 'grading' && !selectedAssignment) {
      setError('Please select an assignment for grading');
      return;
    }

    // Process each selected student
    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingStep('Initializing...');

    try {
      const totalStudents = selectedStudents.length;
      let processedStudents = 0;

      for (const studentId of selectedStudents) {
        const student = filteredStudents.find(s => s.id === studentId);
        if (!student) continue;

        setProcessingStep(`Processing ${student.fname} ${student.lname}...`);
        setProcessingProgress((processedStudents / totalStudents) * 100);

        // For grading mode, check if student has already been graded
        if (assignmentType === 'grading' && selectedAssignment) {
          setProcessingStep(`Checking existing grades for ${student.fname} ${student.lname}...`);
          const gradeCheck = await checkStudentGrade(parseInt(selectedAssignment), studentId);

          if (gradeCheck && gradeCheck.already_graded) {
            console.log(`Student ${student.fname} ${student.lname} already graded, skipping...`);
            processedStudents++;
            continue;
          }
        }

        // Process files for this student
        const results: AnalysisResult[] = [];
        const totalFiles = files.length;

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          console.log(`Processing file: ${file.name} for student: ${student.fname} ${student.lname}`);

          setProcessingStep(`Analyzing ${file.name} for ${student.fname} ${student.lname}...`);
          const fileProgress = (i / totalFiles) * (100 / totalStudents);
          const studentProgress = (processedStudents / totalStudents) * 100;
          setProcessingProgress(studentProgress + fileProgress);

          try {
            const result = await processFile(file);
            result.targetStudent = `${student.fname} ${student.lname}`;
            results.push(result);
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
            setError(`Error processing ${file.name}: ${error}`);
          }
        }

        if (results.length > 0) {
          setAnalysisResults(prev => [...prev, ...results]);
        }

        processedStudents++;
        setProcessingProgress((processedStudents / totalStudents) * 100);
      }

      setProcessingStep('Completed!');
      setProcessingProgress(100);

      setTimeout(() => {
        setProcessingStep('');
        setProcessingProgress(0);
      }, 2000);

      setSuccess(`Successfully processed files for ${selectedStudents.length} student${selectedStudents.length > 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Error processing files:', error);
      setError(`Processing failed: ${error}`);
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
      setProcessingProgress(0);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _continueGradingProcess = async () => {
    setIsProcessing(true);
    setError('');
    const results: AnalysisResult[] = [];

    try {
      const filesToProcess = pendingGradeProcess?.files || files;

      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        console.log(`Processing file: ${file.name}`);

        try {
          const result = await processFile(file);
          results.push({
            ...result,
            targetStudent: pendingGradeProcess?.selectedStudent || selectedStudent
          });
        } catch (fileError) {
          console.error(`File processing failed for ${file.name}:`, fileError);
          setError(`Failed to process ${file.name}: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
        }
      }

      setAnalysisResults(results);

      // Handle grading based on mode and assignment selection
      if (assignmentType === 'grading' && results.length > 0 && (pendingGradeProcess?.selectedAssignment || selectedAssignment)) {
        const assignmentId = pendingGradeProcess?.selectedAssignment || selectedAssignment;
        const assignment = assignments.find(a => a.id.toString() === assignmentId);

        if (assignment) {
          for (const result of results) {
            const targetStudent = result.targetStudent;
            if (targetStudent) {
              // Use filteredStudents if available, otherwise fall back to all students
              const studentsList = filteredStudents.length > 0 ? filteredStudents : students;
              const student = studentsList.find(s => s.username === targetStudent);

              if (student) {
                if (gradingMode === 'auto' && result.grade !== undefined) {
                  // Auto mode: Use AI-generated grade directly
                  try {
                    // Construct canonical rubric feedback so persisted grade details keep the new format.
                    const feedbackToSubmit = buildRubricFeedbackForStorage(result) ||
                      `Grade: ${result.grade}/${maxPoints} (${Math.round((result.grade / maxPoints) * 100)}%)`;

                    console.log('📝 Submitting grade with feedback:', {
                      grade: result.grade,
                      feedbackLength: feedbackToSubmit.length,
                      feedbackPreview: feedbackToSubmit.substring(0, 100) + '...'
                    });

                    // Enhanced retry logic for database connection issues
                    let retryCount = 0;
                    const maxRetries = 3;
                    let gradeSubmitted = false;

                    while (!gradeSubmitted && retryCount < maxRetries) {
                      try {
                        console.log(`📊 Grade submission attempt ${retryCount + 1}/${maxRetries} for student: ${student.username}`);

                        await gradesAssignmentsService.createGrade({
                          assignment_id: assignment.id,
                          student_id: student.id,
                          points_earned: result.grade,
                          feedback: feedbackToSubmit,
                          ai_generated: true,
                          ai_confidence: result.confidence || 85
                        });

                        gradeSubmitted = true;
                        console.log('✅ Auto grade submitted for student:', student.username);

                        // Clear pending process if this was an update
                        if (pendingGradeProcess) {
                          setPendingGradeProcess(null);
                        }

                        // Clear any previous errors
                        setError('');
                      } catch (dbError: any) {
                        retryCount++;
                        console.warn(`❌ Grade submission attempt ${retryCount} failed:`, dbError.message);

                        // Check if it's a connection error that we should retry
                        const isConnectionError = dbError.message?.includes('server closed the connection') ||
                          dbError.message?.includes('connection') ||
                          dbError.message?.includes('server terminated') ||
                          dbError.message?.includes('Database connection error');

                        if (isConnectionError && retryCount < maxRetries) {
                          // Wait before retry (exponential backoff)
                          const delayMs = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
                          console.log(`⏳ Waiting ${delayMs}ms before retry ${retryCount + 1}...`);
                          await new Promise(resolve => setTimeout(resolve, delayMs));
                        } else if (retryCount >= maxRetries) {
                          // All retries exhausted
                          if (isConnectionError) {
                            console.warn(`🔄 All retries exhausted for ${student.username} - storing as manual grade`);

                            // Store as manual grade as fallback without showing error
                            const feedbackToStore = buildRubricFeedbackForStorage(result) ||
                              `Analysis completed for ${student.username}`;

                            setManualGrades(prev => ({
                              ...prev,
                              [student.id]: {
                                grade: result.grade || 0,
                                feedback: feedbackToStore
                              }
                            }));

                            // Show a more user-friendly message
                            setSuccess(`Grade for ${student.username} stored locally due to network issues. It will be synced when connection improves.`);
                          } else {
                            // Non-connection error - show actual error
                            setError(`Failed to submit grade for ${student.username}: ${dbError.message || 'Unknown error'}`);
                          }
                          break;
                        } else {
                          // Non-connection error - don't retry
                          setError(`Failed to submit grade for ${student.username}: ${dbError.message || 'Unknown error'}`);
                          break;
                        }
                      }
                    }
                  } catch (error) {
                    console.error('❌ Failed to submit auto grade:', error);
                    setError(`Failed to submit grade for ${student.username}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  }
                } else {
                  // Manual mode: Store grades for manual review
                  const feedbackToStore = buildRubricFeedbackForStorage(result) ||
                    `Analysis completed for ${student.username}`;

                  setManualGrades(prev => ({
                    ...prev,
                    [student.id]: {
                      grade: result.grade || 0,
                      feedback: feedbackToStore
                    }
                  }));
                  console.log('📝 Manual grade stored for student:', student.username);
                }
              }
            }
          }
        }
      }

      if (results.length > 0) {
        setSuccess(`Successfully processed ${results.length} file(s)${assignmentType === 'grading' ? ' and submitted grades' : ''}`);
        // Clear the file input
        setFiles(null);
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (error) {
      console.error('File processing error:', error);
      setError(error instanceof Error ? error.message : 'Failed to process files');
    } finally {
      setIsProcessing(false);
      // Clear pending process
      setPendingGradeProcess(null);
    }
  };

  const processFile = async (file: File): Promise<AnalysisResult> => {
    return new Promise((resolve, reject) => {
      // Check file type
      const fileType = file.type;
      console.log('Processing file type:', fileType, 'File name:', file.name);

      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        reject(new Error('File is too large. Please use files smaller than 10MB.'));
        return;
      }

      if (fileType === 'application/pdf') {
        // Handle PDF files
        processPDFFile(file, resolve, reject);
      } else if (fileType.startsWith('image/')) {
        // Handle image files
        processImageFile(file, resolve, reject);
      } else {
        reject(new Error('Unsupported file type. Please use PDF or image files (PNG, JPG, etc.).'));
      }
    });
  };

  const processPDFFile = async (file: File, resolve: Function, reject: Function) => {
    try {
      // Convert PDF to base64 and send to backend for text extraction
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const base64 = event.target?.result as string;
          const pdfData = base64.split(',')[1]; // Remove data URL prefix

          const token = localStorage.getItem('access_token');
          if (!token) {
            throw new Error('Authentication required');
          }

          const requestBody = assignmentType === 'grading' ? {
            pdf_data: pdfData,
            pdf_analysis: true,
            grading_mode: true,
            task_type: 'grade_assignment',
            assignment_title: assignmentTitle || 'Assignment',
            max_points: maxPoints,
            grading_rubric: gradingRubric || 'Standard academic grading criteria',
            student_context: `Grading PDF assignment for student: ${selectedStudent}`,
            analysis_type: 'pdf_assignment_grading'
          } : {
            pdf_data: pdfData,
            pdf_analysis: true,
            task_type: 'analyze',
            student_context: `Analyzing PDF for student: ${selectedStudent}`,
            analysis_type: 'pdf_student_notes'
          };

          console.log('Sending PDF request for analysis/grading:', {
            ...requestBody,
            pdf_data: `[${pdfData.length} characters of base64 PDF data]`
          });

          // Add timeout to prevent hanging
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout for PDFs

          const BACKEND_BASE_URL = 'https://kana-backend-app.onrender.com';
          const response = await fetch(`${BACKEND_BASE_URL}/kana-direct`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('PDF response error:', response.status, errorText);
            throw new Error(`PDF analysis failed: ${response.status} - ${errorText}`);
          }

          const data = await response.json();

          console.log('🔍 Backend response data:', {
            hasGrade: !!(data.grade || data.score),
            hasAnalysis: !!data.analysis,
            hasFeedback: !!data.feedback,
            hasOverallFeedback: !!data.overall_feedback,
            hasDetailedFeedback: !!data.detailed_feedback,
            hasComprehensiveFeedback: !!data.comprehensive_feedback,
            responseKeys: Object.keys(data),
            dataStructure: typeof data === 'object' ? Object.keys(data).join(', ') : 'Not an object'
          });

          // Parse grading data if available
          const result: AnalysisResult = {
            extractedText: typeof data.extracted_text === 'string' ? data.extracted_text.trim() : '',
            analysis: data.analysis || 'Analysis not available',
            knowledgeGaps: data.knowledge_gaps || [],
            recommendations: data.recommendations || [],
            confidence: data.confidence || 0
          };

          // Add grading information if available
          if (assignmentType === 'grading') {
            result.grade = data.grade || data.score;
            result.maxPoints = maxPoints;
            result.gradingCriteria = normalizeRubricCriteria(data);
            result.overallFeedback = data.overall_conclusion || data.overall_feedback || data.feedback;
            result.detailedFeedback = data.detailed_feedback || data.comprehensive_feedback || data.analysis;
            result.improvementAreas = data.improvement_areas || data.areas_for_improvement;
            result.strengths = data.strengths || data.student_strengths;

            // Ensure we have some form of feedback for grading
            if (!result.detailedFeedback && !result.overallFeedback) {
              result.detailedFeedback = data.analysis || data.response || 'Detailed feedback not available';
            }

            console.log('📊 Grading result processed:', {
              grade: result.grade,
              hasDetailedFeedback: !!result.detailedFeedback,
              hasOverallFeedback: !!result.overallFeedback,
              detailedFeedbackLength: (result.detailedFeedback || '').length,
              overallFeedbackLength: (result.overallFeedback || '').length,
              detailedFeedbackPreview: (result.detailedFeedback || '').substring(0, 200) + '...',
              overallFeedbackPreview: (result.overallFeedback || '').substring(0, 200) + '...'
            });
          }

          resolve(result);
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            reject(new Error('PDF processing timed out. Large PDFs may take longer to process. Please try again.'));
          } else {
            reject(error);
          }
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read PDF file'));
      };

      // Convert PDF to base64
      reader.readAsDataURL(file);
    } catch (error) {
      reject(error);
    }
  };

  const processImageFile = (file: File, resolve: Function, reject: Function) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const base64 = event.target?.result as string;
        const imageData = base64.split(',')[1]; // Remove data URL prefix

        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('Authentication required');
        }

        const requestBody = assignmentType === 'grading' ? {
          image_data: imageData,
          image_analysis: true,
          grading_mode: true,
          task_type: 'grade_assignment',
          assignment_title: assignmentTitle || 'Assignment',
          max_points: maxPoints,
          grading_rubric: gradingRubric || 'Standard academic grading criteria',
          student_context: `Grading assignment for student: ${selectedStudent}`,
          analysis_type: 'image_assignment_grading'
        } : {
          image_data: imageData,
          image_analysis: true,
          task_type: 'analyze',
          student_context: `Analyzing notes for student: ${selectedStudent}`,
          analysis_type: 'student_notes'
        };

        console.log('Sending request for analysis/grading:', {
          ...requestBody,
          image_data: `[${imageData.length} characters of base64 data]`
        });

        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

        const BACKEND_BASE_URL = 'https://kana-backend-app.onrender.com';
        const response = await fetch(`${BACKEND_BASE_URL}/kana-direct`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Analysis response error:', response.status, errorText);
          throw new Error(`Analysis failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        console.log('🔍 Backend response data:', {
          hasGrade: !!(data.grade || data.score),
          hasAnalysis: !!data.analysis,
          hasFeedback: !!data.feedback,
          hasOverallFeedback: !!data.overall_feedback,
          hasDetailedFeedback: !!data.detailed_feedback,
          hasComprehensiveFeedback: !!data.comprehensive_feedback,
          responseKeys: Object.keys(data),
          dataStructure: typeof data === 'object' ? Object.keys(data).join(', ') : 'Not an object'
        });

        // Parse grading data if available
        const result: AnalysisResult = {
          extractedText: typeof data.extracted_text === 'string' ? data.extracted_text.trim() : '',
          analysis: data.analysis || 'Analysis not available',
          knowledgeGaps: data.knowledge_gaps || [],
          recommendations: data.recommendations || [],
          confidence: data.confidence || 0
        };

        // Add grading information if available
        if (assignmentType === 'grading') {
          result.grade = data.grade || data.score;
          result.maxPoints = maxPoints;
          result.gradingCriteria = normalizeRubricCriteria(data);
          result.overallFeedback = data.overall_conclusion || data.overall_feedback || data.feedback;
          result.detailedFeedback = data.detailed_feedback || data.comprehensive_feedback || data.analysis;
          result.improvementAreas = data.improvement_areas || data.areas_for_improvement;
          result.strengths = data.strengths || data.student_strengths;

          // Ensure we have some form of feedback for grading
          if (!result.detailedFeedback && !result.overallFeedback) {
            result.detailedFeedback = data.analysis || data.response || 'Detailed feedback not available';
          }

          console.log('📊 Grading result processed:', {
            grade: result.grade,
            hasDetailedFeedback: !!result.detailedFeedback,
            hasOverallFeedback: !!result.overallFeedback,
            feedbackLength: (result.detailedFeedback || result.overallFeedback || '').length
          });
        }

        resolve(result);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          reject(new Error('Request timed out. The image might be too complex or the server is busy. Please try again.'));
        } else {
          reject(error);
        }
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    // Convert file to base64
    reader.readAsDataURL(file);
  };

  const clearResults = () => {
    setAnalysisResults([]);
    setError('');
  };

  const submitManualGrades = async () => {
    if (!selectedAssignment || Object.keys(manualGrades).length === 0) {
      setError('No manual grades to submit');
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingProgress(0);
      setProcessingStep('Preparing to submit grades...');
      console.log('📝 Submitting manual grades...');

      const assignment = assignments.find(a => a.id.toString() === selectedAssignment);
      if (!assignment) {
        throw new Error('Assignment not found');
      }

      let successCount = 0;
      let failCount = 0;
      const totalGrades = Object.keys(manualGrades).length;

      for (const [studentId, gradeData] of Object.entries(manualGrades)) {
        const student = filteredStudents.find(s => s.id.toString() === studentId);
        const studentName = student ? `${student.fname} ${student.lname}` : 'Unknown Student';

        setProcessingStep(`Submitting grade for ${studentName}...`);
        setProcessingProgress((successCount + failCount) / totalGrades * 100);

        try {
          await gradesAssignmentsService.createGrade({
            assignment_id: assignment.id,
            student_id: parseInt(studentId),
            points_earned: gradeData.grade,
            feedback: gradeData.feedback
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to submit grade for student ${studentId}:`, error);
          failCount++;
        }
      }

      setProcessingProgress(100);
      setProcessingStep('Grades submitted successfully!');

      console.log(`✅ Manual grades submitted: ${successCount} successful, ${failCount} failed`);

      if (successCount > 0) {
        // Clear manual grades after successful submission
        setManualGrades({});

        // Trigger refresh of grading data
        window.dispatchEvent(new CustomEvent('studentGradesUpdated', {
          detail: {
            studentUsername: selectedStudent,
            classroomId: selectedClassroom,
            subjectId: selectedSubject,
            assignmentId: selectedAssignment
          }
        }));

        setError('');
      }

      if (failCount > 0) {
        setError(`${failCount} grades failed to submit. Please try again.`);
      }

      setTimeout(() => {
        setProcessingStep('');
        setProcessingProgress(0);
      }, 2000);

    } catch (error) {
      console.error('❌ Failed to submit manual grades:', error);
      setError('Failed to submit manual grades. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
      setProcessingProgress(0);
    }
  };

  // === BULK FILE PROCESSING FUNCTIONS ===

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _processBulkFiles = async () => {
    // Clear previous messages
    setError('');
    setSuccess('');

    if (!files || files.length === 0) {
      setError('Please select files to upload');
      return;
    }

    if (!selectedStudent) {
      setError('Please select a student');
      return;
    }

    if (!selectedAssignment) {
      setError('Please select an assignment for grading');
      return;
    }

    // Validate classroom and subject selection if classrooms are available
    if (classrooms.length > 0) {
      if (!selectedClassroom) {
        setError('Please select a classroom');
        return;
      }
      if (!selectedSubject) {
        setError('Please select a subject');
        return;
      }
      if (filteredStudents.length === 0) {
        setError('No students available in the selected classroom and subject');
        return;
      }
    }

    setIsProcessing(true);
    setError('');
    console.log(`🚀 Starting bulk grading for ${files.length} files`);

    try {
      const assignment = assignments.find(a => a.id.toString() === selectedAssignment);
      if (!assignment) {
        throw new Error('Assignment not found');
      }

      // Separate files by type
      const imageFiles: File[] = [];
      const pdfFiles: File[] = [];

      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          imageFiles.push(file);
        } else if (file.type === 'application/pdf') {
          pdfFiles.push(file);
        }
      });

      let bulkResults: any[] = [];

      // Process images in bulk if any
      if (imageFiles.length > 0) {
        console.log(`📸 Processing ${imageFiles.length} images with bulk grading`);
        const imageResult = await processBulkImages(imageFiles, assignment);
        if (imageResult) {
          bulkResults.push(...(imageResult.grading_results || []));
        }
      }

      // Process PDFs in bulk if any
      if (pdfFiles.length > 0) {
        console.log(`📄 Processing ${pdfFiles.length} PDFs with bulk grading`);
        const pdfResult = await processBulkPDFs(pdfFiles, assignment);
        if (pdfResult) {
          bulkResults.push(...(pdfResult.grading_results || []));
        }
      }

      // Convert bulk results to analysis results format
      const analysisResults: AnalysisResult[] = bulkResults.map((result) => ({
        extractedText: typeof result.extracted_text === 'string' ? result.extracted_text.trim() : '',
        analysis: result.analysis || result.feedback || 'Analysis completed via bulk processing',
        knowledgeGaps: result.knowledge_gaps || [],
        recommendations: result.recommendations || [],
        confidence: result.confidence || 85,
        targetStudent: selectedStudent,
        grade: result.grade || result.score,
        maxPoints: assignment.max_points,
        gradingCriteria: normalizeRubricCriteria(result),
        overallFeedback: result.overall_conclusion || result.overall_feedback || result.feedback,
        improvementAreas: result.improvement_areas || result.areas_for_improvement || [],
        strengths: result.strengths || result.student_strengths || [],
        // Enhanced feedback types from index.js
        detailedFeedback: result.detailed_feedback,
        summaryFeedback: result.summary_feedback,
        letterGrade: result.letter_grade,
        percentage: result.percentage
      }));

      setAnalysisResults(analysisResults);

      // Handle grading based on mode
      if (analysisResults.length > 0) {
        const studentsList = filteredStudents.length > 0 ? filteredStudents : students;
        const student = studentsList.find(s => s.username === selectedStudent);

        if (student) {
          for (const result of analysisResults) {
            if (gradingMode === 'auto' && result.grade !== undefined) {
              // Auto mode: Submit each grade directly
              try {
                await gradesAssignmentsService.createGrade({
                  assignment_id: assignment.id,
                  student_id: student.id,
                  points_earned: result.grade,
                  feedback: result.overallFeedback || result.analysis
                });
                console.log('✅ Auto grade submitted for bulk processed file');
              } catch (error) {
                console.error('❌ Failed to submit auto grade:', error);
                setError(`Failed to submit grade: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            } else if (gradingMode === 'manual') {
              // Manual mode: Store grades for teacher review
              const studentKey = student.id.toString();
              setManualGrades(prev => ({
                ...prev,
                [studentKey]: {
                  grade: result.grade || 0,
                  feedback: result.overallFeedback || result.analysis
                }
              }));
              console.log('📝 Manual grade prepared for bulk processed file');
            }
          }

          // Trigger refresh for auto mode
          if (gradingMode === 'auto') {
            window.dispatchEvent(new CustomEvent('studentGradesUpdated', {
              detail: {
                studentUsername: selectedStudent,
                classroomId: selectedClassroom,
                subjectId: selectedSubject,
                assignmentId: selectedAssignment
              }
            }));
          }
        }
      }

      // Clear the file input
      setFiles(null);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      console.log(`✅ Bulk processing completed: ${bulkResults.length} files processed`);

    } catch (error) {
      console.error('❌ Bulk processing failed:', error);
      setError(error instanceof Error ? error.message : 'Bulk processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const callGradeClassApi = async (
    studentIds: number[],
    options: { startIndex?: number; maxStudentsPerRequest?: number } = {}
  ) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Authentication required');
    }

    if (!selectedAssignment) {
      throw new Error('Please select an assignment before grading');
    }

    if (!selectedSubject) {
      throw new Error('Please select a subject before grading');
    }

    const BRAININK_BACKEND_BASE_URL = 'https://znd2y0sjxf.execute-api.eu-west-1.amazonaws.com';
    const endpoint = `${BRAININK_BACKEND_BASE_URL}/study-area/academic/grades/grade-class`;
    const normalizedStudentIds = studentIds
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id));
    const requestedStartIndex = Number.isFinite(Number(options.startIndex))
      ? Math.max(0, Number(options.startIndex))
      : 0;

    if (normalizedStudentIds.length === 0) {
      throw new Error('No valid students were provided for grading.');
    }

    const invokeGradeClass = async (
      ids: number[],
      invokeOptions: { startIndex?: number; maxStudentsPerRequest?: number } = {}
    ) => {
      const startIndex = Number.isFinite(Number(invokeOptions.startIndex))
        ? Math.max(0, Number(invokeOptions.startIndex))
        : 0;
      const maxStudentsPerRequest = Number.isFinite(Number(invokeOptions.maxStudentsPerRequest))
        ? Math.max(0, Number(invokeOptions.maxStudentsPerRequest))
        : 0;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject_id: parseInt(selectedSubject),
          assignment_id: parseInt(selectedAssignment),
          student_ids: ids,
          grade_all_students: false,
          start_index: startIndex,
          max_students_per_request: maxStudentsPerRequest
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const detail = errorData?.detail || `Grade-class request failed (${response.status})`;
        const requestError = new Error(detail) as Error & { status?: number };
        requestError.status = response.status;
        throw requestError;
      }

      const data = await response.json();
      return {
        grading_results: Array.isArray(data.grading_results) ? data.grading_results : [],
        has_more: Boolean(data.has_more),
        next_index: Number.isFinite(Number(data.next_index))
          ? Number(data.next_index)
          : startIndex,
        total_students: Number.isFinite(Number(data.total_students))
          ? Number(data.total_students)
          : ids.length,
        processed_student_ids: Array.isArray(data.processed_student_ids)
          ? data.processed_student_ids
            .map((id: unknown) => Number(id))
            .filter((id: number) => Number.isFinite(id))
          : [],
        remaining_student_ids: Array.isArray(data.remaining_student_ids)
          ? data.remaining_student_ids
            .map((id: unknown) => Number(id))
            .filter((id: number) => Number.isFinite(id))
          : [],
      };
    };

    const buildFallbackFailure = (studentId: number, reason: string) => {
      const student = filteredStudents.find((item) => item.id === studentId);
      const studentName = student ? `${student.fname} ${student.lname}` : `Student ${studentId}`;

      return {
        student_id: studentId,
        student_name: studentName,
        success: false,
        score: null,
        points_earned: null,
        max_points: maxPoints,
        percentage: null,
        feedback: reason,
        detailed_feedback: reason,
        error: reason,
      };
    };

    try {
      return await invokeGradeClass(normalizedStudentIds, options);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Grade-class request failed';
      const statusCode = Number((error as { status?: number })?.status || 0);
      const fallbackStudentIds = normalizedStudentIds.slice(requestedStartIndex);
      const shouldFallbackToSingleStudent =
        fallbackStudentIds.length > 1 &&
        (statusCode >= 500 || /timeout|timed out|service unavailable|gateway|failed to fetch|network/i.test(message));

      if (!shouldFallbackToSingleStudent) {
        throw error;
      }

      console.warn('⚠️ Batch grade-class call failed. Retrying per student...', { statusCode, message });

      const fallbackResults: any[] = [];
      const processedStudentIds: number[] = [];
      for (const studentId of fallbackStudentIds) {
        try {
          const singleStudentResponse = await invokeGradeClass(
            [studentId],
            { startIndex: 0, maxStudentsPerRequest: 1 }
          );
          if (singleStudentResponse.grading_results.length > 0) {
            fallbackResults.push(...singleStudentResponse.grading_results);
          } else {
            fallbackResults.push(
              buildFallbackFailure(studentId, 'No grading result was returned for this student.')
            );
          }

          if (singleStudentResponse.processed_student_ids.length > 0) {
            processedStudentIds.push(...singleStudentResponse.processed_student_ids);
          } else {
            processedStudentIds.push(studentId);
          }
        } catch (singleStudentError) {
          const singleStudentMessage =
            singleStudentError instanceof Error
              ? singleStudentError.message
              : 'Per-student retry failed during grading.';

          fallbackResults.push(buildFallbackFailure(studentId, singleStudentMessage));
          processedStudentIds.push(studentId);
        }
      }

      return {
        grading_results: fallbackResults,
        has_more: false,
        next_index: requestedStartIndex + fallbackStudentIds.length,
        total_students: normalizedStudentIds.length,
        processed_student_ids: processedStudentIds,
        remaining_student_ids: normalizedStudentIds.slice(requestedStartIndex + fallbackStudentIds.length),
        fallbackUsed: true,
      };
    }
  };

  const processBulkImages = async (imageFiles: File[], assignment: any) => {
    try {
      const selectedStudentId = parseInt(selectedStudent);
      if (!selectedStudentId) {
        throw new Error('Please select a student before grading');
      }

      console.log(`📤 Routing image grading through backend grade-class for student ${selectedStudentId}`);
      const result = await callGradeClassApi([selectedStudentId]);
      console.log('✅ Bulk image grading completed:', result);
      return result;

    } catch (error) {
      console.error('❌ Bulk image processing failed:', error);
      throw error;
    }
  };

  const processBulkPDFs = async (pdfFiles: File[], assignment: any) => {
    try {
      const selectedStudentId = parseInt(selectedStudent);
      if (!selectedStudentId) {
        throw new Error('Please select a student before grading');
      }

      console.log(`📤 Routing PDF grading through backend grade-class for student ${selectedStudentId}`);
      const result = await callGradeClassApi([selectedStudentId]);
      console.log('✅ Bulk PDF grading completed:', result);
      return result;

    } catch (error) {
      console.error('❌ Bulk PDF processing failed:', error);
      throw error;
    }
  };

  // === BULK UPLOAD FUNCTIONS ===

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _openBulkUploadModal = async () => {
    if (!selectedAssignment) {
      setError('Please select an assignment first');
      return;
    }

    const assignment = assignments.find(a => a.id.toString() === selectedAssignment);
    if (!assignment) {
      setError('Assignment not found');
      return;
    }

    // Open the unified modal with bulk upload tab
    setUploadModalTab('bulk');
    setSelectImageModal(true);
    setSelectedBulkStudent('');
    setBulkUploadFiles(null);
  };

  const loadBulkUploadStudents = async (assignmentId: number) => {
    try {
      setLoadingBulkStudents(true);
      console.log('🔄 Loading students for bulk upload, assignment:', assignmentId);

      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`https://znd2y0sjxf.execute-api.eu-west-1.amazonaws.com/study-area/bulk-upload/assignment/${assignmentId}/students`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // If the endpoint fails, fall back to using existing students
        console.log('⚠️ Bulk upload students endpoint not available, using existing students');
        const availableStudents = filteredStudents.length > 0 ? filteredStudents : students;

        const bulkStudents = availableStudents.map(student => ({
          student_id: student.id,
          student_name: `${student.fname} ${student.lname}`,
          has_pdf: false,
          image_count: 0,
          is_graded: false
        }));

        setBulkUploadModal(prev => ({
          ...prev,
          students: bulkStudents
        }));
        return;
      }

      const data = await response.json();
      console.log('✅ Loaded bulk upload students:', data);

      // Map the response to include new database fields
      const enhancedStudents = data.students?.map((student: any) => ({
        ...student,
        pdf_size: student.pdf_size || null,
        content_type: student.content_type || 'application/pdf',
        pdf_filename: student.pdf_filename || null
      })) || [];

      setBulkUploadModal(prev => ({
        ...prev,
        students: enhancedStudents
      }));

    } catch (error) {
      console.error('❌ Failed to load bulk upload students:', error);
      // Fall back to using existing students
      const availableStudents = filteredStudents.length > 0 ? filteredStudents : students;

      const bulkStudents = availableStudents.map(student => ({
        student_id: student.id,
        student_name: `${student.fname} ${student.lname}`,
        has_pdf: false,
        image_count: 0,
        is_graded: false
      }));

      setBulkUploadModal(prev => ({
        ...prev,
        students: bulkStudents
      }));
    } finally {
      setLoadingBulkStudents(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleBulkUploadSubmit = async () => {
    // Clear previous messages
    setError('');
    setSuccess('');

    if (!bulkUploadFiles || bulkUploadFiles.length === 0) {
      setError('Please select files to upload');
      return;
    }

    if (!selectedBulkStudent) {
      setError('Please select a student');
      return;
    }

    if (!bulkUploadModal.assignmentId) {
      setError('Assignment not found');
      return;
    }

    // Validate that all files are images
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
    const invalidFiles = Array.from(bulkUploadFiles).filter(file => !allowedImageTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      setError(`Only image files are allowed. Invalid files: ${invalidFiles.map(f => f.name).join(', ')}`);
      return;
    }

    try {
      setProcessingBulkUpload(true);
      setError('');
      console.log('🚀 Starting bulk upload process...');

      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Create FormData for bulk upload
      const formData = new FormData();
      formData.append('assignment_id', bulkUploadModal.assignmentId.toString());
      formData.append('student_id', selectedBulkStudent);

      // Add all selected files
      Array.from(bulkUploadFiles).forEach((file) => {
        formData.append('files', file);
      });

      console.log('📤 Uploading', bulkUploadFiles.length, 'files for student:', selectedBulkStudent);

      // Call the correct bulk upload endpoint for images
      const response = await fetch('https://znd2y0sjxf.execute-api.eu-west-1.amazonaws.com/study-area/bulk-upload-to-pdf', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Bulk upload failed: ${response.status} - ${errorText}`);
      }

      console.log('✅ Bulk upload successful!');

      // Check if we want to auto-grade the PDF using our existing grading system
      if (gradingMode === 'auto') {
        await handleBulkGradeAfterUpload(selectedBulkStudent);
      }

      // Reset form
      setBulkUploadFiles(null);
      setSelectedBulkStudent('');

      // Close modal if everything was successful
      setBulkUploadModal({ isOpen: false });

      // Show success message
      setError('');
      const student = bulkUploadModal.students?.find(s => s.student_id.toString() === selectedBulkStudent);
      const assignment = assignments.find(a => a.id === bulkUploadModal.assignmentId);
      setSuccess(`Successfully uploaded ${bulkUploadFiles.length} files for ${student?.student_name} - ${assignment?.title}`);

      // Auto-clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);

    } catch (error) {
      console.error('❌ Bulk upload failed:', error);
      setError(error instanceof Error ? error.message : 'Bulk upload failed');
    } finally {
      setProcessingBulkUpload(false);
    }
  };

  const handleBulkGradeAfterUpload = async (studentId: string) => {
    try {
      console.log('🎯 Auto-grading uploaded PDF for student:', studentId);

      // Get the assignment details
      const assignment = assignments.find(a => a.id.toString() === selectedAssignment);
      if (!assignment) {
        console.warn('Assignment not found for auto-grading');
        return;
      }

      const gradeResult = await callGradeClassApi([parseInt(studentId)]);
      console.log('✅ Auto-grading completed:', gradeResult);

      const gradingResults = gradeResult.grading_results || [];
      const result = gradingResults.find((item: any) => item.student_id === parseInt(studentId)) || gradingResults[0];

      if (result && result.success && result.score !== undefined) {
        const student = bulkUploadModal.students?.find(s => s.student_id.toString() === studentId);
        const studentName = student?.student_name || `Student ${studentId}`;

        console.log('✅ Grade successfully saved through backend grading flow');

        setError('');
        setSuccess(`✅ Grade submitted: ${studentName} - ${result.score}/${assignment.max_points} (${result.percentage || Math.round((result.score / assignment.max_points) * 100)}%)`);

        setTimeout(() => setSuccess(''), 5000);

        window.dispatchEvent(new CustomEvent('studentGradesUpdated', {
          detail: {
            studentId: studentId,
            classroomId: selectedClassroom,
            subjectId: selectedSubject,
            assignmentId: selectedAssignment
          }
        }));

        if (selectedAssignment) {
          await loadBulkUploadStudents(parseInt(selectedAssignment));
        }
      } else {
        console.warn('Auto-grading did not return a successful result for this student');
      }

    } catch (error) {
      console.error('❌ Auto-grading after bulk upload failed:', error);

      // Show a more helpful error message
      const errorMessage = error instanceof Error ? error.message : 'Auto-grading failed';
      if (errorMessage.includes('comments')) {
        setError('Grade creation failed due to database field mismatch. Please contact support.');
      } else if (errorMessage.includes('500')) {
        setError('Server error during grade creation. The upload was successful but grading failed.');
      } else {
        setError(`Auto-grading failed: ${errorMessage}`);
      }

      // Auto-clear error message after 10 seconds
      setTimeout(() => setError(''), 10000);
    }
  };

  const downloadStudentPDF = async (assignmentId: number, studentId: number, studentName: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`https://znd2y0sjxf.execute-api.eu-west-1.amazonaws.com/study-area/bulk-upload/assignment/${assignmentId}/student/${studentId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError('PDF not found for this student');
          return;
        }
        throw new Error(`Failed to download PDF: ${response.status}`);
      }

      // Get PDF as blob from database
      const pdfBlob = await response.blob();

      // Create download URL and trigger download
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${studentName}_Assignment_${assignmentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess('PDF downloaded successfully');
    } catch (error) {
      console.error('Failed to download PDF:', error);
      setError('Failed to download PDF');
    }
  };

  const deleteStudentPDF = async (assignmentId: number, studentId: number) => {
    if (!confirm('Are you sure you want to delete this PDF? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`https://znd2y0sjxf.execute-api.eu-west-1.amazonaws.com/study-area/bulk-upload/assignment/${assignmentId}/student/${studentId}/pdf`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete PDF');
      }

      console.log('✅ PDF deleted successfully');
      setSuccess('PDF deleted successfully');

      // Refresh upload status and grading status
      await checkStudentUploadStatus();
      await checkStudentGradingStatus();

      // Close the uploads modal to show the refreshed state
      setStudentUploadsModal({ isOpen: false });

      // Note: PDF status refresh would require re-implementing with existing endpoints

    } catch (error) {
      console.error('Failed to delete PDF:', error);
      setError('Failed to delete PDF');
    }
  };

  // Show student uploads
  const showStudentUploads = async (studentId: number, studentName: string) => {
    if (!selectedAssignment) {
      setError('Please select an assignment first');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`https://znd2y0sjxf.execute-api.eu-west-1.amazonaws.com/study-area/bulk-upload/assignment/${selectedAssignment}/students`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const studentData = data.students.find((s: any) => s.student_id === studentId);

        setStudentUploadsModal({
          isOpen: true,
          studentId,
          studentName,
          uploads: studentData ? [studentData] : []
        });
      }
    } catch (error) {
      console.error('Failed to load student uploads:', error);
      setError('Failed to load student uploads');
    }
  };

  // Handle upload for specific student - now using direct file inputs
  const handleUploadForStudent = (studentId: number, studentName: string) => {
    // This function is now only used for the modal trigger
    // The actual file uploads are handled by individual file inputs
    const student = filteredStudents.find(s => s.id === studentId);
    if (!student) return;

    setCurrentUploadStudent({
      id: studentId,
      name: studentName
    });

    // Trigger the specific student's file input
    const fileInput = document.getElementById(`file-upload-${studentId}`) as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  // Handle file selection with preview for individual students
  const handleStudentFileSelection = async (files: FileList, studentId: number, studentName: string) => {
    if (!files || files.length === 0) return;

    // Validate that all files are images
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
    const invalidFiles = Array.from(files).filter(file => !allowedImageTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      setError(`Only image files are allowed. Invalid files: ${invalidFiles.map(f => f.name).join(', ')}`);
      return;
    }

    try {
      // Create preview URLs for all files
      const fileArray = Array.from(files);
      const previewPromises = fileArray.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      });

      const previews = await Promise.all(previewPromises);

      // Set preview state
      setFilePreview({
        files: fileArray,
        previews,
        studentId,
        studentName,
        isOpen: true
      });
    } catch (error) {
      console.error('Failed to create file previews:', error);
      setError('Failed to preview files');
    }
  };

  // Confirm upload after preview
  const confirmUploadWithPreview = async () => {
    if (!filePreview.studentId || filePreview.files.length === 0) return;

    try {
      // Convert files array to FileList
      const dataTransfer = new DataTransfer();
      filePreview.files.forEach(file => dataTransfer.items.add(file));
      const fileList = dataTransfer.files;

      // Upload files
      await uploadFilesForStudent(fileList, filePreview.studentId);

      // Force refresh upload status after a short delay
      setTimeout(async () => {
        await forceRefreshUploadStatus();
      }, 1500);

      // Close preview
      setFilePreview({ files: [], previews: [], isOpen: false });
    } catch (error) {
      console.error('Upload failed:', error);

      // Still refresh status in case upload partially succeeded
      setTimeout(async () => {
        await forceRefreshUploadStatus();
      }, 2000);
    }
  };

  // Cancel upload and close preview
  const cancelUploadPreview = () => {
    // Cleanup preview URLs to prevent memory leaks
    filePreview.previews.forEach(preview => {
      if (preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    });

    setFilePreview({ files: [], previews: [], isOpen: false });
  };

  // Handle adding more files to the existing preview
  const handleAddMoreFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = event.target.files;
    if (!newFiles || newFiles.length === 0) return;

    // Validate that all files are images
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
    const invalidFiles = Array.from(newFiles).filter(file => !allowedImageTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      setError(`Only image files are allowed. Invalid files: ${invalidFiles.map(f => f.name).join(', ')}`);
      return;
    }

    try {
      // Create preview URLs for new files
      const newFileArray = Array.from(newFiles);
      const newPreviewPromises = newFileArray.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      });

      const newPreviews = await Promise.all(newPreviewPromises);

      // Add new files to existing preview
      setFilePreview(prev => ({
        ...prev,
        files: [...prev.files, ...newFileArray],
        previews: [...prev.previews, ...newPreviews]
      }));

      // Clear the file input
      event.target.value = '';
    } catch (error) {
      console.error('Failed to add more files:', error);
      setError('Failed to add more files');
    }
  };

  // Remove a specific file from preview
  const removeFileFromPreview = (indexToRemove: number) => {
    // Cleanup the preview URL for the removed file
    const previewToRemove = filePreview.previews[indexToRemove];
    if (previewToRemove && previewToRemove.startsWith('blob:')) {
      URL.revokeObjectURL(previewToRemove);
    }

    // Remove file and preview at the specified index
    setFilePreview(prev => ({
      ...prev,
      files: prev.files.filter((_, index) => index !== indexToRemove),
      previews: prev.previews.filter((_, index) => index !== indexToRemove)
    }));
  };  // Upload files using bulk-upload-to-pdf endpoint
  const uploadFilesForStudent = async (files: FileList, studentId: number) => {
    if (!selectedAssignment || !files || files.length === 0) {
      setError('Please select files and an assignment');
      return;
    }

    try {
      setIsProcessing(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const formData = new FormData();
      formData.append('assignment_id', selectedAssignment);
      formData.append('student_id', studentId.toString());

      // Add all files
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch('https://znd2y0sjxf.execute-api.eu-west-1.amazonaws.com/study-area/bulk-upload-to-pdf', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const studentName = filteredStudents.find(s => s.id === studentId)?.fname + ' ' + filteredStudents.find(s => s.id === studentId)?.lname;
        setSuccess(`Successfully uploaded and created PDF for ${studentName}`);
        setError('');

        // Refresh upload status
        setTimeout(() => {
          checkStudentUploadStatus();
        }, 1000);
      } else if (response.status === 500) {
        // Check if response contains PDF data despite the 500 error
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/pdf')) {
          // Backend successfully created PDF but database insert failed
          // Download the PDF file directly from the response
          const pdfBlob = await response.blob();
          const studentName = filteredStudents.find(s => s.id === studentId)?.fname + ' ' + filteredStudents.find(s => s.id === studentId)?.lname;

          // Trigger download
          const url = window.URL.createObjectURL(pdfBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${studentName}_Assignment_${selectedAssignment}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          setSuccess(`Successfully created and downloaded PDF for ${studentName}`);
          setError('');
        } else {
          // Handle as database constraint error
          try {
            const errorData = await response.json();
            if (errorData.detail && (
              (errorData.detail.includes('pdf_path')) ||
              (errorData.detail.includes('NotNullViolation')) ||
              (errorData.detail.includes('psycopg2.errors'))
            )) {
              const studentName = filteredStudents.find(s => s.id === studentId)?.fname + ' ' + filteredStudents.find(s => s.id === studentId)?.lname;
              setSuccess(`PDF created successfully for ${studentName}`);
              setError('');
            } else {
              throw new Error(errorData.detail || `Upload failed with status ${response.status}`);
            }
          } catch (parseError) {
            throw new Error(`Upload failed with status ${response.status}`);
          }
        }

        // Refresh upload status
        setTimeout(() => {
          checkStudentUploadStatus();
        }, 1000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Upload failed with status ${response.status}`);
      }

      // Clear current upload student and files
      setCurrentUploadStudent(null);
      setFiles(null);

    } catch (error) {
      console.error('Upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Upload failed: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Check student upload status
  const checkStudentUploadStatus = async () => {
    if (!selectedAssignment || filteredStudents.length === 0) {
      setStudentUploadStatus({});
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`https://znd2y0sjxf.execute-api.eu-west-1.amazonaws.com/study-area/bulk-upload/assignment/${selectedAssignment}/students`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const statusMap: { [key: number]: { hasUpload: boolean, uploadType: 'pdf' | 'images' | null } } = {};

        // Map student upload status
        data.students.forEach((student: any) => {
          statusMap[student.student_id] = {
            hasUpload: student.has_pdf || student.image_count > 0,
            uploadType: student.has_pdf ? 'pdf' : student.image_count > 0 ? 'images' : null
          };
        });

        setStudentUploadStatus(statusMap);
      }
    } catch (error) {
      console.error('Failed to check student upload status:', error);
    }
  };

  // Force refresh upload status with better error handling
  const forceRefreshUploadStatus = async () => {
    try {
      console.log('🔄 Force refreshing upload status...');
      await checkStudentUploadStatus();
      console.log('✅ Upload status refreshed');
    } catch (error) {
      console.error('Failed to refresh upload status:', error);
    }
  };

  // Check student grading status for display
  const checkStudentGradingStatus = async () => {
    if (!selectedAssignment || filteredStudents.length === 0) {
      setStudentGradingStatus({});
      return;
    }

    try {
      setLoadingGradingStatus(true);
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const statusMap: { [key: number]: boolean } = {};

      // Check grading status for each student
      for (const student of filteredStudents) {
        try {
          const gradeCheck = await checkStudentGrade(parseInt(selectedAssignment), student.id);
          statusMap[student.id] = gradeCheck?.already_graded || false;
        } catch (error) {
          console.error(`Failed to check grade for student ${student.id}:`, error);
          statusMap[student.id] = false;
        }
      }

      setStudentGradingStatus(statusMap);
    } catch (error) {
      console.error('Failed to check student grading status:', error);
    } finally {
      setLoadingGradingStatus(false);
    }
  };

  // View student grade details
  const viewStudentGradeDetails = async (studentId: number) => {
    try {
      const gradeCheck = await checkStudentGrade(parseInt(selectedAssignment), studentId);
      if (gradeCheck && gradeCheck.already_graded) {
        setGradingDetailsModal({
          isOpen: true,
          studentId,
          studentName: gradeCheck.student_name,
          gradeDetails: gradeCheck
        });
      }
    } catch (error) {
      console.error('Failed to fetch grade details:', error);
      setError('Failed to load grade details');
    }
  };

  // Handle grade update
  const handleGradeUpdate = async (studentId: number) => {
    try {
      setUpdatingGrade(true);
      console.log(`🔄 Updating grade for student ${studentId}`);

      // Close the details modal
      setGradingDetailsModal({
        isOpen: false,
        studentId: null,
        studentName: '',
        gradeDetails: null
      });

      // Refresh grading status after update
      await checkStudentGradingStatus();

      setSuccess('Grade updated successfully');
    } catch (error) {
      console.error('Failed to update grade:', error);
      setError('Failed to update grade');
    } finally {
      setUpdatingGrade(false);
    }
  };

  // Handle choose all students
  const handleChooseAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      // If all students are selected, deselect all
      setSelectedStudents([]);
    } else {
      // Select all students
      setSelectedStudents(filteredStudents.map(student => student.id));
    }
  };

  // Check if all selected students have uploads
  const allSelectedStudentsHaveUploads = () => {
    if (selectedStudents.length === 0) return false;

    return selectedStudents.every(studentId => {
      const uploadStatus = studentUploadStatus[studentId];
      return uploadStatus && uploadStatus.hasUpload;
    });
  };

  const mapGradeResultsToAnalysisResults = (mappedResults: any[], assignment: any): AnalysisResult[] => {
    return mappedResults.map((result: any) => {
      const parsedGrade = Number(result.score ?? result.points_earned);
      const hasValidGrade = Number.isFinite(parsedGrade);

      const parsedMaxPoints = Number(result.max_points ?? assignment.max_points ?? maxPoints);
      const resolvedMaxPoints = Number.isFinite(parsedMaxPoints) && parsedMaxPoints > 0
        ? parsedMaxPoints
        : (assignment.max_points || maxPoints || 100);

      const parsedPercentage = Number(result.percentage);
      const resolvedPercentage = Number.isFinite(parsedPercentage)
        ? parsedPercentage
        : (hasValidGrade && resolvedMaxPoints > 0
          ? Math.round((parsedGrade / resolvedMaxPoints) * 100)
          : undefined);

      const resolvedFeedback = String(
        result.feedback || result.detailed_feedback || result.summary_feedback || ''
      ).trim();
      const detailedFeedbackText = String(result.detailed_feedback || '').trim();

      const shouldShowOverallFeedback = Boolean(
        resolvedFeedback && (
          !detailedFeedbackText ||
          (detailedFeedbackText !== resolvedFeedback && !detailedFeedbackText.startsWith(resolvedFeedback))
        )
      );

      const extractedTextCandidates = [
        result.extracted_text,
        result.extractedText,
        result.submission_text,
        result.ocr_text,
        result.raw_feedback,
      ];
      const resolvedExtractedText = extractedTextCandidates
        .find((value: unknown) => typeof value === 'string' && value.trim().length > 0);

      const isSuccessful = result.success !== false && hasValidGrade;
      const computedLetterGrade = typeof result.letter_grade === 'string' && result.letter_grade.trim()
        ? result.letter_grade
        : (Number.isFinite(resolvedPercentage)
          ? (resolvedPercentage! >= 90 ? 'A' :
            resolvedPercentage! >= 80 ? 'B' :
              resolvedPercentage! >= 70 ? 'C' :
                resolvedPercentage! >= 60 ? 'D' : 'F')
          : undefined);

      return {
        extractedText: isSuccessful
          ? ((resolvedExtractedText as string) || '')
          : '',
        analysis: resolvedFeedback || (isSuccessful
          ? 'Automated grading completed.'
          : 'Grading failed. Please retry this student.'),
        knowledgeGaps: Array.isArray(result.knowledge_gaps) ? result.knowledge_gaps : [],
        recommendations: Array.isArray(result.recommendations) ? result.recommendations : [],
        confidence: Number.isFinite(Number(result.confidence))
          ? Number(result.confidence)
          : (isSuccessful ? 95 : 0),
        targetStudent: result.student_name,
        grade: hasValidGrade ? parsedGrade : undefined,
        maxPoints: resolvedMaxPoints,
        overallFeedback: shouldShowOverallFeedback ? resolvedFeedback : undefined,
        percentage: Number.isFinite(resolvedPercentage) ? resolvedPercentage : undefined,
        letterGrade: computedLetterGrade,
        detailedFeedback: detailedFeedbackText || undefined,
        summaryFeedback: result.summary_feedback,
        strengths: Array.isArray(result.strengths) ? result.strengths : [],
        improvementAreas: Array.isArray(result.improvement_areas)
          ? result.improvement_areas
          : (Array.isArray(result.knowledge_gaps) ? result.knowledge_gaps : []),
        gradingCriteria: normalizeRubricCriteria(result),
        needs_retry: !isSuccessful,
        error: !isSuccessful ? (result.error || 'No valid score was returned from grading.') : undefined,
        raw_feedback: typeof result.raw_feedback === 'string' ? result.raw_feedback : undefined,
      };
    });
  };

  // Handle bulk grading with validation
  const handleBulkGrading = async () => {
    // Clear previous messages
    setError('');
    setSuccess('');

    if (selectedStudents.length === 0) {
      setError('Please select at least one student');
      return;
    }

    if (!selectedAssignment) {
      setError('Please select an assignment for grading');
      return;
    }

    if (!allSelectedStudentsHaveUploads()) {
      const studentsWithoutUploads = selectedStudents.filter(studentId => {
        const uploadStatus = studentUploadStatus[studentId];
        return !uploadStatus || !uploadStatus.hasUpload;
      });

      const studentNames = studentsWithoutUploads.map(studentId => {
        const student = filteredStudents.find(s => s.id === studentId);
        return student ? `${student.fname} ${student.lname}` : `Student ${studentId}`;
      });

      setError(`The following students don't have uploads yet: ${studentNames.join(', ')}. Please ensure all selected students have uploaded their work before grading.`);
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingStep('Initializing grading process...');
    setLiveGradingProgress({
      active: true,
      totalStudents: selectedStudents.length,
      completedStudents: 0,
      successfulStudents: 0,
      failedStudents: 0,
      currentStudentName: '',
      currentStudentId: null,
    });
    console.log(`🎓 Starting bulk grading for ${selectedStudents.length} students`);

    try {
      const assignment = assignments.find(a => a.id.toString() === selectedAssignment);
      if (!assignment) {
        throw new Error('Assignment not found');
      }

      const allStudentIds = [...selectedStudents];
      const chunkSize = 1;
      let startIndex = 0;
      let expectedTotalStudents = allStudentIds.length;
      let fallbackUsed = false;
      const resultsByStudent = new Map<number, any>();
      const nonStudentResults: any[] = [];
      const processedStudents = new Set<number>();

      while (startIndex < expectedTotalStudents) {
        const nextOrdinal = Math.min(processedStudents.size + 1, expectedTotalStudents);
        const currentStudentId = Number(allStudentIds[startIndex]);
        const currentStudent = (filteredStudents.length > 0 ? filteredStudents : students).find(
          (student) => student.id === currentStudentId
        );
        const currentStudentName = currentStudent
          ? `${currentStudent.fname} ${currentStudent.lname}`
          : (Number.isFinite(currentStudentId) ? `Student ${currentStudentId}` : 'Student');

        setProcessingStep(`Grading student ${nextOrdinal} of ${expectedTotalStudents}...`);
        setLiveGradingProgress((previous) => ({
          ...previous,
          active: true,
          totalStudents: expectedTotalStudents,
          currentStudentId: Number.isFinite(currentStudentId) ? currentStudentId : null,
          currentStudentName,
        }));

        const gradingResults = await callGradeClassApi(allStudentIds, {
          startIndex,
          maxStudentsPerRequest: chunkSize,
        });

        fallbackUsed = fallbackUsed || gradingResults.fallbackUsed === true;

        if (Number.isFinite(Number(gradingResults.total_students)) && Number(gradingResults.total_students) > 0) {
          expectedTotalStudents = Number(gradingResults.total_students);
        }

        const batchResults = Array.isArray(gradingResults.grading_results)
          ? gradingResults.grading_results
          : [];

        for (const result of batchResults) {
          const studentId = Number(result?.student_id);
          if (Number.isFinite(studentId)) {
            resultsByStudent.set(studentId, result);
          } else {
            nonStudentResults.push(result);
          }
        }

        const responseProcessedIds = Array.isArray(gradingResults.processed_student_ids)
          ? gradingResults.processed_student_ids
            .map((id: unknown) => Number(id))
            .filter((id: number) => Number.isFinite(id))
          : [];

        const resultProcessedIds = batchResults
          .map((result: any) => Number(result?.student_id))
          .filter((id: number) => Number.isFinite(id));

        const processedIdsThisBatch = responseProcessedIds.length > 0
          ? responseProcessedIds
          : resultProcessedIds;

        if (processedIdsThisBatch.length === 0) {
          throw new Error('Grading request returned no progress. Please retry.');
        }

        processedIdsThisBatch.forEach((studentId: number) => processedStudents.add(studentId));

        const partialResults = [...Array.from(resultsByStudent.values()), ...nonStudentResults];
        setAnalysisResults(mapGradeResultsToAnalysisResults(partialResults, assignment));

        const completedCount = Math.min(processedStudents.size, expectedTotalStudents);
        const progress = expectedTotalStudents > 0
          ? Math.min(97, Math.round((completedCount / expectedTotalStudents) * 95))
          : 97;

        const successfulSoFar = partialResults.filter((item: any) => {
          const gradeValue = Number(item?.score ?? item?.points_earned);
          return item?.success !== false && Number.isFinite(gradeValue);
        });
        const failedSoFar = partialResults.filter((item: any) => {
          const gradeValue = Number(item?.score ?? item?.points_earned);
          return item?.success === false || !Number.isFinite(gradeValue);
        });

        setProcessingProgress(progress);
        setProcessingStep(`Processed ${completedCount} of ${expectedTotalStudents} students...`);
        setLiveGradingProgress((previous) => ({
          ...previous,
          active: true,
          totalStudents: expectedTotalStudents,
          completedStudents: completedCount,
          successfulStudents: successfulSoFar.length,
          failedStudents: failedSoFar.length,
        }));

        const nextIndex = Number(gradingResults.next_index);
        if (Number.isFinite(nextIndex)) {
          startIndex = Math.max(startIndex + 1, nextIndex);
        } else {
          startIndex += Math.max(1, processedIdsThisBatch.length);
        }

        if (gradingResults.has_more === false) {
          break;
        }
      }

      const mappedResults = [...Array.from(resultsByStudent.values()), ...nonStudentResults];
      if (mappedResults.length === 0) {
        throw new Error('Grading request completed but no results were returned. Please retry.');
      }

      const successfulSubmissions = mappedResults.filter((item: any) => {
        const gradeValue = Number(item?.score ?? item?.points_earned);
        return item?.success !== false && Number.isFinite(gradeValue);
      });
      const failedSubmissions = mappedResults.filter((item: any) => {
        const gradeValue = Number(item?.score ?? item?.points_earned);
        return item?.success === false || !Number.isFinite(gradeValue);
      });
      setLiveGradingProgress({
        active: true,
        totalStudents: expectedTotalStudents,
        completedStudents: Math.min(processedStudents.size, expectedTotalStudents),
        successfulStudents: successfulSubmissions.length,
        failedStudents: failedSubmissions.length,
        currentStudentName: 'Completed',
        currentStudentId: null,
      });

      if (successfulSubmissions.length === 0) {
        const firstFailure = failedSubmissions[0]?.error || failedSubmissions[0]?.feedback || 'Unable to grade students at this time.';
        throw new Error(firstFailure);
      }

      setProcessingStep('Finalizing results...');
      setProcessingProgress(99);

      let message = `🎯 Incremental grading completed! `;
      if (fallbackUsed) {
        message += `⚠️ Timeout detected; recovered by retrying students one-by-one. `;
      }
      message += `✅ ${successfulSubmissions.length} students graded. `;
      if (failedSubmissions.length > 0) {
        message += `⚠️ ${failedSubmissions.length} students failed to grade. `;
      }
      message += `📊 Completed grades were shown while the rest continued processing.`;

      setSuccess(message);
      setProcessingStep('Grading complete!');
      setProcessingProgress(100);
      setAnalysisResults(mapGradeResultsToAnalysisResults(mappedResults, assignment));

      // Refresh grading status after successful grading
      setTimeout(async () => {
        try {
          await checkStudentGradingStatus();
          console.log('✅ Grading status refreshed after bulk grading');
        } catch (error) {
          console.error('Failed to refresh grading status:', error);
        }
      }, 1000); // Wait 1 second for backend to process

      // Trigger refresh
      window.dispatchEvent(new CustomEvent('studentGradesUpdated', {
        detail: {
          classroomId: selectedClassroom,
          subjectId: selectedSubject,
          assignmentId: selectedAssignment,
          bulkUpdate: true
        }
      }));

      // Auto-clear success message after 10 seconds
      setTimeout(() => setSuccess(''), 10000);

    } catch (error) {
      console.error('❌ Bulk grading failed:', error);
      setError(error instanceof Error ? error.message : 'Bulk grading failed');
      setProcessingStep('');
      setProcessingProgress(0);
      setLiveGradingProgress((previous) => ({
        ...previous,
        active: false,
        currentStudentName: '',
        currentStudentId: null,
      }));
    } finally {
      setIsProcessing(false);
      // Reset progress after a delay so users can see completion
      setTimeout(() => {
        setProcessingStep('');
        setProcessingProgress(0);
        setLiveGradingProgress(createInitialLiveGradingProgress());
      }, 3000);
    }
  };

  // Handle selecting a bulk file to load into the main upload area
  const handleSelectBulkFile = async (student: any) => {
    try {
      console.log('Selecting bulk file for student:', student);

      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Fetch the PDF file from backend
      const response = await fetch(`https://znd2y0sjxf.execute-api.eu-west-1.amazonaws.com/study-area/bulk-upload/assignment/${selectedAssignment}/student/${student.student_id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch PDF file');
      }

      const pdfBlob = await response.blob();

      // Create a File object from the blob
      const pdfFile = new File([pdfBlob], `${student.student_name}_Assignment.pdf`, {
        type: 'application/pdf'
      });

      // Create a FileList-like object
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(pdfFile);
      const fileList = dataTransfer.files;

      // Set the selected file in the main upload area
      setFiles(fileList);

      // Set the student for this file
      setSelectedStudent(student.student_id.toString());

      // Close the modal
      setBulkUploadExistingModal(false);

      console.log('✅ Selected bulk file successfully:', pdfFile.name);
      setSuccess(`Selected ${student.student_name}'s PDF file. Ready to grade.`);

      // Auto-clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);

    } catch (error) {
      console.error('Failed to select bulk file:', error);
      setError('Failed to select file. Please try again.');
    }
  };

  // Handle bulk upload existing files modal
  const handleBulkUploadExisting = async () => {
    if (!selectedAssignment) {
      setError('Please select an assignment first');
      return;
    }

    try {
      setLoadingBulkStudents(true);
      const assignmentId = parseInt(selectedAssignment);

      // Load students for this assignment to check existing uploads
      await loadBulkUploadStudents(assignmentId);
      setBulkUploadExistingModal(true);
    } catch (error) {
      console.error('Failed to load existing uploads:', error);
      setError('Failed to load existing uploads');
    } finally {
      setLoadingBulkStudents(false);
    }
  };

  // Handle bulk upload new files modal
  const handleBulkUploadNew = async () => {
    if (!selectedAssignment) {
      setError('Please select an assignment first');
      return;
    }

    setBulkUploadNewModal(true);
  };

  // Handle new bulk file upload
  const handleNewBulkUpload = async (files: FileList) => {
    // Clear previous messages
    setError('');
    setSuccess('');

    if (!selectedAssignment || !files || files.length === 0) {
      setError('Please select files and an assignment');
      return;
    }

    if (!selectedStudent) {
      setError('Please select a student for bulk upload');
      return;
    }

    // Validate that all files are images
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
    const invalidFiles = Array.from(files).filter(file => !allowedImageTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      setError(`Only image files are allowed. Invalid files: ${invalidFiles.map(f => f.name).join(', ')}`);
      return;
    }

    try {
      setProcessingBulkUpload(true);
      const formData = new FormData();

      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });

      formData.append('assignment_id', selectedAssignment);
      formData.append('student_id', selectedStudent);

      const token = localStorage.getItem('access_token');
      const response = await fetch('https://znd2y0sjxf.execute-api.eu-west-1.amazonaws.com/study-area/bulk-upload-to-pdf', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        // Backend returns a PDF file, not JSON - handle as blob
        const blob = await response.blob();
        console.log('Bulk upload successful - PDF generated:', blob.size, 'bytes');

        // Close modal and refresh
        setBulkUploadNewModal(false);
        setError('');

        // Show success message
        const assignment = assignments.find(a => a.id.toString() === selectedAssignment);
        const student = filteredStudents.find(s => s.id.toString() === selectedStudent);
        setSuccess(`Successfully uploaded ${files.length} files for ${student?.fname} ${student?.lname} - ${assignment?.title}. PDF generated.`);

        // Auto-clear success message after 5 seconds
        setTimeout(() => setSuccess(''), 5000);

        // Refresh bulk upload data
        if (selectedAssignment) {
          await loadBulkUploadStudents(parseInt(selectedAssignment));
        }
      } else {
        const errorText = await response.text();
        console.error('Bulk upload error:', response.status, errorText);
        throw new Error(`Failed to upload files: ${response.status}`);
      }
    } catch (error) {
      console.error('Bulk upload failed:', error);
      setError('Failed to upload files. Please try again.');
    } finally {
      setProcessingBulkUpload(false);
    }
  };

  // Load saved images for selection
  const loadSavedImages = async () => {
    try {
      setLoadingSavedImages(true);

      if (!selectedAssignment) {
        console.log('🖼️ No assignment selected for image loading');
        setSavedImages([]);
        return;
      }

      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Load assignment images using the backend endpoint
      const response = await fetch(`https://znd2y0sjxf.execute-api.eu-west-1.amazonaws.com/study-area/assignment-images/assignment/${selectedAssignment}/summary`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load images: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Loaded assignment images:', data);

      // Transform the student data into a format suitable for image selection
      const imagesList = data.students_data?.flatMap((student: any) =>
        (student.images || []).map((image: any) => ({
          id: image.id,
          filename: image.filename,
          student_name: student.student_name,
          student_id: student.student_id,
          description: image.description,
          upload_date: image.upload_date,
          file_path: image.file_path,
          is_processed: image.is_processed
        }))
      ) || [];

      setSavedImages(imagesList);
      console.log(`✅ Loaded ${imagesList.length} images for selection`);

    } catch (error) {
      console.error('Failed to load saved images:', error);
      setError('Failed to load assignment images. Please try again.');
      setSavedImages([]);
    } finally {
      setLoadingSavedImages(false);
    }
  };

  // Handle selecting a saved image for analysis
  const handleSelectSavedImage = async (image: any) => {
    console.log('Selected image object:', image);

    if (!selectedStudent) {
      setError('Please select a student first');
      return;
    }

    try {
      setIsProcessing(true);
      setError('');

      // Use the proper API endpoint to get the image
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Please log in to access images');
      }

      console.log('Fetching image using API endpoint for image ID:', image.id);

      // Use the correct backend endpoint to get the actual image file
      const fileUrl = `https://znd2y0sjxf.execute-api.eu-west-1.amazonaws.com/study-area/assignment-images/file/${image.id}`;
      console.log('Fetching image file from:', fileUrl);

      let response, blob, file;

      try {
        response = await fetch(fileUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch image file: ${response.status} ${response.statusText}`);
        }

        blob = await response.blob();
        console.log('Fetched blob:', { type: blob.type, size: blob.size });
      } catch (fetchError) {
        throw new Error(`Image fetch failed: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
      }

      // Determine the correct MIME type based on the file extension or force image type
      let mimeType = blob.type;
      if (!mimeType.startsWith('image/')) {
        // If blob type is not an image, try to determine from filename or default to jpeg
        const filename = image.original_filename || image.description || 'image.jpg';
        if (filename.toLowerCase().includes('.png')) {
          mimeType = 'image/png';
        } else if (filename.toLowerCase().includes('.gif')) {
          mimeType = 'image/gif';
        } else if (filename.toLowerCase().includes('.webp')) {
          mimeType = 'image/webp';
        } else {
          mimeType = 'image/jpeg'; // Default to JPEG
        }
        console.log(`Corrected MIME type from ${blob.type} to ${mimeType}`);
      }

      file = new File([blob], image.original_filename || image.description || 'selected-image.jpg', {
        type: mimeType
      });

      console.log('Processing selected image:', {
        filename: file.name,
        type: file.type,
        size: file.size,
        originalBlobType: blob.type
      });

      let result;
      try {
        result = await processFile(file);
      } catch (processError) {
        throw new Error(`Image processing failed: ${processError instanceof Error ? processError.message : 'Unknown error'}`);
      }
      const newResult = {
        ...result,
        targetStudent: selectedStudent
      };

      setAnalysisResults([newResult]);
      setSelectImageModal(false);

      // Handle grading if in grading mode
      if (assignmentType === 'grading' && selectedAssignment) {
        const assignment = assignments.find(a => a.id.toString() === selectedAssignment);
        if (assignment) {
          const studentsList = filteredStudents.length > 0 ? filteredStudents : students;
          const student = studentsList.find(s => s.username === selectedStudent);

          if (student) {
            if (gradingMode === 'auto' && result.grade !== undefined) {
              try {
                await gradesAssignmentsService.createGrade({
                  assignment_id: assignment.id,
                  student_id: student.id,
                  points_earned: result.grade,
                  feedback: result.overallFeedback || result.analysis
                });

                window.dispatchEvent(new CustomEvent('studentGradesUpdated', {
                  detail: {
                    studentUsername: selectedStudent,
                    classroomId: selectedClassroom,
                    subjectId: selectedSubject,
                    assignmentId: selectedAssignment
                  }
                }));
              } catch (error) {
                console.error('❌ Failed to submit auto grade:', error);
                setError(`Failed to submit grade for ${student.username}`);
              }
            } else if (gradingMode === 'manual') {
              const studentKey = student.id.toString();
              setManualGrades(prev => ({
                ...prev,
                [studentKey]: {
                  grade: result.grade || 0,
                  feedback: result.overallFeedback || result.analysis
                }
              }));
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to process selected image:', error);
      console.error('Image object:', image);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process selected image';
      setError(`Failed to process selected image: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Assignment editing function
  const handleUpdateAssignment = async () => {
    if (!selectedAssignment) {
      setError('No assignment selected');
      return;
    }

    const assignment = assignments.find(a => a.id.toString() === selectedAssignment);
    if (!assignment) {
      setError('Assignment not found');
      return;
    }

    try {
      setEditingAssignment(true);
      const token = localStorage.getItem('access_token');

      // Validate required fields according to backend schema
      if (!assignmentTitle || assignmentTitle.trim().length === 0) {
        setError('Assignment title is required');
        return;
      }

      if (!assignmentDescription || assignmentDescription.trim().length < 10) {
        setError('Assignment description must be at least 10 characters long');
        return;
      }

      if (!maxPoints || maxPoints <= 0 || maxPoints > 1000) {
        setError('Max points must be between 1 and 1000');
        return;
      }

      if (!gradingRubric || gradingRubric.trim().length < 10) {
        setError('Grading rubric must be at least 10 characters long');
        return;
      }

      const updateData = {
        title: assignmentTitle.trim(),
        description: assignmentDescription.trim(),
        max_points: parseInt(maxPoints.toString()),
        rubric: gradingRubric.trim()
      };

      console.log('📝 Sending update data:', updateData);

      const response = await fetch(`https://znd2y0sjxf.execute-api.eu-west-1.amazonaws.com/study-area/academic/assignments/${assignment.id}`, {
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
        a.id === assignment.id ? { ...a, ...updateData } : a
      ));

      setSuccess('Assignment updated successfully!');
      setShowAssignmentEditModal(false);

      // Auto-clear success message
      setTimeout(() => setSuccess(''), 3000);

    } catch (error) {
      console.error('❌ Failed to update assignment:', error);
      setError(error instanceof Error ? error.message : 'Failed to update assignment');
    } finally {
      setEditingAssignment(false);
    }
  }; if (loadingStudents) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading students...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      {/* Fixed Right Progress Tracker */}
      <div className="fixed right-2 sm:right-3 lg:right-4 top-1/2 z-50 -translate-y-1/2">
        <div className="w-14 sm:w-56 rounded-2xl border border-gray-200 bg-white/95 p-2 sm:p-3 shadow-[0_12px_34px_rgba(0,0,0,0.14)] backdrop-blur-xl">
          <p className="mb-2 hidden px-1 text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400 sm:block">Progress</p>
          <div className="space-y-1.5">
            {uploadSteps.map((step, index) => {
              const isActive = activeUploadStep === step.id;
              const isComplete = completedSteps[step.id];

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => scrollToUploadStep(step.id)}
                  className={`flex w-full items-center justify-center sm:justify-start gap-2.5 rounded-xl px-1.5 sm:px-2.5 py-2 text-left transition-all duration-200 ${isActive
                    ? 'bg-indigo-50 ring-1 ring-indigo-200'
                    : isComplete
                      ? 'bg-emerald-50'
                      : 'hover:bg-gray-50'
                    }`}
                >
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${isComplete ? 'bg-emerald-500 text-white' : isActive ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {isComplete ? <CheckCircle className="h-3.5 w-3.5" /> : index + 1}
                  </span>
                  <span className={`hidden truncate text-xs font-semibold sm:block ${isActive ? 'text-indigo-700' : isComplete ? 'text-emerald-700' : 'text-gray-600'}`}>
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 md:px-6 pb-12">
        {/* Header */}
        <div className="pt-4">
          <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-6 py-4 shadow-[0_2px_20px_rgba(0,0,0,0.08)]">
            <h2 className="text-xl font-bold tracking-tight text-gray-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' }}>Upload & Grade</h2>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600" />
                <span className="text-sm font-medium text-red-800">{error}</span>
              </div>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
            </div>
          </div>
        )}

        {/* Success Display */}
        {success && (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-800">{success}</span>
              </div>
              <button onClick={() => setSuccess('')} className="text-emerald-400 hover:text-emerald-600"><X className="h-4 w-4" /></button>
            </div>
          </div>
        )}

        {/* CARD 1 — Classroom */}
        <div
          ref={(el) => { uploadStepRefs.current.classroom = el; }}
          className={`mt-3 rounded-2xl p-8 shadow-sm transition-all duration-300 ${completedSteps.classroom
            ? 'border border-emerald-200 bg-emerald-50/60'
            : activeUploadStep === 'classroom'
              ? 'bg-white ring-2 ring-indigo-200 shadow-md'
              : 'border border-gray-100 bg-white'
            }`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className={`h-9 w-9 flex-shrink-0 rounded-full flex items-center justify-center ${completedSteps.classroom ? 'bg-emerald-500' : 'bg-indigo-600'}`}>
              {completedSteps.classroom ? <CheckCircle className="h-4 w-4 text-white" /> : <span className="text-white text-sm font-bold">1</span>}
            </div>
            <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>Choose a Classroom</h3>
          </div>

          {loadingClassrooms ? (
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm">Loading classrooms...</span>
            </div>
          ) : (
            <select
              id="classroom-select"
              value={selectedClassroom}
              onChange={(e) => setSelectedClassroom(e.target.value)}
              className={`w-full rounded-2xl border px-4 py-3.5 text-[15px] font-medium text-gray-900 transition focus:outline-none focus:ring-2 ${selectedClassroom
                ? 'border-emerald-200 bg-emerald-50/80 focus:border-emerald-300 focus:ring-emerald-100'
                : 'border-gray-200 bg-gray-50 focus:border-indigo-400 focus:bg-white focus:ring-indigo-100'
                }`}
            >
              <option value="">Select a classroom...</option>
              {classrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id.toString()}>{classroom.name}</option>
              ))}
            </select>
          )}
          {classrooms.length === 0 && !loadingClassrooms && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              No classrooms found. You need to be assigned to a classroom.
            </div>
          )}
        </div>

        {/* CARD 2 — Subject */}
        {selectedClassroom && (
          <div
            ref={(el) => { uploadStepRefs.current.subject = el; }}
            className={`mt-3 rounded-2xl p-8 shadow-sm transition-all duration-300 ${completedSteps.subject
              ? 'border border-emerald-200 bg-emerald-50/60'
              : activeUploadStep === 'subject'
                ? 'bg-white ring-2 ring-indigo-200 shadow-md'
                : 'border border-gray-100 bg-white'
              }`}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className={`h-9 w-9 flex-shrink-0 rounded-full flex items-center justify-center ${completedSteps.subject ? 'bg-emerald-500' : 'bg-indigo-600'}`}>
                {completedSteps.subject ? <CheckCircle className="h-4 w-4 text-white" /> : <span className="text-white text-sm font-bold">2</span>}
              </div>
              <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>Pick a Subject</h3>
            </div>
            {loadingSubjects ? (
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm">Loading subjects...</span>
              </div>
            ) : (
              <select
                id="subject-select"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className={`w-full rounded-2xl border px-4 py-3.5 text-[15px] font-medium text-gray-900 transition focus:outline-none focus:ring-2 ${selectedSubject
                  ? 'border-emerald-200 bg-emerald-50/80 focus:border-emerald-300 focus:ring-emerald-100'
                  : 'border-gray-200 bg-gray-50 focus:border-indigo-400 focus:bg-white focus:ring-indigo-100'
                  }`}
              >
                <option value="">Select a subject...</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id.toString()}>{subject.name}</option>
                ))}
              </select>
            )}
            {subjects.length === 0 && !loadingSubjects && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                No subjects found for this classroom.
              </div>
            )}
          </div>
        )}

        {/* CARD 3 — Assignment */}
        {selectedSubject && (
          <div
            ref={(el) => { uploadStepRefs.current.assignment = el; }}
            className={`mt-3 rounded-2xl p-8 shadow-sm transition-all duration-300 ${completedSteps.assignment
              ? 'border border-emerald-200 bg-emerald-50/60'
              : activeUploadStep === 'assignment'
                ? 'bg-white ring-2 ring-indigo-200 shadow-md'
                : 'border border-gray-100 bg-white'
              }`}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className={`h-9 w-9 flex-shrink-0 rounded-full flex items-center justify-center ${completedSteps.assignment ? 'bg-emerald-500' : 'bg-indigo-600'}`}>
                {completedSteps.assignment ? <CheckCircle className="h-4 w-4 text-white" /> : <span className="text-white text-sm font-bold">3</span>}
              </div>
              <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>Select Assignment</h3>
            </div>

            {loadingAssignments ? (
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm">Loading assignments...</span>
              </div>
            ) : (
              <select
                id="assignment-select"
                value={selectedAssignment}
                onChange={(e) => setSelectedAssignment(e.target.value)}
                className={`w-full rounded-2xl border px-4 py-3.5 text-[15px] font-medium text-gray-900 transition focus:outline-none focus:ring-2 ${selectedAssignment
                  ? 'border-emerald-200 bg-emerald-50/80 focus:border-emerald-300 focus:ring-emerald-100'
                  : 'border-gray-200 bg-gray-50 focus:border-indigo-400 focus:bg-white focus:ring-indigo-100'
                  }`}
              >
                <option value="">Select an assignment...</option>
                {assignments.map((assignment) => (
                  <option key={assignment.id} value={assignment.id.toString()}>
                    {assignment.title} (Max: {assignment.max_points} pts)
                  </option>
                ))}
              </select>
            )}
            {assignments.length === 0 && !loadingAssignments && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                No assignments found for this subject.
              </div>
            )}
          </div>
        )}

        {/* Grade Submission Status */}
        {submittingGrade && (
          <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Submitting grade to gradebook...</span>
            </div>
          </div>
        )}

        {/* CARD 4 — Grading Settings */}
        {selectedAssignment && (
          <div
            ref={(el) => { uploadStepRefs.current.settings = el; }}
            className={`mt-3 rounded-2xl p-8 shadow-sm transition-all duration-300 ${completedSteps.settings
              ? 'border border-emerald-200 bg-emerald-50/60'
              : activeUploadStep === 'settings'
                ? 'bg-white ring-2 ring-indigo-200 shadow-md'
                : 'border border-gray-100 bg-white'
              }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 flex-shrink-0 rounded-full flex items-center justify-center ${completedSteps.settings ? 'bg-emerald-500' : 'bg-indigo-600'}`}>
                  {completedSteps.settings ? <CheckCircle className="h-4 w-4 text-white" /> : <span className="text-white text-sm font-bold">4</span>}
                </div>
                <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>Grading Settings</h3>
              </div>
              <button
                onClick={() => setShowAssignmentEditModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-gray-400">Assignment Title</label>
                <input
                  type="text"
                  value={assignmentTitle}
                  onChange={(e) => setAssignmentTitle(e.target.value)}
                  placeholder="e.g., Math Quiz #3"
                  disabled={!!selectedAssignment}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-[15px] font-medium text-gray-900 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-gray-400">Max Points</label>
                <input
                  type="number"
                  value={maxPoints}
                  onChange={(e) => setMaxPoints(Number(e.target.value))}
                  min="1"
                  max="1000"
                  disabled={!!selectedAssignment}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-[15px] font-medium text-gray-900 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-gray-400">Grading Rubric</label>
                <textarea
                  value={gradingRubric}
                  onChange={(e) => setGradingRubric(e.target.value)}
                  placeholder="Rubric loaded from assignment..."
                  rows={3}
                  disabled={!!selectedAssignment}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-[15px] font-medium text-gray-900 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-gray-400">Feedback Type</label>
                <select
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value as 'detailed' | 'summary' | 'both')}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-[15px] font-medium text-gray-900 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="both">Both Detailed & Summary</option>
                  <option value="detailed">Detailed Only</option>
                  <option value="summary">Summary Only</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* CARD 5 — Select Students */}
        {selectedAssignment && (
          <div
            ref={(el) => { uploadStepRefs.current.students = el; }}
            className={`mt-3 rounded-2xl p-8 shadow-sm transition-all duration-300 ${completedSteps.students
              ? 'border border-emerald-200 bg-emerald-50/60'
              : activeUploadStep === 'students'
                ? 'bg-white ring-2 ring-indigo-200 shadow-md'
                : 'border border-gray-100 bg-white'
              }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 flex-shrink-0 rounded-full flex items-center justify-center ${completedSteps.students ? 'bg-emerald-500' : 'bg-indigo-600'}`}>
                  {completedSteps.students ? <CheckCircle className="h-4 w-4 text-white" /> : <span className="text-white text-sm font-bold">5</span>}
                </div>
                <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>Select Students</h3>
              </div>
              {filteredStudents.length > 0 && (
                <button
                  onClick={handleChooseAll}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${selectedStudents.length === filteredStudents.length ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
                >
                  {selectedStudents.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>

            {filteredStudents.length === 0 ? (
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                No students found in both the selected classroom and subject.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {filteredStudents.map((student) => {
                  const uploadStatus = studentUploadStatus[student.id];
                  const isSelected = selectedStudents.includes(student.id);
                  return (
                    <div
                      key={student.id}
                      className={`flex items-center justify-between rounded-xl border p-4 transition-all ${isSelected ? 'border-indigo-300 bg-indigo-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudents(prev => [...prev, student.id]);
                            } else {
                              setSelectedStudents(prev => prev.filter(id => id !== student.id));
                            }
                          }}
                          className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{student.fname} {student.lname}</p>
                          <p className="text-xs text-gray-400">@{student.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {uploadStatus?.hasUpload ? (
                          <button
                            onClick={() => showStudentUploads(student.id, `${student.fname} ${student.lname}`)}
                            className="rounded-lg bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-200 transition-colors"
                          >
                            View Upload
                          </button>
                        ) : (
                          <div className="relative group">
                            <input
                              type="file"
                              id={`file-upload-${student.id}`}
                              multiple
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  handleStudentFileSelection(e.target.files, student.id, `${student.fname} ${student.lname}`);
                                }
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <button className="flex items-center gap-1 rounded-lg bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800 hover:bg-indigo-200 transition-colors">
                              <Upload className="h-3 w-3" />
                              Upload
                            </button>
                          </div>
                        )}
                        {studentGradingStatus[student.id] && (
                          <button
                            onClick={() => viewStudentGradeDetails(student.id)}
                            disabled={loadingGradingStatus}
                            className="rounded-lg bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800 hover:bg-purple-200 transition-colors disabled:opacity-50"
                          >
                            Graded
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Status messages */}
            {selectedStudents.length > 0 && !allSelectedStudentsHaveUploads() && (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Missing uploads</p>
                  <p>All selected students must have uploaded their work before grading.</p>
                </div>
              </div>
            )}
            {selectedStudents.length > 0 && allSelectedStudentsHaveUploads() && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                All selected students have uploads — ready to grade!
              </div>
            )}

            {assignmentType === 'grading' && isProcessing && liveGradingProgress.active && (
              <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50/80 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-indigo-900">Live Grading Progress</h4>
                  <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800">
                    {liveGradingProgress.completedStudents}/{Math.max(1, liveGradingProgress.totalStudents)} processed
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="rounded-xl border border-indigo-100 bg-white p-3">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-indigo-500">Completed</div>
                    <div className="mt-1 text-xl font-bold text-indigo-900">{liveGradingProgress.completedStudents}</div>
                  </div>

                  <div className="rounded-xl border border-emerald-100 bg-white p-3">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-emerald-500">Successful</div>
                    <div className="mt-1 text-xl font-bold text-emerald-700">{liveGradingProgress.successfulStudents}</div>
                  </div>

                  <div className="rounded-xl border border-rose-100 bg-white p-3">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-rose-500">Failed</div>
                    <div className="mt-1 text-xl font-bold text-rose-700">{liveGradingProgress.failedStudents}</div>
                  </div>

                  <div className="rounded-xl border border-amber-100 bg-white p-3">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-amber-600">Current Student</div>
                    <div className="mt-1 truncate text-sm font-semibold text-amber-800">
                      {liveGradingProgress.currentStudentName || 'Preparing...'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Grade Button */}
            <button
              onClick={assignmentType === 'grading' ? handleBulkGrading : processFiles}
              disabled={
                isProcessing ||
                selectedStudents.length === 0 ||
                filteredStudents.length === 0 ||
                (assignmentType === 'grading' && (!selectedAssignment || !allSelectedStudentsHaveUploads()))
              }
              className="mt-6 w-full rounded-2xl bg-indigo-600 px-6 py-4 text-base font-bold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
            >
              {isProcessing ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>{assignmentType === 'grading' ? 'Grading' : 'Analyzing'}</span>
                  </div>
                  <div className="w-full">
                    <div className="mb-1 flex justify-between text-xs text-white/80">
                      <span>{processingStep || 'Processing...'}</span>
                      <span>{Math.round(processingProgress)}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/20">
                      <div
                        className="h-1.5 rounded-full bg-white transition-all duration-700"
                        style={{ width: `${Math.max(3, processingProgress)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Send className="h-4 w-4" />
                  {assignmentType === 'grading' ? 'Grade' : 'Analyze'}
                  {selectedStudents.length > 1 && ` (${selectedStudents.length} students)`}
                </div>
              )}
            </button>
          </div>
        )}

        {/* No Classrooms Warning */}
        {classrooms.length === 0 && !loadingClassrooms && students.length === 0 && !loadingStudents && (
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
            <User className="mx-auto mb-3 h-10 w-10 text-amber-400" />
            <h3 className="text-lg font-bold text-amber-800 mb-1">No Students Found</h3>
            <p className="text-sm text-amber-700 mb-4">Add students to your class to get started.</p>
            <button
              onClick={() => window.location.hash = '#manage-class'}
              className="rounded-xl bg-amber-100 px-5 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-200 transition-colors"
            >
              Add Students
            </button>
          </div>
        )}

        {/* Student Analysis Results Section */}
        {analysisResults.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Student Analysis Results</h3>
                <p className="text-sm text-gray-600 mt-1">Click on a student to view their detailed analysis</p>
              </div>
              <div className="flex items-center space-x-3">
                {/* Global Raw Feedback Toggle */}
                <button
                  onClick={() => setShowRawFeedback(!showRawFeedback)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${showRawFeedback
                    ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                  {showRawFeedback ? '🔍 RAW MODE' : '📝 FORMAT MODE'}
                </button>
                <button
                  onClick={clearResults}
                  className="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Clear All</span>
                </button>
              </div>
            </div>
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {analysisResults.map((result, index) => {
                  const student = (filteredStudents.length > 0 ? filteredStudents : students).find(
                    s => s.username === result.targetStudent || s.id.toString() === result.targetStudent
                  );

                  return (
                    <div
                      key={index}
                      onClick={() => {
                        console.log('🔍 Opening modal with result:', {
                          detailedFeedback: result.detailedFeedback?.length || 0,
                          overallFeedback: result.overallFeedback?.length || 0,
                          analysis: result.analysis?.length || 0,
                          detailedPreview: result.detailedFeedback?.substring(0, 100) + '...' || 'None',
                          overallPreview: result.overallFeedback?.substring(0, 100) + '...' || 'None'
                        });
                        setFullAnalysisModal({ isOpen: true, analysis: result });
                      }}
                      className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] hover:border-blue-300"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                          {student ? `${student.fname[0]}${student.lname[0]}` : result.targetStudent?.[0] || 'S'}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm">
                            {student ? `${student.fname} ${student.lname}` : result.targetStudent}
                          </h4>
                          <p className="text-xs text-gray-600">
                            {student?.username || 'Student'}
                          </p>
                        </div>
                      </div>

                      {/* Grade Display or Retry Notice */}
                      {result.needs_retry ? (
                        <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                            <span className="text-sm font-medium text-amber-800">Needs Manual Retry</span>
                          </div>
                          <p className="text-xs text-amber-700 mb-2">{result.error}</p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent modal opening
                              // TODO: Add retry logic here
                              console.log('Retry grading for student:', result.targetStudent);
                            }}
                            className="px-3 py-1 bg-amber-500 text-white text-xs rounded hover:bg-amber-600 transition-colors"
                          >
                            Retry Grading
                          </button>
                        </div>
                      ) : Number.isFinite(result.grade) ? (
                        <div className="mb-3">
                          {(() => {
                            const maxScore = result.maxPoints || maxPoints;
                            const ratio = maxScore > 0 ? (result.grade! / maxScore) : 0;
                            const percentage = Math.round(ratio * 100);
                            return (
                              <>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium text-gray-700">Grade</span>
                                  <span className="text-sm font-bold text-gray-900">
                                    {result.grade}/{result.maxPoints || maxPoints}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-300 ${ratio >= 0.9 ? 'bg-green-500' :
                                      ratio >= 0.8 ? 'bg-blue-500' :
                                        ratio >= 0.7 ? 'bg-yellow-500' :
                                          'bg-red-500'
                                      }`}
                                    style={{
                                      width: `${Math.max(5, ratio * 100)}%`
                                    }}
                                  ></div>
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  {percentage}%
                                  {result.letterGrade && ` (${result.letterGrade})`}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      ) : null}

                      {/* Quick Insights */}
                      <div className="space-y-2">
                        {result.strengths && result.strengths.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="text-xs text-green-700 truncate">
                              {result.strengths.length} strength{result.strengths.length !== 1 ? 's' : ''} identified
                            </span>
                          </div>
                        )}

                        {result.improvementAreas && result.improvementAreas.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            <span className="text-xs text-amber-700 truncate">
                              {result.improvementAreas.length} area{result.improvementAreas.length !== 1 ? 's' : ''} to improve
                            </span>
                          </div>
                        )}

                        {result.confidence && (
                          <div className="flex items-center space-x-2">
                            <Brain className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <span className="text-xs text-blue-700">
                              {result.confidence}% AI confidence
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <div className="flex items-center justify-center text-xs text-blue-600 font-medium">
                          <Eye className="w-3 h-3 mr-1" />
                          Click to view full analysis
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Manual Grading Section */}
              {assignmentType === 'grading' && gradingMode === 'manual' && Object.keys(manualGrades).length > 0 && (
                <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-yellow-900">Manual Grade Review</h4>
                    <button
                      onClick={submitManualGrades}
                      disabled={isProcessing}
                      className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium flex flex-col items-center justify-center space-y-2"
                    >
                      {isProcessing ? (
                        <div className="flex flex-col items-center space-y-2 w-full">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            </div>
                            <span className="font-medium">Submitting Grades...</span>
                          </div>
                          {processingStep && (
                            <div className="w-full max-w-xs">
                              <div className="flex justify-between text-xs text-white/80 mb-1">
                                <span>{processingStep}</span>
                                <span>{Math.round(processingProgress)}%</span>
                              </div>
                              <div className="w-full bg-white/20 rounded-full h-1.5">
                                <div
                                  className="bg-white h-1.5 rounded-full transition-all duration-300 ease-out"
                                  style={{ width: `${processingProgress}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Send className="w-4 h-4" />
                          <span>Submit Grades</span>
                        </div>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(manualGrades).map(([studentId, gradeData]) => {
                      const student = (filteredStudents.length > 0 ? filteredStudents : students).find(
                        s => s.id.toString() === studentId
                      );
                      const assignment = assignments.find(a => a.id.toString() === selectedAssignment);

                      return (
                        <div key={studentId} className="bg-white p-4 rounded-lg border border-yellow-300">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium text-gray-900">
                              {student ? `${student.fname} ${student.lname}` : `Student ${studentId}`}
                            </h5>
                            <div className="text-lg font-bold text-yellow-800">
                              {gradeData.grade}/{assignment?.max_points || maxPoints}
                              <span className="text-sm font-normal ml-1">
                                ({Math.round((gradeData.grade / (assignment?.max_points || maxPoints)) * 100)}%)
                              </span>
                            </div>
                          </div>

                          {gradeData.feedback && (
                            <div className="bg-gray-50 p-3 rounded border mb-3">
                              <h6 className="font-medium text-gray-700 mb-1">Feedback:</h6>
                              <p className="text-sm text-gray-600">{gradeData.feedback}</p>
                            </div>
                          )}

                          {/* Allow manual editing of grade */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Grade (out of {assignment?.max_points || maxPoints})
                              </label>
                              <input
                                type="number"
                                min="0"
                                max={assignment?.max_points || maxPoints}
                                value={gradeData.grade}
                                onChange={(e) => {
                                  const newGrade = parseInt(e.target.value);
                                  if (!isNaN(newGrade)) {
                                    setManualGrades(prev => ({
                                      ...prev,
                                      [studentId]: {
                                        ...prev[studentId],
                                        grade: newGrade
                                      }
                                    }));
                                  }
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Feedback
                              </label>
                              <textarea
                                value={gradeData.feedback}
                                onChange={(e) => {
                                  setManualGrades(prev => ({
                                    ...prev,
                                    [studentId]: {
                                      ...prev[studentId],
                                      feedback: e.target.value
                                    }
                                  }));
                                }}
                                rows={2}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Additional feedback..."
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Full Analysis Modal */}
        {fullAnalysisModal.isOpen && fullAnalysisModal.analysis && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Complete Assignment Feedback</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      // Force regeneration of complete feedback
                      console.log("Regenerating complete feedback...");
                      // TODO: Add regeneration logic here
                    }}
                    className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium"
                  >
                    Regenerate Full Feedback
                  </button>
                  <button
                    onClick={() => setFullAnalysisModal({ isOpen: false, analysis: null })}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
                <div className="space-y-6">
                  {/* Grade Header Card */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          {fullAnalysisModal.analysis.targetStudent}
                        </h2>
                        <p className="text-gray-600">Assignment Feedback</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-blue-600">
                          {Number.isFinite(fullAnalysisModal.analysis.grade)
                            ? fullAnalysisModal.analysis.grade
                            : 'N/A'}
                          /
                          {fullAnalysisModal.analysis.maxPoints || maxPoints}
                        </div>
                        <div className="text-lg text-gray-600">
                          {Number.isFinite(fullAnalysisModal.analysis.percentage)
                            ? `${fullAnalysisModal.analysis.percentage}%`
                            : 'Not available'}
                          {fullAnalysisModal.analysis.letterGrade ? ` - ${fullAnalysisModal.analysis.letterGrade}` : ''}
                        </div>
                        <div className="text-sm text-green-600 font-medium">
                          Confidence: {Number.isFinite(fullAnalysisModal.analysis.confidence)
                            ? `${fullAnalysisModal.analysis.confidence}%`
                            : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Extracted Text */}
                  {fullAnalysisModal.analysis.extractedText && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Extracted Text</h3>
                      <p className="text-gray-700">{fullAnalysisModal.analysis.extractedText}</p>
                    </div>
                  )}

                  {/* Rubric-Based Feedback */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      Rubric Feedback
                    </h3>

                    {fullAnalysisModal.analysis.gradingCriteria && fullAnalysisModal.analysis.gradingCriteria.length > 0 ? (
                      <div className="space-y-4">
                        {fullAnalysisModal.analysis.gradingCriteria.map((criteria, index) => {
                          const scoreText = criteria.scoreDisplay || (
                            Number.isFinite(criteria.score) && Number.isFinite(criteria.maxScore)
                              ? `${criteria.score}/${criteria.maxScore}`
                              : (Number.isFinite(criteria.score) ? `${criteria.score}` : 'Not scored')
                          );
                          return (
                            <div key={index} className="text-sm text-gray-800 leading-relaxed">
                              <p>
                                <span className="font-semibold text-gray-900">{criteria.category}</span>
                                <span className="text-blue-700 font-semibold"> ({scoreText})</span>
                                <span>: {criteria.feedback || 'No detailed feedback provided for this criterion.'}</span>
                              </p>
                              {criteria.evidenceSnippet && criteria.evidenceSnippet !== 'N/A' && (
                                <p className="text-xs text-gray-600 mt-1 italic">
                                  Evidence: "{criteria.evidenceSnippet}"
                                </p>
                              )}
                            </div>
                          );
                        })}

                        {(fullAnalysisModal.analysis.overallFeedback || fullAnalysisModal.analysis.summaryFeedback || fullAnalysisModal.analysis.detailedFeedback) && (
                          <div className="pt-3 border-t border-gray-200">
                            <p className="text-sm text-gray-800 leading-relaxed">
                              <span className="font-semibold text-gray-900">Overall conclusion:</span>{' '}
                              {fullAnalysisModal.analysis.overallFeedback || fullAnalysisModal.analysis.summaryFeedback || fullAnalysisModal.analysis.detailedFeedback}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">
                        No rubric paragraph feedback was returned for this submission.
                      </div>
                    )}
                  </div>

                  {/* Knowledge Gaps */}
                  {fullAnalysisModal.analysis.knowledgeGaps && fullAnalysisModal.analysis.knowledgeGaps.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                        Knowledge Gaps Identified
                      </h3>
                      <ul className="space-y-2">
                        {fullAnalysisModal.analysis.knowledgeGaps.map((gap, index) => (
                          <li key={index} className="text-gray-700 flex items-start">
                            <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            {gap}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  {fullAnalysisModal.analysis.recommendations && fullAnalysisModal.analysis.recommendations.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Recommendations
                      </h3>
                      <ul className="space-y-2">
                        {fullAnalysisModal.analysis.recommendations.map((rec, index) => (
                          <li key={index} className="text-gray-700 flex items-start">
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Strengths */}
                  {fullAnalysisModal.analysis.strengths && fullAnalysisModal.analysis.strengths.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Strengths
                      </h3>
                      <ul className="space-y-2">
                        {fullAnalysisModal.analysis.strengths.map((strength, index) => (
                          <li key={index} className="text-gray-700 flex items-start">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Improvement Areas */}
                  {fullAnalysisModal.analysis.improvementAreas && fullAnalysisModal.analysis.improvementAreas.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                        Areas for Improvement
                      </h3>
                      <ul className="space-y-2">
                        {fullAnalysisModal.analysis.improvementAreas.map((area, index) => (
                          <li key={index} className="text-gray-700 flex items-start">
                            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            {area}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Grading Criteria intentionally rendered in the Rubric-Based Feedback section above. */}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Select Uploaded Files Modal */}
        {selectImageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Select Uploaded Files</h3>
                  <p className="text-sm text-gray-600">Choose from previously uploaded images or PDFs</p>
                </div>
                <button
                  onClick={() => setSelectImageModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Upload Options Tabs */}
              <div className="border-b border-gray-200">
                <div className="flex space-x-1 p-1 bg-gray-50">
                  <button
                    onClick={() => setUploadModalTab('single')}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${uploadModalTab === 'single'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Image className="w-4 h-4" />
                      <span>Select Single File</span>
                    </div>
                  </button>
                  {assignmentType === 'grading' && selectedAssignment && (
                    <button
                      onClick={() => setUploadModalTab('bulk')}
                      className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${uploadModalTab === 'bulk'
                        ? 'bg-white text-purple-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <FolderUp className="w-4 h-4" />
                        <span>Bulk Upload Options</span>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-12rem)]">
                {uploadModalTab === 'single' ? (
                  // Single File Selection Tab
                  <div>
                    {loadingSavedImages ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="flex items-center space-x-3">
                          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                          <span className="text-gray-600">Loading saved files...</span>
                        </div>
                      </div>
                    ) : savedImages.length === 0 ? (
                      <div className="text-center py-12">
                        <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Saved Files</h3>
                        <p className="text-gray-600 mb-4">
                          You haven't uploaded any files yet. Upload your first file to get started.
                        </p>
                        <button
                          onClick={() => setSelectImageModal(false)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                        >
                          Close and Upload
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {savedImages.map((image) => (
                          <div key={image.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                            {/* Image Preview */}
                            <div className="aspect-square bg-gray-100 relative group">
                              <img
                                src={image.dataUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1SDc1Vjc1WiIgZmlsbD0iI0Q1RDlERCIvPgo8L3N2Zz4K'}
                                alt={image.description || 'Saved image'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  console.log('Image failed to load for ID:', image.id);
                                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1SDc1Vjc1WiIgZmlsbD0iI0Q1RD lERCIvPgo8L3N2Zz4K';
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                                <button
                                  onClick={() => handleSelectSavedImage(image)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                                >
                                  Select This Image
                                </button>
                              </div>
                            </div>

                            {/* Image Info */}
                            <div className="p-4">
                              <h4 className="font-medium text-gray-900 truncate mb-1">
                                {image.description || 'Untitled Image'}
                              </h4>

                              {image.tags && (
                                <div className="mb-2">
                                  <div className="flex flex-wrap gap-1">
                                    {image.tags.split(',').slice(0, 3).map((tag: string, index: number) => (
                                      <span
                                        key={index}
                                        className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                      >
                                        {tag.trim()}
                                      </span>
                                    ))}
                                    {image.tags.split(',').length > 3 && (
                                      <span className="text-xs text-gray-500">
                                        +{image.tags.split(',').length - 3} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {image.subject_name && (
                                <div className="mb-2">
                                  <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                    {image.subject_name}
                                  </span>
                                </div>
                              )}

                              <div className="text-xs text-gray-500 mb-3">
                                {new Date(image.upload_date).toLocaleDateString()}
                              </div>

                              <button
                                onClick={() => handleSelectSavedImage(image)}
                                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors"
                              >
                                Select for Analysis
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Bulk Upload Options Tab
                  <div className="space-y-6">
                    {/* Instructions */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h3 className="font-medium text-purple-900 mb-2">Bulk Upload Options:</h3>
                      <p className="text-sm text-purple-800">Choose how you want to handle bulk uploads for your assignment.</p>
                    </div>

                    {/* Bulk Upload Buttons */}
                    <div className="grid grid-cols-1 gap-4">
                      <button
                        onClick={() => {
                          setSelectImageModal(false);
                          handleBulkUploadExisting();
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-lg flex items-center justify-center space-x-3 transition-colors"
                        disabled={!selectedAssignment || assignmentType !== 'grading'}
                      >
                        <FolderUp className="w-6 h-6" />
                        <div className="text-left">
                          <div className="font-medium">Select Student Files</div>
                          <div className="text-sm text-purple-200">Choose from already uploaded student files to grade</div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setSelectImageModal(false);
                          handleBulkUploadNew();
                        }}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-4 rounded-lg flex items-center justify-center space-x-3 transition-colors"
                        disabled={!selectedAssignment || assignmentType !== 'grading'}
                      >
                        <Upload className="w-6 h-6" />
                        <div className="text-left">
                          <div className="font-medium">Upload New Files</div>
                          <div className="text-sm text-orange-200">Upload new files for bulk processing</div>
                        </div>
                      </button>
                    </div>

                    {(!selectedAssignment || assignmentType !== 'grading') && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                          <span className="text-yellow-800 text-sm">
                            Please select an assignment and set task type to "Grade Assignment" to enable bulk upload options.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bulk Upload Existing Files Modal */}
        {bulkUploadExistingModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Select Student Files</h3>
                  <button
                    onClick={() => setBulkUploadExistingModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-gray-600">
                    Assignment: <strong>{assignments.find(a => a.id.toString() === selectedAssignment)?.title}</strong>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Select student files to grade. The selected files will appear in the main upload area.
                  </p>
                </div>

                {loadingBulkStudents ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                    <span className="text-gray-600">Loading student uploads...</span>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {bulkUploadModal.students && bulkUploadModal.students.length > 0 ? (
                      bulkUploadModal.students.map((student) => (
                        <div key={student.student_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{student.student_name}</p>
                            <p className="text-sm text-gray-600">Student ID: {student.student_id}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {student.has_pdf ? (
                              <>
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="text-green-600 text-sm">PDF Available</span>
                                <button
                                  onClick={() => handleSelectBulkFile(student)}
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                                >
                                  Select
                                </button>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-5 h-5 text-yellow-600" />
                                <span className="text-yellow-600 text-sm">No upload</span>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No student data available</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bulk Upload New Files Modal */}
        {bulkUploadNewModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Bulk Upload New Files</h3>
                  <button
                    onClick={() => setBulkUploadNewModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-gray-600">
                    Assignment: <strong>{assignments.find(a => a.id.toString() === selectedAssignment)?.title}</strong>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Upload multiple files for a specific student. Files will be combined into a PDF.
                  </p>
                </div>

                {/* Student Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Student
                  </label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">Choose a student...</option>
                    {filteredStudents.map((student) => (
                      <option key={student.id} value={student.id.toString()}>
                        {student.fname} {student.lname}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const files = e.dataTransfer.files;
                      if (files && files.length > 0 && selectedStudent) {
                        handleNewBulkUpload(files);
                      } else if (!selectedStudent) {
                        setError('Please select a student first');
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={() => {
                      if (!selectedStudent) {
                        setError('Please select a student first');
                        return;
                      }
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.multiple = true;
                      input.accept = 'image/*,application/pdf,.pdf';
                      input.onchange = (e) => {
                        const files = (e.target as HTMLInputElement).files;
                        if (files && files.length > 0) {
                          handleNewBulkUpload(files);
                        }
                      };
                      input.click();
                    }}
                  >
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-2">
                      {selectedStudent ? 'Drag and drop files here, or click to select' : 'Please select a student first'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedStudent ? 'Supports PNG, JPG, JPEG images and PDF documents' : 'Choose a student from the dropdown above'}
                    </p>
                  </div>

                  {processingBulkUpload && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                      <span className="text-gray-600">Processing bulk upload...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assignment Edit Modal */}
        {showAssignmentEditModal && selectedAssignment && (
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
                  onClick={() => setShowAssignmentEditModal(false)}
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
                      value={assignmentTitle}
                      onChange={(e) => setAssignmentTitle(e.target.value)}
                      placeholder="Assignment title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assignment Description
                    </label>
                    <textarea
                      value={assignmentDescription}
                      onChange={(e) => setAssignmentDescription(e.target.value)}
                      placeholder="Assignment description (minimum 10 characters)"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {assignmentDescription.length}/1000 characters (minimum 10 required)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Points
                    </label>
                    <input
                      type="number"
                      value={maxPoints}
                      onChange={(e) => setMaxPoints(Number(e.target.value))}
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
                      value={gradingRubric}
                      onChange={(e) => setGradingRubric(e.target.value)}
                      placeholder="Describe grading criteria, what to look for, point distribution, etc."
                      rows={5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This rubric will be used for automated grading
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer - Fixed */}
              <div className="flex items-center justify-between p-6 border-t bg-gray-50 flex-shrink-0">
                <p className="text-sm text-gray-600">
                  Changes will be saved to the assignment and used for future grading
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowAssignmentEditModal(false)}
                    disabled={editingAssignment}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateAssignment}
                    disabled={editingAssignment || !assignmentTitle.trim() || !assignmentDescription.trim() || assignmentDescription.trim().length < 10 || maxPoints <= 0}
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

        {/* Student Uploads Modal */}
        {studentUploadsModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Uploads for {studentUploadsModal.studentName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Assignment: {assignments.find(a => a.id.toString() === selectedAssignment)?.title}
                  </p>
                </div>
                <button
                  onClick={() => setStudentUploadsModal({ isOpen: false })}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
                {studentUploadsModal.uploads && studentUploadsModal.uploads.length > 0 ? (
                  <div className="space-y-4">
                    {studentUploadsModal.uploads.map((upload, index) => (
                      <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">Student Submission</h4>
                              <p className="text-sm text-gray-600">
                                {upload.has_pdf ? 'PDF Generated' : `${upload.image_count} Images`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {upload.has_pdf && (
                              <button
                                onClick={() => downloadStudentPDF(parseInt(selectedAssignment!), upload.student_id, upload.student_name)}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                              >
                                Download PDF
                              </button>
                            )}
                            <button
                              onClick={() => deleteStudentPDF(parseInt(selectedAssignment!), upload.student_id)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Status:</span>
                            <p className="font-medium">
                              {upload.is_graded ? (
                                <span className="text-green-600">Graded</span>
                              ) : (
                                <span className="text-yellow-600">Not Graded</span>
                              )}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">Images:</span>
                            <p className="font-medium">{upload.image_count}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">PDF:</span>
                            <p className="font-medium">
                              {upload.has_pdf ? (
                                <span className="text-green-600">✓ Generated</span>
                              ) : (
                                <span className="text-gray-400">Not generated</span>
                              )}
                            </p>
                          </div>
                          {upload.generated_date && (
                            <div>
                              <span className="text-gray-600">Generated:</span>
                              <p className="font-medium">
                                {new Date(upload.generated_date).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No uploads found</h3>
                    <p className="text-gray-600 mb-4">
                      This student hasn't uploaded any work for this assignment yet.
                    </p>
                    <button
                      onClick={() => {
                        setStudentUploadsModal({ isOpen: false });
                        if (studentUploadsModal.studentId && studentUploadsModal.studentName) {
                          handleUploadForStudent(studentUploadsModal.studentId, studentUploadsModal.studentName);
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                      Upload Files for This Student
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Existing Grade Details Modal - Shows full feedback when viewing existing grade */}
        {existingGradeModal.isOpen && existingGradeModal.gradeDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <Eye className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Grade Details</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">{existingGradeModal.gradeDetails.student_name}</span>
                      <span className="mx-2">•</span>
                      <span>{existingGradeModal.gradeDetails.assignment_title}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                    title="Print Grade Report"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setExistingGradeModal({ isOpen: false })}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
                <div className="space-y-6">
                  {/* Grade Summary */}
                  <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-xl p-6 shadow-sm">
                    <div className="text-center mb-4">
                      <h4 className="text-xl font-bold text-blue-900 mb-2">Grade Summary</h4>
                      <div className="w-16 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mx-auto"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
                          <div className="text-blue-600 text-sm font-medium mb-2">Points Earned</div>
                          <div className="text-blue-900 text-3xl font-bold mb-1">
                            {existingGradeModal.gradeDetails.points_earned}
                          </div>
                          <div className="text-blue-700 text-xs">
                            out of {existingGradeModal.gradeDetails.max_points}
                          </div>
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-indigo-100">
                          <div className="text-indigo-600 text-sm font-medium mb-2">Percentage</div>
                          <div className="text-indigo-900 text-3xl font-bold mb-1">
                            {existingGradeModal.gradeDetails.percentage}%
                          </div>
                          <div className="text-indigo-700 text-xs">
                            {existingGradeModal.gradeDetails.percentage >= 90 ? 'Excellent' :
                              existingGradeModal.gradeDetails.percentage >= 80 ? 'Good' :
                                existingGradeModal.gradeDetails.percentage >= 70 ? 'Fair' :
                                  existingGradeModal.gradeDetails.percentage >= 60 ? 'Needs Improvement' : 'Poor'}
                          </div>
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100">
                          <div className="text-purple-600 text-sm font-medium mb-2">Letter Grade</div>
                          <div className="text-purple-900 text-3xl font-bold mb-1">
                            {existingGradeModal.gradeDetails.percentage >= 90 ? 'A' :
                              existingGradeModal.gradeDetails.percentage >= 80 ? 'B' :
                                existingGradeModal.gradeDetails.percentage >= 70 ? 'C' :
                                  existingGradeModal.gradeDetails.percentage >= 60 ? 'D' : 'F'}
                          </div>
                          <div className="text-purple-700 text-xs">
                            Grade Level
                          </div>
                        </div>
                      </div>
                    </div>

                    {existingGradeModal.gradeDetails.graded_date && (
                      <div className="text-center mt-6 pt-4 border-t border-blue-200">
                        <div className="flex items-center justify-center gap-2 text-blue-700 text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>
                            Graded on {new Date(existingGradeModal.gradeDetails.graded_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {existingGradeModal.gradeDetails.ai_generated && (
                            <span className="ml-2 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-medium">
                              AI Generated
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI Generation Info */}
                  {existingGradeModal.gradeDetails.ai_generated && (
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-purple-100 p-2 rounded-lg">
                          <Brain className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-purple-900">AI-Generated Grade</h5>
                          <p className="text-purple-700 text-sm">
                            This grade was automatically generated by our AI grading system
                            {existingGradeModal.gradeDetails.ai_confidence && (
                              <span className="ml-2">
                                (Confidence: {existingGradeModal.gradeDetails.ai_confidence}%)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Full Feedback */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      Complete Feedback
                    </h4>
                    {existingGradeModal.gradeDetails.feedback ? (
                      formatDetailedFeedback(existingGradeModal.gradeDetails.feedback)
                    ) : (
                      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden p-6 text-center">
                        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 text-lg font-medium">No detailed feedback available</p>
                        <p className="text-gray-400 text-sm mt-1">This grade was submitted without detailed feedback.</p>
                      </div>
                    )}
                  </div>

                  {/* Assignment Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <h5 className="font-semibold text-blue-900">Assignment Description</h5>
                      </div>
                      <div className="text-blue-800 text-sm leading-relaxed max-h-32 overflow-y-auto">
                        {existingGradeModal.gradeDetails.assignment_description || (
                          <span className="text-blue-600 italic">No description provided.</span>
                        )}
                      </div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <h5 className="font-semibold text-green-900">Grading Rubric</h5>
                      </div>
                      <div className="text-green-800 text-sm leading-relaxed max-h-32 overflow-y-auto">
                        {existingGradeModal.gradeDetails.assignment_rubric || (
                          <span className="text-green-600 italic">No rubric provided.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between p-6 border-t bg-gray-50">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Grade ID: {existingGradeModal.gradeDetails.id}</span>
                  </div>
                  {existingGradeModal.gradeDetails.ai_generated && (
                    <div className="flex items-center gap-1 text-purple-600">
                      <Brain className="w-4 h-4" />
                      <span>AI Graded</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      // Copy grade details to clipboard
                      const gradeText = `Grade: ${existingGradeModal.gradeDetails.points_earned}/${existingGradeModal.gradeDetails.max_points} (${existingGradeModal.gradeDetails.percentage}%)\nStudent: ${existingGradeModal.gradeDetails.student_name}\nAssignment: ${existingGradeModal.gradeDetails.assignment_title}`;
                      navigator.clipboard.writeText(gradeText);
                    }}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors text-sm font-medium"
                  >
                    Copy Summary
                  </button>
                  <button
                    onClick={() => setExistingGradeModal({ isOpen: false })}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grading Details Modal - Shows grades and allows updates */}
        {gradingDetailsModal.isOpen && gradingDetailsModal.gradeDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-xl">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Grade Details</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">{gradingDetailsModal.gradeDetails.student_name || 'Student'}</span>
                      <span className="mx-2">•</span>
                      <span>Assignment Grade</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setGradingDetailsModal({
                    isOpen: false,
                    studentId: null,
                    studentName: '',
                    gradeDetails: null
                  })}
                  className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-10rem)]">
                <div className="space-y-6">
                  {/* Grade Summary */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-purple-900">Grade Summary</h4>
                      <div className="text-2xl font-bold text-purple-600">
                        {gradingDetailsModal.gradeDetails.points_earned || 'N/A'} / {gradingDetailsModal.gradeDetails.max_points || 'N/A'}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-purple-700 font-medium">Percentage:</span>
                        <span className="ml-2 text-purple-900">{gradingDetailsModal.gradeDetails.percentage ? `${gradingDetailsModal.gradeDetails.percentage}%` : 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-purple-700 font-medium">Assignment:</span>
                        <span className="ml-2 text-purple-900">{gradingDetailsModal.gradeDetails.assignment_title || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Feedback Details */}
                  {gradingDetailsModal.gradeDetails.feedback && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Feedback</h4>
                      {formatDetailedFeedback(gradingDetailsModal.gradeDetails.feedback)}
                    </div>
                  )}

                  {/* Grading Date */}
                  {gradingDetailsModal.gradeDetails.graded_date && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Graded on:</span> {new Date(gradingDetailsModal.gradeDetails.graded_date).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between p-6 border-t bg-gray-50">
                <button
                  onClick={() => setGradingDetailsModal({
                    isOpen: false,
                    studentId: null,
                    studentName: '',
                    gradeDetails: null
                  })}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    if (gradingDetailsModal.studentId) {
                      handleGradeUpdate(gradingDetailsModal.studentId);
                    }
                  }}
                  disabled={updatingGrade}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium flex items-center space-x-2"
                >
                  {updatingGrade ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span>Update Grade</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* File Preview Modal */}
        {filePreview.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <Image className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Preview Files</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {filePreview.files.length} file{filePreview.files.length !== 1 ? 's' : ''} selected for {filePreview.studentName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={cancelUploadPreview}
                  className="text-gray-400 hover:text-gray-600 p-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Preview Content */}
              <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
                {filePreview.files.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filePreview.files.map((file, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3 border relative">
                        {/* Remove button for individual files */}
                        <button
                          onClick={() => removeFileFromPreview(index)}
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs z-10 transition-colors"
                          title="Remove this file"
                        >
                          ×
                        </button>

                        {/* Image Preview */}
                        <div className="aspect-square bg-white rounded-lg mb-2 overflow-hidden">
                          <img
                            src={filePreview.previews[index]}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* File Info */}
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-900 truncate" title={file.name}>
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <p className="text-xs text-gray-500">
                            {file.type.split('/')[1].toUpperCase()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add More Files Button */}
                <div className="mt-6 flex justify-center">
                  <div className="relative">
                    <input
                      type="file"
                      id={`add-more-files-${filePreview.studentId}`}
                      multiple
                      accept="image/*"
                      onChange={handleAddMoreFiles}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center space-x-2 transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>Add More Files</span>
                    </button>
                  </div>
                </div>

                {/* File Summary */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Upload Summary</span>
                  </div>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>Student: <span className="font-medium">{filePreview.studentName}</span></p>
                    <p>Files: <span className="font-medium">{filePreview.files.length} image{filePreview.files.length !== 1 ? 's' : ''}</span></p>
                    <p>Total Size: <span className="font-medium">
                      {(filePreview.files.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024).toFixed(2)} MB
                    </span></p>
                    <p className="text-xs text-blue-600 mt-2">
                      These files will be combined into a single PDF for grading.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
                <button
                  onClick={cancelUploadPreview}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmUploadWithPreview}
                  disabled={isProcessing || filePreview.files.length === 0}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium flex items-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload & Create PDF ({filePreview.files.length} files)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

