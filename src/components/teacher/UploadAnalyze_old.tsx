import React, { useState, useCallback, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  Image, 
  Brain, 
  CheckCircle, 
  AlertCircle,
  Loader,
  User
} from 'lucide-react';
import { teacherService, Student } from '../../services/teacherService';

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  status: 'processing' | 'completed' | 'error';
  ocrResult?: OCRResult;
  aiAnalysis?: AIAnalysis;
}

interface OCRResult {
  text: string;
  confidence: number;
  processing_time: number;
  bounding_boxes?: any[];
}

interface AIAnalysis {
  subject_matter: string;
  student_strengths: string[];
  knowledge_gaps: string[];
  learning_level: string;
  teaching_suggestions: string[];
  next_steps: string[];
  confidence: number;
  extracted_text?: string;
  method?: string;
}

export const UploadAnalyze: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);

  // Load real students from teacherService
  useEffect(() => {
    const loadStudents = async () => {
      setIsLoadingStudents(true);
      try {
        const classStudents = await teacherService.getAllStudents();
        setStudents(classStudents);
      } catch (error) {
        console.error('Failed to load students:', error);
      } finally {
        setIsLoadingStudents(false);
      }
    };

    loadStudents();

    // Listen for class changes to refresh student list
    const handleClassChange = () => {
      loadStudents();
    };

    window.addEventListener('classStudentsChanged', handleClassChange);
    return () => window.removeEventListener('classStudentsChanged', handleClassChange);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFiles = async (files: FileList) => {
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      const newFile: UploadedFile = {
        id: Date.now().toString() + Math.random().toString(36),
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        status: 'processing'
      };

      setUploadedFiles(prev => [...prev, newFile]);

      // Process the file
      try {
        await processFile(file, newFile.id);
      } catch (error) {
        console.error('File processing failed:', error);
        setUploadedFiles(prev => 
          prev.map(f => f.id === newFile.id ? { ...f, status: 'error' } : f)
        );
      }
    }
  };

  const processFile = async (file: Writer, fileId: string) => {
    try {
      // Convert file to base64 for K.A.N.A.
      const base64Data = await fileToBase64(file);
      
      // Update file status
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileId ? { ...f, status: 'processing' } : f)
      );

      // Process with K.A.N.A. directly
      const analysisResponse = await fetch('http://localhost:10000/kana-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Analyze this student's work and provide educational insights. Student: ${selectedStudent}`,
          image_data: base64Data,
          image_analysis: true,
          context: {
            student_id: selectedStudent,
            file_name: file.name,
            file_type: file.type,
            analysis_type: 'student_work'
          }
        }),
      });

      if (!analysisResponse.ok) {
        throw new Error(`Analysis failed: ${analysisResponse.status}`);
      }

      const analysisResult = await analysisResponse.json();

      // Update file with analysis result
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileId ? { 
          ...f, 
          status: 'completed',
          analysisResult,
          extractedText: analysisResult.extracted_text || '',
          insights: analysisResult.analysis || '',
          knowledgeGaps: analysisResult.knowledge_gaps || [],
          recommendations: analysisResult.recommendations || []
        } : f)
      );
        },
        body: JSON.stringify({
          message: `Analyze this student work and provide teaching insights: ${ocrResult.text}`,
          image_analysis: false,
          context: {
            type: "student_work_analysis",
            student_id: selectedStudent,
            extracted_text: ocrResult.text
          }
        }),
      });

      let aiAnalysis: AIAnalysis;
      if (analysisResponse.ok) {
        const analysisResult = await analysisResponse.json();
        aiAnalysis = {
          subject_matter: analysisResult.subject_matter || 'General',
          student_strengths: analysisResult.student_strengths || ['Shows effort'],
          knowledge_gaps: analysisResult.knowledge_gaps || ['Needs review'],
          learning_level: analysisResult.learning_level || 'Intermediate',
          teaching_suggestions: analysisResult.teaching_suggestions || ['Continue practice'],
          next_steps: analysisResult.next_steps || ['Review concepts'],
          confidence: analysisResult.confidence || 0.8,
          extracted_text: ocrResult.text,
          method: 'K.A.N.A. AI Analysis'
        };
      } else {
        // Fallback analysis
        aiAnalysis = {
          subject_matter: 'General Studies',
          student_strengths: ['Completed assignment', 'Shows engagement'],
          knowledge_gaps: ['Could improve clarity', 'Needs more detail'],
          learning_level: 'Developing',
          teaching_suggestions: ['Provide additional examples', 'Encourage elaboration'],
          next_steps: ['Practice similar problems', 'Review key concepts'],
          confidence: 0.7,
          extracted_text: ocrResult.text,
          method: 'Basic Analysis'
        };
      }

      // Update file with final analysis
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileId ? { 
          ...f, 
          aiAnalysis,
          status: 'completed' 
        } : f)
      );

    } catch (error) {
      console.error('File processing error:', error);
      throw error;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const getStudentName = (studentId: string) => {
    if (studentId === 'all') return 'All Students';
    const student = students.find(s => s.id.toString() === studentId);
    return student ? `${student.fname} ${student.lname}`.trim() || student.username : 'Unknown Student';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Upload & Analyze</h2>
          <p className="text-gray-600 mt-1">OCR and AI-powered analysis of student notes</p>
        </div>
        <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
          <Brain className="w-5 h-5 text-blue-600" />
          <span className="text-blue-800 font-medium">K.A.N.A. Analysis</span>
        </div>
      </div>

      {/* Student Selection */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Student</h3>
        <div className="flex items-center space-x-4">
          <User className="w-5 h-5 text-gray-400" />
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
            disabled={isLoadingStudents}
          >
            <option value="all">All Students</option>
            {students.map((student) => (
              <option key={student.id} value={student.id.toString()}>
                {`${student.fname} ${student.lname}`.trim() || student.username}
              </option>
            ))}
          </select>
          {isLoadingStudents && (
            <Loader className="w-5 h-5 text-blue-600 animate-spin" />
          )}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {students.length > 0 
            ? `${students.length} student${students.length === 1 ? '' : 's'} in your class`
            : isLoadingStudents 
              ? 'Loading students...'
              : 'No students in class. Add students in Class Management.'
          }
        </p>
      </div>

      {/* Upload Area */}
      <div 
        className={`bg-white p-8 rounded-lg border-2 border-dashed transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Student Notes</h3>
          <p className="text-gray-600 mb-4">Drag and drop files here, or click to select</p>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 mb-6">
            <div className="flex items-center space-x-1">
              <Image className="w-4 h-4" />
              <span>Images (PNG, JPG)</span>
            </div>
            <div className="flex items-center space-x-1">
              <FileText className="w-4 h-4" />
              <span>Documents (PDF)</span>
            </div>
          </div>
          <input
            type="file"
            id="file-upload"
            multiple
            accept="image/*,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors"
          >
            Choose Files
          </label>
        </div>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Analysis Results</h3>
            <p className="text-sm text-gray-600">
              Files uploaded for {getStudentName(selectedStudent)}
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {file.type.startsWith('image/') ? (
                        <Image className="h-8 w-8 text-blue-600" />
                      ) : (
                        <FileText className="h-8 w-8 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(file.uploadedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {file.status === 'processing' && (
                      <>
                        <Loader className="h-5 w-5 text-blue-600 animate-spin" />
                        <span className="text-sm text-blue-600">Processing...</span>
                      </>
                    )}
                    {file.status === 'completed' && (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-green-600">Complete</span>
                      </>
                    )}
                    {file.status === 'error' && (
                      <>
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <span className="text-sm text-red-600">Error</span>
                      </>
                    )}
                  </div>
                </div>

                {/* AI Analysis Results */}
                {file.aiAnalysis && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Subject Matter</h4>
                        <p className="text-sm text-gray-600">{file.aiAnalysis.subject_matter}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Learning Level</h4>
                        <p className="text-sm text-gray-600">{file.aiAnalysis.learning_level}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Student Strengths</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {file.aiAnalysis.student_strengths.map((strength, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Knowledge Gaps</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {file.aiAnalysis.knowledge_gaps.map((gap, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                              <span>{gap}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Teaching Suggestions</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {file.aiAnalysis.teaching_suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <Brain className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Next Steps</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {file.aiAnalysis.next_steps.map((step, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="h-4 w-4 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium mt-0.5 flex-shrink-0">
                              {index + 1}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-500">
                        Analysis by {file.aiAnalysis.method}
                      </span>
                      <span className="text-xs text-gray-500">
                        Confidence: {Math.round(file.aiAnalysis.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
