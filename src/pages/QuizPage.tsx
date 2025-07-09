import React from 'react';
import { QuizComponent } from '../components/quiz/QuizComponent';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';

export const QuizPage: React.FC = () => {
    const { quizId } = useParams<{ quizId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const studentId = searchParams.get('student');

    if (!quizId || !studentId) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Quiz URL</h2>
                        <p className="text-gray-600 mb-6">The quiz link appears to be invalid or incomplete.</p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <QuizComponent
            quizId={quizId}
            studentId={parseInt(studentId)}
            onComplete={(attempt) => {
                console.log('Quiz completed:', attempt);
                // Could show a completion modal or notification here
            }}
            onClose={() => {
                navigate('/dashboard');
            }}
        />
    );
};
