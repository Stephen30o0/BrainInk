import React, { useState } from 'react';
import { X, Clock, Target, BookOpen, Filter } from 'lucide-react';
import quizzes, { quizCategories } from './data/QuizData';
import { pastPapersByExamBody } from './data/PastPaperData';
interface QuizSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuiz: (type: 'quiz' | 'pastpaper', id: string) => void;
  type: 'quiz' | 'pastpaper';
}
const QuizSelectionModal: React.FC<QuizSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectQuiz,
  type
}) => {
  const [selectedExamBody, setSelectedExamBody] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number | ''>('');
  // For practice quizzes
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<number | ''>('');
  if (!isOpen) return null;
  const renderPastPaperSelection = () => {
    const examBodies = Object.keys(pastPapersByExamBody || {});
    const subjects = selectedExamBody ? Object.keys(pastPapersByExamBody[selectedExamBody] || {}) : [];
    const years = selectedExamBody && selectedSubject ? Object.keys(pastPapersByExamBody[selectedExamBody]?.[selectedSubject] || {}).map(Number) : [];
    const availablePapers = selectedExamBody && selectedSubject && selectedYear && pastPapersByExamBody[selectedExamBody]?.[selectedSubject]?.[selectedYear] ? pastPapersByExamBody[selectedExamBody][selectedSubject][selectedYear] : [];
    return <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-400 block mb-2">Exam Body</label>
          <select value={selectedExamBody} onChange={e => {
          setSelectedExamBody(e.target.value);
          setSelectedSubject('');
          setSelectedYear('');
        }} className="w-full bg-[#141b2d] border border-[#1a223a] rounded-md py-2 px-3 text-sm">
            <option value="">Select Exam Body</option>
            {examBodies.map(body => <option key={body} value={body}>
                {body}
              </option>)}
          </select>
        </div>
        {selectedExamBody && <div>
            <label className="text-sm text-gray-400 block mb-2">Subject</label>
            <select value={selectedSubject} onChange={e => {
          setSelectedSubject(e.target.value);
          setSelectedYear('');
        }} className="w-full bg-[#141b2d] border border-[#1a223a] rounded-md py-2 px-3 text-sm">
              <option value="">Select Subject</option>
              {subjects.map(subject => <option key={subject} value={subject}>
                  {subject}
                </option>)}
            </select>
          </div>}
        {selectedSubject && <div>
            <label className="text-sm text-gray-400 block mb-2">Year</label>
            <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="w-full bg-[#141b2d] border border-[#1a223a] rounded-md py-2 px-3 text-sm">
              <option value="">Select Year</option>
              {years.map(year => <option key={year} value={year}>
                  {year}
                </option>)}
            </select>
          </div>}
        {selectedYear && availablePapers && availablePapers.length > 0 && <div className="mt-6">
            <h4 className="font-medium mb-3">Available Papers</h4>
            <div className="space-y-3">
              {availablePapers.map(paper => <div key={paper.id} onClick={() => onSelectQuiz('pastpaper', paper.id)} className="bg-[#141b2d] p-4 rounded-lg border border-[#1a223a] hover:border-blue-500 transition-colors cursor-pointer">
                  <h5 className="font-medium mb-2">{paper.title}</h5>
                  <div className="text-sm text-gray-400">
                    <div className="flex items-center space-x-2">
                      <span>{paper.examBody}</span>
                      <span>•</span>
                      <span>{paper.year}</span>
                      <span>•</span>
                      <span>{paper.pages} pages</span>
                    </div>
                    <p className="mt-1">{paper.description}</p>
                  </div>
                </div>)}
            </div>
          </div>}
      </div>;
  };
  const renderPracticeQuizSelection = () => {
    const category = quizCategories.find(c => c.subject === selectedSubject);
    return <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-400 block mb-2">Subject</label>
          <select value={selectedSubject} onChange={e => {
          setSelectedSubject(e.target.value);
          setSelectedLevel('');
          setSelectedTopic('');
          setSelectedTime('');
        }} className="w-full bg-[#141b2d] border border-[#1a223a] rounded-md py-2 px-3 text-sm">
            <option value="">Select Subject</option>
            {quizCategories.map(cat => <option key={cat.subject} value={cat.subject}>
                {cat.subject}
              </option>)}
          </select>
        </div>
        {category && <>
            <div>
              <label className="text-sm text-gray-400 block mb-2">Level</label>
              <select value={selectedLevel} onChange={e => setSelectedLevel(e.target.value)} className="w-full bg-[#141b2d] border border-[#1a223a] rounded-md py-2 px-3 text-sm">
                <option value="">Select Level</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-2">Topic</label>
              <select value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)} className="w-full bg-[#141b2d] border border-[#1a223a] rounded-md py-2 px-3 text-sm">
                <option value="">Select Topic</option>
                {category.topics.map(topic => <option key={topic} value={topic}>
                    {topic}
                  </option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-2">
                Duration
              </label>
              <select value={selectedTime} onChange={e => setSelectedTime(Number(e.target.value))} className="w-full bg-[#141b2d] border border-[#1a223a] rounded-md py-2 px-3 text-sm">
                <option value="">Select Duration</option>
                {category.timeOptions.map(time => <option key={time} value={time}>
                    {time} minutes
                  </option>)}
              </select>
            </div>
          </>}
        {selectedSubject && selectedLevel && selectedTopic && selectedTime && <div className="mt-6">
            <h4 className="font-medium mb-3">Available Quizzes</h4>
            <div className="space-y-3">
              {quizzes.filter(q => q.subject === selectedSubject && q.level === selectedLevel && q.topic === selectedTopic && q.timeLimit === selectedTime * 60).map(quiz => <div key={quiz.id} onClick={() => onSelectQuiz('quiz', quiz.id)} className="bg-[#141b2d] p-4 rounded-lg border border-[#1a223a] hover:border-blue-500 transition-colors cursor-pointer">
                    <h5 className="font-medium mb-2">{quiz.title}</h5>
                    <div className="flex items-center text-sm text-gray-400 space-x-4">
                      <span>{quiz.questions.length} questions</span>
                      <span>•</span>
                      <span>{selectedTime} minutes</span>
                    </div>
                  </div>)}
            </div>
          </div>}
      </div>;
  };
  return <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-[#0a0e17] border border-[#1a223a] rounded-lg w-[600px] max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-[#1a223a]">
          <h3 className="text-lg font-medium flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-blue-400" />
            {type === 'quiz' ? 'Practice Quiz' : 'Past Papers'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {type === 'quiz' ? renderPracticeQuizSelection() : renderPastPaperSelection()}
        </div>
      </div>
    </div>;
};
export default QuizSelectionModal;