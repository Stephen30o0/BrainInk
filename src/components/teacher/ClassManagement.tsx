import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Search, 
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { teacherService, Student } from '../../services/teacherService';

export const ClassManagement: React.FC = () => {
  const [currentStudents, setCurrentStudents] = useState<Student[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadCurrentStudents();
  }, []);

  const loadCurrentStudents = async () => {
    try {
      setIsLoading(true);
      const students = await teacherService.getAllStudents();
      setCurrentStudents(students);
    } catch (error) {
      console.error('Failed to load current students:', error);
      setMessage('Failed to load current students');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableStudents = async () => {
    try {
      setIsLoadingAvailable(true);
      const students = await teacherService.getAvailableStudents();
      setAvailableStudents(students);
    } catch (error) {
      console.error('Failed to load available students:', error);
      setMessage('Failed to load available students');
    } finally {
      setIsLoadingAvailable(false);
    }
  };

  const addStudentToClass = async (student: Student) => {
    try {
      const success = await teacherService.addStudentToClass(student.id);
      if (success) {
        setMessage(`Added ${student.fname} ${student.lname} to class`);
        await loadCurrentStudents();
        // Remove from available list
        setAvailableStudents(prev => prev.filter(s => s.id !== student.id));
      } else {
        setMessage('Failed to add student to class');
      }
    } catch (error) {
      console.error('Failed to add student:', error);
      setMessage('Failed to add student to class');
    }
  };

  const removeStudentFromClass = async (student: Student) => {
    try {
      const success = await teacherService.removeStudentFromClass(student.id);
      if (success) {
        setMessage(`Removed ${student.fname} ${student.lname} from class`);
        await loadCurrentStudents();
      } else {
        setMessage('Failed to remove student from class');
      }
    } catch (error) {
      console.error('Failed to remove student:', error);
      setMessage('Failed to remove student from class');
    }
  };

  const filteredAvailableStudents = availableStudents.filter(student =>
    `${student.fname} ${student.lname}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Class Management</h2>
          <p className="text-gray-600 mt-1">Add or remove students from your class</p>
        </div>
        <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
          <Users className="w-5 h-5 text-blue-600" />
          <span className="text-blue-800 font-medium">{currentStudents.length} Students</span>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          message.includes('Failed') 
            ? 'bg-red-50 text-red-800 border border-red-200' 
            : 'bg-green-50 text-green-800 border border-green-200'
        }`}>
          {message.includes('Failed') ? (
            <AlertCircle className="w-5 h-5" />
          ) : (
            <CheckCircle className="w-5 h-5" />
          )}
          <span>{message}</span>
          <button 
            onClick={() => setMessage('')}
            className="ml-auto text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Students */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Current Class Students</h3>
            <p className="text-sm text-gray-600 mt-1">Students currently in your class</p>
          </div>
          
          {isLoading ? (
            <div className="p-6 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading students...</span>
            </div>
          ) : currentStudents.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No students in class yet</p>
              <p className="text-sm">Add students from the available list</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {currentStudents.map((student) => (
                <div key={student.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {student.fname.charAt(0)}{student.lname.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {student.fname} {student.lname}
                        </p>
                        <p className="text-sm text-gray-600">@{student.username}</p>
                        <p className="text-xs text-gray-500">
                          {student.totalXP} XP • {student.rank}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeStudentFromClass(student)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove from class"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Students */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Available Students</h3>
                <p className="text-sm text-gray-600 mt-1">BrainInk users you can add to your class</p>
              </div>
              <button
                onClick={loadAvailableStudents}
                disabled={isLoadingAvailable}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {isLoadingAvailable ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>{isLoadingAvailable ? 'Loading...' : 'Find Students'}</span>
              </button>
            </div>
            
            {availableStudents.length > 0 && (
              <div className="mt-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
          
          {isLoadingAvailable ? (
            <div className="p-6 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Finding students...</span>
            </div>
          ) : availableStudents.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <UserPlus className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No available students loaded</p>
              <p className="text-sm">Click "Find Students" to search for BrainInk users</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {filteredAvailableStudents.map((student) => (
                <div key={student.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-medium">
                          {student.fname.charAt(0)}{student.lname.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {student.fname} {student.lname}
                        </p>
                        <p className="text-sm text-gray-600">@{student.username}</p>
                        <p className="text-xs text-gray-500">Available to add</p>
                      </div>
                    </div>
                    <button
                      onClick={() => addStudentToClass(student)}
                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                      title="Add to class"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
