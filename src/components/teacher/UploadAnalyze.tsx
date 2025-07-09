import React, { useState, useEffect } from 'react';
import { Upload, FileText, User, Send, Brain, CheckCircle, AlertCircle, Loader2, Users, Eye, X } from 'lucide-react';
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
    score: number;
    maxScore: number;
    feedback: string;
  }[];
  overallFeedback?: string;
  improvementAreas?: string[];
  strengths?: string[];
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

export const UploadAnalyze: React.FC = () => {
  // Original state
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [error, setError] = useState<string>('');
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
  const [gradingRubric, setGradingRubric] = useState<string>('');

  // Format analysis text for better readability
  const formatAnalysisText = (text: string): JSX.Element => {
    // Split text by common section markers
    const sections = text.split(/\*\*(.*?)\*\*/g);
    const elements: JSX.Element[] = [];

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];

      if (i % 2 === 1) {
        // This is a header (between **)
        elements.push(
          <div key={i} className="font-semibold text-blue-800 mt-4 mb-2 text-base">
            {section}
          </div>
        );
      } else if (section.trim()) {
        // This is content
        const lines = section.split('\n').filter(line => line.trim());
        lines.forEach((line, lineIndex) => {
          if (line.startsWith('•') || line.startsWith('*')) {
            // Bullet point
            elements.push(
              <div key={`${i}-${lineIndex}`} className="flex items-start space-x-2 mb-1">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-gray-700">{line.replace(/^[•*]\s*/, '')}</span>
              </div>
            );
          } else if (line.trim()) {
            // Regular paragraph
            elements.push(
              <p key={`${i}-${lineIndex}`} className="text-gray-700 mb-2 leading-relaxed">
                {line.trim()}
              </p>
            );
          }
        });
      }
    }

    return <div>{elements}</div>;
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

  const loadInitialData = async () => {
    await loadStudents();
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

      const response = await fetch('https://brainink-backend.onrender.com/study-area/classrooms/my-assigned', {
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

      const response = await fetch('https://brainink-backend.onrender.com/study-area/academic/teachers/my-subjects', {
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
    } catch (error) {
      console.error('❌ Failed to load filtered students:', error);
      setError('Failed to load students. Please try again.');
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
    } catch (error) {
      console.error('❌ Failed to load subject students:', error);
      setError('Failed to load students. Please try again.');
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

      const response = await fetch('https://brainink-backend.onrender.com/study-area/teachers/my-students', {
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
      setFiles(selectedFiles);
      setError('');
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
    if (!files || files.length === 0) {
      setError('Please select files to upload');
      return;
    }

    if (!selectedStudent) {
      setError('Please select a student');
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

    setIsProcessing(true);
    setError('');
    const results: AnalysisResult[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`Processing file: ${file.name}`);

        try {
          const result = await processFile(file);
          results.push({
            ...result,
            targetStudent: selectedStudent
          });
        } catch (fileError) {
          console.error(`File processing failed for ${file.name}:`, fileError);
          setError(`Failed to process ${file.name}: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
        }
      }

      setAnalysisResults(results);

      // Handle grading based on mode and assignment selection
      if (assignmentType === 'grading' && results.length > 0 && selectedAssignment) {
        const assignment = assignments.find(a => a.id.toString() === selectedAssignment);
        if (assignment) {
          for (const result of results) {
            if (result.targetStudent) {
              // Use filteredStudents if available, otherwise fall back to all students
              const studentsList = filteredStudents.length > 0 ? filteredStudents : students;
              const student = studentsList.find(s => s.username === result.targetStudent);

              if (student) {
                if (gradingMode === 'auto' && result.grade !== undefined) {
                  // Auto mode: Use AI-generated grade directly
                  try {
                    await gradesAssignmentsService.createGrade({
                      assignment_id: assignment.id,
                      student_id: student.id,
                      points_earned: result.grade,
                      feedback: result.overallFeedback || result.analysis
                    });
                    console.log('✅ Auto grade submitted for student:', student.username);
                  } catch (error) {
                    console.error('❌ Failed to submit auto grade:', error);
                    setError(`Failed to submit grade for ${student.username}`);
                  }
                } else if (gradingMode === 'manual') {
                  // Manual mode: Store grades for teacher to manually submit
                  const studentKey = student.id.toString();
                  setManualGrades(prev => ({
                    ...prev,
                    [studentKey]: {
                      grade: result.grade || 0,
                      feedback: result.overallFeedback || result.analysis
                    }
                  }));
                  console.log('📝 Manual grade prepared for student:', student.username);
                }
              }
            }
          }

          // For auto mode, trigger refresh of grading data
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

      if (results.length > 0) {
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

          console.log('Sending PDF request to K.A.N.A.:', {
            ...requestBody,
            pdf_data: `[${pdfData.length} characters of base64 PDF data]`
          });

          // Add timeout to prevent hanging
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout for PDFs

          const BACKEND_BASE_URL = import.meta.env.VITE_KANA_API_BASE_URL?.replace('/api/kana', '') || 'http://localhost:10000';
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
            console.error('K.A.N.A. PDF response error:', response.status, errorText);
            throw new Error(`K.A.N.A. PDF analysis failed: ${response.status} - ${errorText}`);
          }

          const data = await response.json();

          // Parse grading data if available
          const result: AnalysisResult = {
            extractedText: data.extracted_text || 'No text extracted from PDF',
            analysis: data.analysis || 'Analysis not available',
            knowledgeGaps: data.knowledge_gaps || [],
            recommendations: data.recommendations || [],
            confidence: data.confidence || 0
          };

          // Add grading information if available
          if (assignmentType === 'grading') {
            result.grade = data.grade || data.score;
            result.maxPoints = maxPoints;
            result.gradingCriteria = data.grading_criteria || data.rubric_scores;
            result.overallFeedback = data.overall_feedback || data.feedback;
            result.improvementAreas = data.improvement_areas || data.areas_for_improvement;
            result.strengths = data.strengths || data.student_strengths;
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

        console.log('Sending request to K.A.N.A.:', {
          ...requestBody,
          image_data: `[${imageData.length} characters of base64 data]`
        });

        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

        const BACKEND_BASE_URL = import.meta.env.VITE_KANA_API_BASE_URL?.replace('/api/kana', '') || 'http://localhost:10000';
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
          console.error('K.A.N.A. response error:', response.status, errorText);
          throw new Error(`K.A.N.A. analysis failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        // Parse grading data if available
        const result: AnalysisResult = {
          extractedText: data.extracted_text || 'No text extracted',
          analysis: data.analysis || 'Analysis not available',
          knowledgeGaps: data.knowledge_gaps || [],
          recommendations: data.recommendations || [],
          confidence: data.confidence || 0
        };

        // Add grading information if available
        if (assignmentType === 'grading') {
          result.grade = data.grade || data.score;
          result.maxPoints = maxPoints;
          result.gradingCriteria = data.grading_criteria || data.rubric_scores;
          result.overallFeedback = data.overall_feedback || data.feedback;
          result.improvementAreas = data.improvement_areas || data.areas_for_improvement;
          result.strengths = data.strengths || data.student_strengths;
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
      console.log('📝 Submitting manual grades...');

      const assignment = assignments.find(a => a.id.toString() === selectedAssignment);
      if (!assignment) {
        throw new Error('Assignment not found');
      }

      let successCount = 0;
      let failCount = 0;

      for (const [studentId, gradeData] of Object.entries(manualGrades)) {
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
    } catch (error) {
      console.error('❌ Failed to submit manual grades:', error);
      setError('Failed to submit manual grades. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loadingStudents) {
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Upload & Analyze</h2>
          <p className="text-gray-600 mt-1">AI-powered analysis and grading of student work with K.A.N.A.</p>
        </div>
        <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
          <Brain className="w-5 h-5 text-blue-600" />
          <span className="text-blue-800 font-medium">K.A.N.A. {assignmentType === 'grading' ? 'Grading' : 'Analysis'}</span>
        </div>
      </div>

      {/* Classroom and Subject Selection */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Users className="w-6 h-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-blue-900">Select Classroom & Subject</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Classroom Selection */}
          <div>
            <label htmlFor="classroom-select" className="block text-sm font-medium text-gray-700 mb-2">
              Classroom
            </label>
            {loadingClassrooms ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600 mr-2" />
                <span className="text-gray-600">Loading classrooms...</span>
              </div>
            ) : (
              <select
                id="classroom-select"
                value={selectedClassroom}
                onChange={(e) => setSelectedClassroom(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Select a classroom...</option>
                {classrooms.map((classroom) => (
                  <option key={classroom.id} value={classroom.id.toString()}>
                    {classroom.name} ({classroom.students?.length || 0} students)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Subject Selection */}
          <div>
            <label htmlFor="subject-select" className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            {loadingSubjects ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600 mr-2" />
                <span className="text-gray-600">Loading subjects...</span>
              </div>
            ) : (
              <select
                id="subject-select"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                disabled={!selectedClassroom && classrooms.length > 0}
              >
                <option value="">Select a subject...</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id.toString()}>
                    {subject.name} ({subject.student_count || 0} students)
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Selection Status */}
        {selectedClassroom && selectedSubject && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-800">
                {filteredStudents.length} students available for analysis in this classroom and subject
              </span>
            </div>
          </div>
        )}

        {/* No Classrooms/Subjects Warning */}
        {classrooms.length === 0 && !loadingClassrooms && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="text-yellow-800">
                No classrooms found. You need to be assigned to a classroom or have subjects with students.
              </span>
            </div>
          </div>
        )}

        {subjects.length === 0 && !loadingSubjects && selectedClassroom && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="text-yellow-800">
                No subjects found. You need to be assigned to subjects that have students.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Assignment Selection and Grading Mode - Show when subject is selected */}
      {selectedSubject && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <FileText className="w-6 h-6 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-green-900">Assignment & Grading Mode</h3>
          </div>

          {/* Show info if not in grading mode */}
          {assignmentType !== 'grading' && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-blue-800">
                  Select "Grade Assignment" in the Task Type below to enable assignment selection and grading features.
                </span>
              </div>
            </div>
          )}

          {assignmentType === 'grading' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Assignment Selection */}
              <div>
                <label htmlFor="assignment-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Assignment
                </label>
                {loadingAssignments ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-green-600 mr-2" />
                    <span className="text-gray-600">Loading assignments...</span>
                  </div>
                ) : (
                  <select
                    id="assignment-select"
                    value={selectedAssignment}
                    onChange={(e) => setSelectedAssignment(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
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
                  <p className="text-sm text-gray-500 mt-2">
                    No assignments found for this subject.
                  </p>
                )}
              </div>

              {/* Grading Mode Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grading Mode
                </label>
                <div className="space-y-3">
                  <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      value="auto"
                      checked={gradingMode === 'auto'}
                      onChange={(e) => setGradingMode(e.target.value as 'auto' | 'manual')}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Auto Grade</div>
                      <div className="text-sm text-gray-600">
                        AI grades are automatically submitted to the assignment
                      </div>
                    </div>
                  </label>
                  <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      value="manual"
                      checked={gradingMode === 'manual'}
                      onChange={(e) => setGradingMode(e.target.value as 'auto' | 'manual')}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Manual Review</div>
                      <div className="text-sm text-gray-600">
                        Review and manually submit grades after AI analysis
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Selected Assignment Info */}
          {assignmentType === 'grading' && selectedAssignment && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-800">
                  Ready to grade: {assignments.find(a => a.id.toString() === selectedAssignment)?.title}
                  ({gradingMode === 'auto' ? 'Auto-submit grades' : 'Manual review mode'})
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* No Students Warning */}
      {!selectedClassroom && !selectedSubject && students.length === 0 && !loadingStudents && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <User className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Students in Class</h3>
          <p className="text-yellow-700 mb-4">
            You need to add students to your class before you can analyze their work.
          </p>
          <button
            onClick={() => window.location.hash = '#manage-class'}
            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-4 py-2 rounded-lg font-medium"
          >
            Add Students to Class
          </button>
        </div>
      )}

      {/* Main Content - Show when we have classrooms/subjects or legacy students */}
      {(classrooms.length > 0 || students.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Upload Student Work</h3>
            </div>
            <div className="p-6 space-y-4">
              {/* Assignment Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Type
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="analysis"
                      checked={assignmentType === 'analysis'}
                      onChange={(e) => setAssignmentType(e.target.value as 'analysis' | 'grading')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Analysis Only</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="grading"
                      checked={assignmentType === 'grading'}
                      onChange={(e) => setAssignmentType(e.target.value as 'analysis' | 'grading')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Grade Assignment</span>
                  </label>
                </div>
              </div>

              {/* Grading Options (shown when grading is selected) */}
              {assignmentType === 'grading' && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900">Grading Settings</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Assignment Title
                      </label>
                      <input
                        type="text"
                        value={assignmentTitle}
                        onChange={(e) => setAssignmentTitle(e.target.value)}
                        placeholder="e.g., Math Quiz #3, Essay Assignment"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Points
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
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grading Rubric (Optional)
                    </label>
                    <textarea
                      value={gradingRubric}
                      onChange={(e) => setGradingRubric(e.target.value)}
                      placeholder="Describe grading criteria, what to look for, point distribution, etc."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Student Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Student
                </label>
                {selectedClassroom && selectedSubject ? (
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                    disabled={filteredStudents.length === 0}
                  >
                    <option value="">Choose a student...</option>
                    {filteredStudents.map((student) => (
                      <option key={student.id} value={student.username}>
                        {student.fname} {student.lname} (@{student.username})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                    Please select both classroom and subject first
                  </div>
                )}

                {selectedClassroom && selectedSubject && filteredStudents.length === 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    No students found in both the selected classroom and subject.
                  </p>
                )}

                {filteredStudents.length > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} available
                  </p>
                )}
              </div>

              {/* File Upload Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Files (Images & PDFs)
                </label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    Drag and drop images or PDFs here, or click to select
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports PNG, JPG, JPEG images and PDF documents
                  </p>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    accept="image/*,application/pdf,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Selected Files */}
              {files && files.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Selected Files:</h4>
                  {Array.from(files).map((file, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Process Button */}
              <button
                onClick={processFiles}
                disabled={
                  isProcessing ||
                  !files ||
                  !selectedStudent ||
                  (classrooms.length > 0 && (!selectedClassroom || !selectedSubject)) ||
                  filteredStudents.length === 0
                }
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{assignmentType === 'grading' ? 'Grading...' : 'Analyzing...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>{assignmentType === 'grading' ? 'Grade with K.A.N.A.' : 'Analyze with K.A.N.A.'}</span>
                  </>
                )}
              </button>

              {/* Process Button Help Text */}
              {classrooms.length > 0 && (!selectedClassroom || !selectedSubject) && (
                <p className="text-sm text-gray-600 text-center">
                  Please select both classroom and subject to proceed
                </p>
              )}

              {selectedClassroom && selectedSubject && filteredStudents.length === 0 && (
                <p className="text-sm text-red-600 text-center">
                  No students available in the selected classroom and subject
                </p>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Analysis Results</h3>
              {analysisResults.length > 0 && (
                <button
                  onClick={clearResults}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear Results
                </button>
              )}
            </div>
            <div className="p-6">
              {analysisResults.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Upload student work to see K.A.N.A.'s analysis
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {analysisResults.map((result, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                      {/* Header */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Brain className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 text-lg">
                                Analysis for {result.targetStudent}
                              </h4>
                              <p className="text-sm text-gray-600">K.A.N.A. AI Analysis</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => setFullAnalysisModal({ isOpen: true, analysis: result })}
                              className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Full Analysis
                            </button>
                            <div className="flex items-center space-x-2 bg-white px-3 py-1 rounded-full border">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-sm font-medium text-gray-700">
                                {result.confidence}% confidence
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6 space-y-6">

                        {/* Grade Display (if grading was performed) */}
                        {result.grade !== undefined && result.maxPoints && (
                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                              <h5 className="text-lg font-semibold text-gray-900">Grade</h5>
                              <div className="flex items-center space-x-2">
                                <div className={`text-3xl font-bold ${(result.grade / result.maxPoints) >= 0.9 ? 'text-green-600' :
                                  (result.grade / result.maxPoints) >= 0.8 ? 'text-blue-600' :
                                    (result.grade / result.maxPoints) >= 0.7 ? 'text-yellow-600' :
                                      'text-red-600'
                                  }`}>
                                  {result.grade}/{result.maxPoints}
                                </div>
                                <div className="text-lg text-gray-600">
                                  ({Math.round((result.grade / result.maxPoints) * 100)}%)
                                </div>
                              </div>
                            </div>

                            {/* Grade Breakdown */}
                            {result.gradingCriteria && result.gradingCriteria.length > 0 && (
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <h6 className="font-medium text-gray-900 mb-3">Grade Breakdown</h6>
                                <div className="space-y-2">
                                  {result.gradingCriteria.map((criteria, index) => (
                                    <div key={index} className="space-y-1">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-700">{criteria.category}</span>
                                        <div className="flex items-center space-x-2">
                                          <span className="font-medium">{criteria.score}/{criteria.maxScore}</span>
                                          <div className="w-20 bg-gray-200 rounded-full h-2">
                                            <div
                                              className="bg-blue-600 h-2 rounded-full"
                                              style={{ width: `${(criteria.score / criteria.maxScore) * 100}%` }}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                      {criteria.feedback && (
                                        <p className="text-xs text-gray-600 pl-2">{criteria.feedback}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Overall Feedback */}
                            {result.overallFeedback && (
                              <div className="bg-blue-50 p-4 rounded-lg">
                                <h6 className="font-medium text-blue-900 mb-2">Overall Feedback</h6>
                                <p className="text-blue-800 text-sm">{result.overallFeedback}</p>
                              </div>
                            )}

                            {/* Strengths and Improvement Areas */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {result.strengths && result.strengths.length > 0 && (
                                <div className="bg-green-50 p-4 rounded-lg">
                                  <h6 className="font-medium text-green-900 mb-2 flex items-center">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Strengths
                                  </h6>
                                  <ul className="space-y-1">
                                    {result.strengths.map((strength, idx) => (
                                      <li key={idx} className="text-green-800 text-sm">• {strength}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {result.improvementAreas && result.improvementAreas.length > 0 && (
                                <div className="bg-yellow-50 p-4 rounded-lg">
                                  <h6 className="font-medium text-yellow-900 mb-2 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-2" />
                                    Areas for Improvement
                                  </h6>
                                  <ul className="space-y-1">
                                    {result.improvementAreas.map((area, idx) => (
                                      <li key={idx} className="text-yellow-800 text-sm">• {area}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>

                          </div>
                        )}

                        {/* Analysis */}
                        <div>
                          <h5 className="text-lg font-semibold text-gray-900 mb-3">AI Analysis</h5>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            {formatAnalysisText(result.analysis)}
                          </div>
                        </div>

                        {/* Knowledge Gaps */}
                        {result.knowledgeGaps.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-3">Knowledge Gaps Identified:</h5>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <ul className="space-y-2">
                                {result.knowledgeGaps.map((gap, gapIndex) => (
                                  <li key={gapIndex} className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <span className="text-red-700 text-sm leading-relaxed">{gap}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}

                        {/* Recommendations */}
                        {result.recommendations.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-3">Recommendations:</h5>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <ul className="space-y-2">
                                {result.recommendations.map((rec, recIndex) => (
                                  <li key={recIndex} className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <span className="text-green-700 text-sm leading-relaxed">{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Manual Grading Section */}
                  {assignmentType === 'grading' && gradingMode === 'manual' && Object.keys(manualGrades).length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-yellow-900">Manual Grade Review</h4>
                        <button
                          onClick={submitManualGrades}
                          disabled={isProcessing}
                          className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Submitting...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>Submit Grades</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="space-y-4">
                        {Object.entries(manualGrades).map(([studentId, gradeData]) => {
                          const student = filteredStudents.find(s => s.id.toString() === studentId);
                          const assignment = assignments.find(a => a.id.toString() === selectedAssignment);

                          return (
                            <div key={studentId} className="bg-white p-4 rounded-lg border border-yellow-300">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h5 className="font-medium text-gray-900">
                                    {student ? `${student.fname} ${student.lname}` : `Student ID: ${studentId}`}
                                  </h5>
                                  <p className="text-sm text-gray-600">
                                    Assignment: {assignment?.title || 'Unknown Assignment'}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-yellow-700">
                                    {gradeData.grade}/{assignment?.max_points || maxPoints}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {Math.round((gradeData.grade / (assignment?.max_points || maxPoints)) * 100)}%
                                  </div>
                                </div>
                              </div>

                              {gradeData.feedback && (
                                <div className="bg-gray-50 p-3 rounded border">
                                  <h6 className="font-medium text-gray-700 mb-1">Feedback:</h6>
                                  <p className="text-sm text-gray-600">{gradeData.feedback}</p>
                                </div>
                              )}

                              {/* Allow manual editing of grade */}
                              <div className="mt-3 grid grid-cols-2 gap-3">
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
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full Analysis Modal */}
      {fullAnalysisModal.isOpen && fullAnalysisModal.analysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Full K.A.N.A. Analysis</h2>
                <p className="text-sm text-gray-600">Detailed analysis for {fullAnalysisModal.analysis.targetStudent}</p>
              </div>
              <button
                onClick={() => setFullAnalysisModal({ isOpen: false, analysis: null })}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
              <div className="space-y-6">
                {/* Confidence Score */}
                <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
                  <span className="font-medium text-blue-900">Analysis Confidence</span>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <span className="font-bold text-blue-600">{fullAnalysisModal.analysis.confidence}%</span>
                  </div>
                </div>

                {/* Grade Display (if available) */}
                {fullAnalysisModal.analysis.grade !== undefined && fullAnalysisModal.analysis.maxPoints && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-green-900 mb-4">Grade Assessment</h3>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-3xl font-bold text-green-800">
                        {fullAnalysisModal.analysis.grade}/{fullAnalysisModal.analysis.maxPoints}
                      </span>
                      <span className="text-2xl font-bold text-green-600">
                        ({Math.round((fullAnalysisModal.analysis.grade / fullAnalysisModal.analysis.maxPoints) * 100)}%)
                      </span>
                    </div>

                    {fullAnalysisModal.analysis.gradingCriteria && fullAnalysisModal.analysis.gradingCriteria.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-green-900">Grade Breakdown:</h4>
                        {fullAnalysisModal.analysis.gradingCriteria.map((criteria, index) => (
                          <div key={index} className="bg-white p-3 rounded border">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium text-gray-700">{criteria.category}</span>
                              <span className="font-bold text-green-600">{criteria.score}/{criteria.maxScore}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full transition-all"
                                style={{ width: `${(criteria.score / criteria.maxScore) * 100}%` }}
                              />
                            </div>
                            {criteria.feedback && (
                              <p className="text-sm text-gray-600 mt-2">{criteria.feedback}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Extracted Text */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Extracted Text</h3>
                  <div className="bg-white p-4 rounded border max-h-60 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                      {fullAnalysisModal.analysis.extractedText}
                    </pre>
                  </div>
                </div>

                {/* AI Analysis */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Complete AI Analysis</h3>
                  <div className="bg-white p-4 rounded border">
                    {formatAnalysisText(fullAnalysisModal.analysis.analysis)}
                  </div>
                </div>

                {/* Strengths and Improvement Areas Grid */}
                {(fullAnalysisModal.analysis.strengths?.length || fullAnalysisModal.analysis.improvementAreas?.length) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {fullAnalysisModal.analysis.strengths && fullAnalysisModal.analysis.strengths.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Student Strengths
                        </h3>
                        <ul className="space-y-2">
                          {fullAnalysisModal.analysis.strengths.map((strength, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-green-800">{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {fullAnalysisModal.analysis.improvementAreas && fullAnalysisModal.analysis.improvementAreas.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center">
                          <AlertCircle className="w-5 h-5 mr-2" />
                          Areas for Improvement
                        </h3>
                        <ul className="space-y-2">
                          {fullAnalysisModal.analysis.improvementAreas.map((area, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-yellow-800">{area}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Knowledge Gaps */}
                {fullAnalysisModal.analysis.knowledgeGaps.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      Knowledge Gaps Identified
                    </h3>
                    <ul className="space-y-2">
                      {fullAnalysisModal.analysis.knowledgeGaps.map((gap, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-red-800">{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {fullAnalysisModal.analysis.recommendations.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                      <Brain className="w-5 h-5 mr-2" />
                      Teaching Recommendations
                    </h3>
                    <ul className="space-y-2">
                      {fullAnalysisModal.analysis.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-purple-800">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Overall Feedback */}
                {fullAnalysisModal.analysis.overallFeedback && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-indigo-900 mb-4">Overall Feedback</h3>
                    <div className="bg-white p-4 rounded border">
                      <p className="text-indigo-800 whitespace-pre-wrap">{fullAnalysisModal.analysis.overallFeedback}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t p-6">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setFullAnalysisModal({ isOpen: false, analysis: null })}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
