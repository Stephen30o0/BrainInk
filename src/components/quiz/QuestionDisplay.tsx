import React from 'react';

interface QuestionDisplayProps {
  question: string;
}

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({ question }) => {
  return (
    <div className="bg-gray-700 p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-blue-300 mb-2">Question:</h2>
      <p className="text-lg">{question}</p>
    </div>
  );
};
