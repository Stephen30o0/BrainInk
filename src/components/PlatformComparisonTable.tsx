import React from 'react';

export const PlatformComparisonTable: React.FC = () => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        {/* Simple Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-light text-slate-900 mb-4">
            Platform Comparison
          </h2>
          <p className="text-slate-600 font-light">
            See how Brain Ink compares to other platforms
          </p>
        </div>

        {/* Clean Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-6 text-slate-900 font-medium">Features</th>
                <th className="text-center py-6 text-slate-600 font-light">Khan Academy</th>
                <th className="text-center py-6 text-slate-600 font-light">Coursera</th>
                <th className="text-center py-6 text-slate-600 font-light">Quizlet</th>
                <th className="text-center py-6 text-blue-600 font-medium">Brain Ink</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-4 text-slate-900 font-medium">Learning Style</td>
                <td className="py-4 text-center text-slate-500">Passive</td>
                <td className="py-4 text-center text-slate-500">Mixed</td>
                <td className="py-4 text-center text-slate-500">Mixed</td>
                <td className="py-4 text-center text-blue-600 font-medium">Interactive</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-4 text-slate-900 font-medium">Customization</td>
                <td className="py-4 text-center text-slate-500">Low</td>
                <td className="py-4 text-center text-slate-500">Medium</td>
                <td className="py-4 text-center text-slate-500">Medium</td>
                <td className="py-4 text-center text-blue-600 font-medium">High</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-4 text-slate-900 font-medium">Interactivity</td>
                <td className="py-4 text-center text-slate-500">Medium</td>
                <td className="py-4 text-center text-slate-500">Low</td>
                <td className="py-4 text-center text-slate-500">Medium</td>
                <td className="py-4 text-center text-blue-600 font-medium">High</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-4 text-slate-900 font-medium">AI Personalization</td>
                <td className="py-4 text-center text-slate-500">None</td>
                <td className="py-4 text-center text-slate-500">Basic</td>
                <td className="py-4 text-center text-slate-500">Basic</td>
                <td className="py-4 text-center text-blue-600 font-medium">Advanced</td>
              </tr>
              <tr>
                <td className="py-4 text-slate-900 font-medium">Best For</td>
                <td className="py-4 text-center text-slate-500">Practice</td>
                <td className="py-4 text-center text-slate-500">Courses</td>
                <td className="py-4 text-center text-slate-500">Flashcards</td>
                <td className="py-4 text-center text-blue-600 font-medium">Complete Learning</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Simple CTA */}
        <div className="text-center mt-16">
          <button 
            onClick={() => window.location.href = '/signup'}
            className="bg-blue-600 text-white px-12 py-4 text-lg font-light hover:bg-blue-700 transition-colors"
          >
            Try Brain Ink
          </button>
        </div>
      </div>
    </section>
  );
};
