import React, { useState, useEffect } from 'react';
import { Upload, FileText, User, Send, Brain, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { teacherService, Student } from '../../services/teacherService';

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

export const UploadAnalyze: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [error, setError] = useState<string>('');
  const [loadingStudents, setLoadingStudents] = useState(true);
  
  // New grading options
  const [assignmentType, setAssignmentType] = useState<'analysis' | 'grading'>('analysis');
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
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      const allStudents = await teacherService.getAllStudents();
      setStudents(allStudents);
      
      if (allStudents.length === 0) {
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
      
      // Save graded assignments to student records
      if (assignmentType === 'grading' && results.length > 0) {
        for (const result of results) {
          if (result.grade !== undefined && result.targetStudent) {
            const student = students.find(s => s.username === result.targetStudent);
            if (student) {
              await teacherService.saveGradedAssignment(student.id, {
                title: assignmentTitle || 'Assignment',
                grade: result.grade,
                maxPoints: result.maxPoints || maxPoints,
                feedback: result.overallFeedback || result.analysis,
                gradingCriteria: result.gradingCriteria,
                extractedText: result.extractedText,
                uploadDate: new Date().toISOString()
              });
            }
          }
        }
        
        // Trigger refresh of student data across the platform
        window.dispatchEvent(new CustomEvent('studentGradesUpdated', { 
          detail: { studentUsername: selectedStudent } 
        }));
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
            assignment_type: assignmentTitle || 'Assignment',
            max_points: maxPoints,
            grading_rubric: gradingRubric || 'Standard academic grading criteria',
            student_context: `Grading PDF assignment for student: ${selectedStudent}`,
            analysis_type: 'pdf_assignment_grading'
          } : {
            pdf_data: pdfData,
            pdf_analysis: true,
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

          const response = await fetch('http://localhost:10000/kana-direct', {
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
            assignment_type: assignmentTitle || 'Assignment',
            max_points: maxPoints,
            grading_rubric: gradingRubric || 'Standard academic grading criteria',
            student_context: `Grading assignment for student: ${selectedStudent}`,
            analysis_type: 'assignment_grading'
          } : {
            image_data: imageData,
            image_analysis: true,
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

          const response = await fetch('http://localhost:10000/kana-direct', {
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
      {students.length === 0 && !loadingStudents && (
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

      {/* Main Content */}
      {students.length > 0 && (
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
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                >
                  <option value="">Choose a student...</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.username}>
                      {student.fname} {student.lname} (@{student.username})
                    </option>
                  ))}
                </select>
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
                disabled={isProcessing || !files || !selectedStudent}
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
                          <div className="flex items-center space-x-2 bg-white px-3 py-1 rounded-full border">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium text-gray-700">
                              {result.confidence}% confidence
                            </span>
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
                              <div className={`text-3xl font-bold ${
                                (result.grade / result.maxPoints) >= 0.9 ? 'text-green-600' :
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
                                  <div key={index} className="flex justify-between items-center">
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
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Overall Feedback */}
                      {result.overallFeedback && (
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Overall Feedback:</h5>
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <p className="text-sm text-gray-800 leading-relaxed">
                              {result.overallFeedback}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Strengths */}
                      {result.strengths && result.strengths.length > 0 && (
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-3">Strengths:</h5>
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <ul className="space-y-2">
                              {result.strengths.map((strength, index) => (
                                <li key={index} className="flex items-start space-x-3">
                                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <span className="text-green-700 text-sm leading-relaxed">{strength}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Improvement Areas */}
                      {result.improvementAreas && result.improvementAreas.length > 0 && (
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-3">Areas for Improvement:</h5>
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <ul className="space-y-2">
                              {result.improvementAreas.map((area, index) => (
                                <li key={index} className="flex items-start space-x-3">
                                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <span className="text-yellow-700 text-sm leading-relaxed">{area}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Extracted Text */}
                      {result.extractedText && result.extractedText !== 'No text extracted' && (
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Extracted Text:</h5>
                          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg max-h-40 overflow-y-auto">
                            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
                              {result.extractedText}
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* Analysis */}
                      {result.analysis && (
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">K.A.N.A.'s Analysis:</h5>
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                              {formatAnalysisText(result.analysis)}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Knowledge Gaps */}
                      {result.knowledgeGaps.length > 0 && (
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-3">Knowledge Gaps:</h5>
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
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
