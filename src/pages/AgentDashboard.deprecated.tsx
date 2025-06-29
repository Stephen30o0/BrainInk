// import React from 'react';
// import { ArrowLeft, MessageCircle } from 'lucide-react';
// import { KANAChat } from '../components/KANAChat';
// import { useNavigate } from 'react-router-dom';

// export const AgentDashboard: React.FC = () => {
//     const [activeTab, setActiveTab] = useState<'chat' | 'quiz' | 'progress' | 'squad'>('chat');
//     const { systemStatus, agents, reconnect } = useBrainInkAgents({ autoConnect: true });

//     const tabs = [
//         { id: 'chat', label: 'Agent Chat', icon: Bot },
//         { id: 'quiz', label: 'Quiz Generator', icon: Zap },
//         { id: 'progress', label: 'Progress Analysis', icon: Settings },
//         { id: 'squad', label: 'Squad Coordinator', icon: Bot }
//     ];

//     const getStatusColor = () => {
//         switch (systemStatus) {
//             case 'online': return 'text-green-500';
//             case 'offline': return 'text-red-500';
//             case 'checking': return 'text-yellow-500';
//             default: return 'text-gray-500';
//         }
//     };

//     const getStatusText = () => {
//         switch (systemStatus) {
//             case 'online': return 'Agents Online';
//             case 'offline': return 'Agents Offline';
//             case 'checking': return 'Checking Status...';
//             default: return 'Unknown Status';
//         }
//     };

//     return (
//         <div className="min-h-screen bg-[#0a0e17]">
//             {/* Header */}
//             <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-6">
//                 <div className="max-w-7xl mx-auto">
//                     <div className="flex items-center justify-between">
//                         <div className="flex items-center gap-4">
//                             <button className="text-white hover:text-gray-200 transition-colors">
//                                 <ArrowLeft className="w-6 h-6" />
//                             </button>
//                             <div>
//                                 <h1 className="text-3xl font-bold text-white">Brain Ink AI Agents</h1>
//                                 <p className="text-purple-100">Intelligent learning assistants powered by ElizaOS</p>
//                             </div>
//                         </div>

//                         <div className="flex items-center gap-4">
//                             <div className="text-right text-white">
//                                 <div className={`text-sm font-medium ${getStatusColor()}`}>
//                                     {getStatusText()}
//                                 </div>
//                                 <div className="text-xs text-purple-100">
//                                     {agents.length} agent{agents.length !== 1 ? 's' : ''} available
//                                 </div>
//                             </div>

//                             {systemStatus === 'offline' && (
//                                 <button
//                                     onClick={reconnect}
//                                     className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
//                                 >
//                                     Reconnect
//                                 </button>
//                             )}
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             {/* Navigation Tabs */}
//             <div className="bg-gray-900 border-b border-gray-700">
//                 <div className="max-w-7xl mx-auto">
//                     <div className="flex space-x-8">
//                         {tabs.map(({ id, label, icon: Icon }) => (
//                             <button
//                                 key={id}
//                                 onClick={() => setActiveTab(id as any)}
//                                 className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-colors ${activeTab === id
//                                         ? 'border-purple-500 text-white'
//                                         : 'border-transparent text-gray-400 hover:text-gray-200'
//                                     }`}
//                             >
//                                 <Icon className="w-5 h-5" />
//                                 {label}
//                             </button>
//                         ))}
//                     </div>
//                 </div>
//             </div>

//             {/* Content Area */}
//             <div className="max-w-7xl mx-auto p-6">
//                 {activeTab === 'chat' && (
//                     <div className="bg-gray-800 rounded-lg overflow-hidden" style={{ height: '70vh' }}>
//                         <ElizaAgentSelector />
//                     </div>
//                 )}

//                 {activeTab === 'quiz' && (
//                     <div className="max-w-2xl mx-auto">
//                         <div className="mb-6 text-center">
//                             <h2 className="text-2xl font-bold text-white mb-2">AI Quiz Generator</h2>
//                             <p className="text-gray-400">
//                                 Generate custom quizzes with K.A.N.A. Educational Tutor
//                             </p>
//                         </div>
//                         <AgentQuizGenerator
//                             onQuizGenerated={(quiz) => {
//                                 console.log('Quiz generated:', quiz);
//                                 // You could integrate this with your quiz system
//                             }}
//                         />
//                     </div>
//                 )}

//                 {activeTab === 'progress' && (
//                     <div className="max-w-2xl mx-auto">
//                         <div className="mb-6 text-center">
//                             <h2 className="text-2xl font-bold text-white mb-2">Learning Progress Analysis</h2>
//                             <p className="text-gray-400">
//                                 Get insights on your learning journey with our Progress Analyst
//                             </p>
//                         </div>
//                         <AgentProgressAnalyzer
//                             onAnalysisComplete={(analysis) => {
//                                 console.log('Progress analysis:', analysis);
//                                 // You could integrate this with your progress tracking
//                             }}
//                         />
//                     </div>
//                 )}

//                 {activeTab === 'squad' && (
//                     <div className="max-w-2xl mx-auto">
//                         <div className="mb-6 text-center">
//                             <h2 className="text-2xl font-bold text-white mb-2">Squad Coordination</h2>
//                             <p className="text-gray-400">
//                                 Get AI assistance with managing your study squad
//                             </p>
//                         </div>
//                         <AgentSquadCoordinator
//                             squadId="current-squad" // This would come from your squad context
//                             onRecommendation={(recommendation) => {
//                                 console.log('Squad recommendation:', recommendation);
//                                 // You could integrate this with your squad system
//                             }}
//                         />
//                     </div>
//                 )}
//             </div>

//             {/* System Status Bar */}
//             <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-4">
//                 <div className="max-w-7xl mx-auto flex items-center justify-between">
//                     <div className="flex items-center gap-4 text-sm text-gray-400">
//                         <div className="flex items-center gap-2">
//                             <div className={`w-2 h-2 rounded-full ${systemStatus === 'online' ? 'bg-green-500' :
//                                     systemStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
//                                 }`} />
//                             ElizaOS Agent System
//                         </div>
//                         <div>•</div>
//                         <div>Backend: localhost:3001</div>
//                     </div>

//                     <div className="text-xs text-gray-500">
//                         Brain Ink AI Agents v1.0.0
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };
