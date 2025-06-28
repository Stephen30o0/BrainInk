import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Users, Target, CheckCircle, Clock, Send, Loader2, AlertTriangle } from 'lucide-react';
import { teacherService, KanaRecommendation } from '../../services/teacherService';

export const AISuggestions: React.FC = () => {
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [suggestions, setSuggestions] = useState<KanaRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAISuggestions();
  }, []);

  const loadAISuggestions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all students first
      const students = await teacherService.getAllStudents();
      
      // Get K.A.N.A. recommendations
      const recommendations = await teacherService.getKanaRecommendations(students);
      setSuggestions(recommendations);

    } catch (err) {
      console.error('Error loading AI suggestions:', err);
      setError('Failed to load AI suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredSuggestions = suggestions.filter(suggestion => {
    const matchesType = filterType === 'all' || suggestion.type === filterType;
    const matchesPriority = filterPriority === 'all' || suggestion.priority === filterPriority;
    return matchesType && matchesPriority;
  });

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'class': return <Users className="w-5 h-5" />;
      case 'individual': return <Target className="w-5 h-5" />;
      case 'curriculum': return <Brain className="w-5 h-5" />;
      case 'intervention': return <TrendingUp className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleImplement = (suggestionId: string) => {
    console.log('Implementing suggestion:', suggestionId);
    // Here you would implement the suggestion
  };

  const handleDismiss = (suggestionId: string) => {
    console.log('Dismissing suggestion:', suggestionId);
    // Here you would dismiss the suggestion
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading AI suggestions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={loadAISuggestions}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
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
          <div className="flex items-center space-x-3">
            <Brain className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-3xl font-bold text-gray-900">K.A.N.A. AI Suggestions</h2>
              <p className="text-gray-600 mt-1">Intelligent recommendations for teaching improvements</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-lg">
          <span className="text-blue-800 font-medium">
            {filteredSuggestions.length} Active Suggestions
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="class">Class-wide</option>
              <option value="individual">Individual</option>
              <option value="curriculum">Curriculum</option>
              <option value="intervention">Intervention</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="space-y-4">
        {filteredSuggestions.length === 0 ? (
          <div className="text-center py-12">
            <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No suggestions match your current filters.</p>
            <button 
              onClick={() => {
                setFilterType('all');
                setFilterPriority('all');
              }}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          filteredSuggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className={`bg-white rounded-lg border p-6 ${getPriorityColor(suggestion.priority)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="text-blue-600 mt-1">
                    {getSuggestionIcon(suggestion.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{suggestion.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor('new')}`}>
                        {suggestion.priority} priority
                      </span>
                    </div>
                    <p className="text-gray-700 mb-3">{suggestion.description}</p>
                    
                    {/* Action Items */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Recommended Actions:</h4>
                      <ul className="space-y-1">
                        {suggestion.actionItems.map((item, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-600">
                            <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* K.A.N.A. Reasoning */}
                    <div className="bg-blue-50 p-3 rounded-lg mb-4">
                      <h4 className="text-sm font-medium text-blue-900 mb-1">K.A.N.A. Analysis:</h4>
                      <p className="text-sm text-blue-800">{suggestion.reasoning}</p>
                    </div>

                    {/* Implementation Details */}
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {suggestion.timeframe}
                      </span>
                      <span className="flex items-center">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        {suggestion.estimatedImpact}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleImplement(suggestion.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Implement
                  </button>
                  <button
                    onClick={() => handleDismiss(suggestion.id)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      {suggestions.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggestion Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{suggestions.length}</div>
              <div className="text-sm text-gray-600">Total Suggestions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {suggestions.filter(s => s.priority === 'high').length}
              </div>
              <div className="text-sm text-gray-600">High Priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {suggestions.filter(s => s.priority === 'medium').length}
              </div>
              <div className="text-sm text-gray-600">Medium Priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {suggestions.filter(s => s.priority === 'low').length}
              </div>
              <div className="text-sm text-gray-600">Low Priority</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
