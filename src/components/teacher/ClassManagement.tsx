import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  UserMinus,
  Search,
  Loader2,
  CheckCircle,
  AlertCircle,
  Building2,
  GraduationCap
} from 'lucide-react';
import { Student } from '../../services/teacherService';
import { teacherClassroomService } from '../../services/teacherClassroomService';

export const ClassManagement: React.FC = () => {
  const [currentStudents, setCurrentStudents] = useState<Student[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);
  const [isLoadingClassrooms, setIsLoadingClassrooms] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedClassroom) {
      loadCurrentStudents();
    } else {
      setCurrentStudents([]);
    }
  }, [selectedClassroom]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      await loadClassrooms();
    } catch (error) {
      console.error('Failed to load initial data:', error);
      setMessage('Failed to load classroom data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadClassrooms = async () => {
    try {
      setIsLoadingClassrooms(true);
      console.log('🏫 Loading teacher classrooms...');

      const classroomsData = await teacherClassroomService.getMyClassrooms();
      console.log('✅ Loaded classrooms:', classroomsData);

      setClassrooms(classroomsData);

      // Auto-select first classroom if available
      if (classroomsData.length > 0 && !selectedClassroom) {
        setSelectedClassroom(classroomsData[0].id.toString());
      }
    } catch (error) {
      console.error('❌ Failed to load classrooms:', error);
      setMessage('Failed to load classrooms. Please try again.');
    } finally {
      setIsLoadingClassrooms(false);
    }
  };

  const loadCurrentStudents = async () => {
    if (!selectedClassroom) return;

    try {
      setIsLoading(true);
      console.log('👥 Loading students for classroom:', selectedClassroom);

      const students = await teacherClassroomService.getStudentsInClassroom(parseInt(selectedClassroom));
      console.log('✅ Loaded students:', students);

      setCurrentStudents(students);
      setMessage('');
    } catch (error) {
      console.error('❌ Failed to load current students:', error);
      setMessage('Failed to load students. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableStudents = async () => {
    try {
      setIsLoadingAvailable(true);
      console.log('👥 Loading available students...');

      let students: Student[] = [];

      if (searchQuery.trim()) {
        // Search for students by query
        students = await teacherClassroomService.searchStudents(searchQuery);
      } else {
        // Get all available students
        students = await teacherClassroomService.getAvailableStudents();
      }

      console.log('✅ Loaded available students:', students);
      setAvailableStudents(students);
      setMessage('');
    } catch (error) {
      console.error('❌ Failed to load available students:', error);
      setMessage('Failed to load available students. Please try again.');
    } finally {
      setIsLoadingAvailable(false);
    }
  };

  const addStudentToClass = async (student: Student) => {
    if (!selectedClassroom) {
      setMessage('Please select a classroom first.');
      return;
    }

    try {
      console.log('➕ Adding student to classroom:', student.id, selectedClassroom);

      const success = await teacherClassroomService.addStudentToClassroom(student.id, parseInt(selectedClassroom));

      if (success) {
        setMessage(`Successfully added ${student.fname} ${student.lname} to the classroom.`);

        // Refresh both lists
        await loadCurrentStudents();
        await loadAvailableStudents();

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('classStudentsChanged', {
          detail: {
            classroomId: selectedClassroom,
            action: 'added',
            student: student
          }
        }));
      } else {
        setMessage('Failed to add student to classroom. Please try again.');
      }
    } catch (error) {
      console.error('❌ Failed to add student:', error);
      setMessage('Failed to add student to classroom. Please try again.');
    }
  };

  const removeStudentFromClass = async (student: Student) => {
    if (!selectedClassroom) {
      setMessage('Please select a classroom first.');
      return;
    }

    if (!confirm(`Are you sure you want to remove ${student.fname} ${student.lname} from this classroom?`)) {
      return;
    }

    try {
      console.log('➖ Removing student from classroom:', student.id, selectedClassroom);

      const success = await teacherClassroomService.removeStudentFromClassroom(student.id, parseInt(selectedClassroom));

      if (success) {
        setMessage(`Successfully removed ${student.fname} ${student.lname} from the classroom.`);

        // Refresh both lists
        await loadCurrentStudents();
        await loadAvailableStudents();

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('classStudentsChanged', {
          detail: {
            classroomId: selectedClassroom,
            action: 'removed',
            student: student
          }
        }));
      } else {
        setMessage('Failed to remove student from classroom. Please try again.');
      }
    } catch (error) {
      console.error('❌ Failed to remove student:', error);
      setMessage('Failed to remove student from classroom. Please try again.');
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    // Debounce search - trigger search after user stops typing
    clearTimeout((window as any).searchTimeout);
    (window as any).searchTimeout = setTimeout(() => {
      if (event.target.value.trim() || availableStudents.length === 0) {
        loadAvailableStudents();
      }
    }, 500);
  };

  if (isLoading && !selectedClassroom) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
        <span className="text-gray-600">Loading classroom data...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Class Management</h2>
          <p className="text-gray-600 mt-1">Manage students in your classrooms</p>
        </div>
        <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
          <Building2 className="w-5 h-5 text-blue-600" />
          <span className="text-blue-800 font-medium">
            {classrooms.length} Classroom{classrooms.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Classroom Selection */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center mb-4">
          <Building2 className="w-6 h-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Select Classroom</h3>
        </div>

        {isLoadingClassrooms ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
            <span className="text-gray-600">Loading classrooms...</span>
          </div>
        ) : classrooms.length > 0 ? (
          <select
            value={selectedClassroom}
            onChange={(e) => setSelectedClassroom(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">Select a classroom...</option>
            {classrooms.map((classroom) => (
              <option key={classroom.id} value={classroom.id.toString()}>
                {classroom.name} ({classroom.grade_level || 'General'})
              </option>
            ))}
          </select>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600">No classrooms found. Please contact your administrator.</p>
          </div>
        )}
      </div>

      {/* Message Display */}
      {message && (
        <div className={`rounded-lg p-4 ${message.includes('Successfully')
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
          }`}>
          <div className="flex items-center">
            {message.includes('Successfully') ? (
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            )}
            <span className={message.includes('Successfully') ? 'text-green-800' : 'text-red-800'}>
              {message}
            </span>
          </div>
        </div>
      )}

      {/* Main Content */}
      {selectedClassroom && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Students */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="w-6 h-6 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Current Students</h3>
                </div>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {currentStudents.length}
                </span>
              </div>
            </div>
            <div className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-3" />
                  <span className="text-gray-600">Loading students...</span>
                </div>
              ) : currentStudents.length > 0 ? (
                <div className="space-y-3">
                  {currentStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-800 font-medium">
                            {student.fname[0]}{student.lname[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {student.fname} {student.lname}
                          </p>
                          <p className="text-sm text-gray-600">{student.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeStudentFromClass(student)}
                        className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50"
                        title="Remove from class"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No students in this classroom yet.</p>
                  <p className="text-sm text-gray-500 mt-1">Add students from the available list.</p>
                </div>
              )}
            </div>
          </div>

          {/* Available Students */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <GraduationCap className="w-6 h-6 text-green-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Available Students</h3>
                </div>
                <button
                  onClick={loadAvailableStudents}
                  disabled={isLoadingAvailable}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {isLoadingAvailable ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="p-6">
              {isLoadingAvailable ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-green-600 mr-3" />
                  <span className="text-gray-600">Loading available students...</span>
                </div>
              ) : availableStudents.length > 0 ? (
                <div className="space-y-3">
                  {availableStudents
                    .filter(student => !currentStudents.some(current => current.id === student.id))
                    .map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-800 font-medium">
                              {student.fname[0]}{student.lname[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {student.fname} {student.lname}
                            </p>
                            <p className="text-sm text-gray-600">{student.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => addStudentToClass(student)}
                          className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50"
                          title="Add to class"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">
                    {searchQuery ? 'No students found matching your search.' : 'No available students to add.'}
                  </p>
                  <button
                    onClick={loadAvailableStudents}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                  >
                    Refresh List
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* No Classroom Selected */}
      {!selectedClassroom && classrooms.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <Building2 className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Select a Classroom</h3>
          <p className="text-yellow-700">
            Please select a classroom from the dropdown above to manage its students.
          </p>
        </div>
      )}
    </div>
  );
};
