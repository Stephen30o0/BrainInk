import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { GraduationCapIcon, ShieldCheckIcon, ArrowLeftIcon, CheckIcon, XIcon, MailIcon } from 'lucide-react';
import { schoolSelectionService, InvitationResponse } from '../services/schoolSelectionService';

export const InvitationsPage = () => {
    const [availableInvitations, setAvailableInvitations] = useState<InvitationResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingInvitation, setProcessingInvitation] = useState<number | null>(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { user } = useAuth();

    // Load available invitations on component mount
    useEffect(() => {
        loadAvailableInvitations();
    }, []);

    const loadAvailableInvitations = async () => {
        try {
            setError('');
            setIsLoading(true);
            const invitations = await schoolSelectionService.getAvailableInvitations();
            setAvailableInvitations(invitations || []);
        } catch (error: any) {
            console.error('Error loading invitations:', error);

            // Handle specific errors more gracefully
            if (error.message.includes('Method Not Allowed') ||
                error.message.includes('Not Found')) {
                setError('Invitation system is not available. Please use the direct school login instead.');
            } else {
                setError('Unable to load invitations. Please try again or contact support.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleAcceptInvitation = async (invitation: InvitationResponse) => {
        setProcessingInvitation(invitation.id);
        setError('');

        try {
            let response;

            if (invitation.invitation_type === 'teacher') {
                response = await schoolSelectionService.acceptTeacherInvitation(invitation.school_id);
            } else {
                response = await schoolSelectionService.acceptStudentInvitation(invitation.school_id);
            }

            if (response.success) {
                // Store the school and role information
                schoolSelectionService.storeSchoolAndRole(
                    response.school_id!,
                    response.school_name!,
                    response.role as 'principal' | 'teacher'
                );

                // Navigate to appropriate dashboard
                if (response.role === 'teacher') {
                    navigate('/teacher-dashboard');
                } else {
                    navigate('/townsquare'); // For students
                }
            } else {
                setError('Failed to accept invitation. Please try again.');
            }
        } catch (error: any) {
            console.error('Error accepting invitation:', error);
            setError(error.message || 'Failed to accept invitation. Please try again.');
        } finally {
            setProcessingInvitation(null);
        }
    };

    const handleDeclineInvitation = async (invitation: InvitationResponse) => {
        setProcessingInvitation(invitation.id);
        setError('');

        try {
            const response = await schoolSelectionService.declineInvitation(invitation.id);
            if (response.success) {
                // Remove the declined invitation from the list
                setAvailableInvitations(prev => prev.filter(inv => inv.id !== invitation.id));
            } else {
                setError('Failed to decline invitation. Please try again.');
            }
        } catch (error: any) {
            console.error('Error declining invitation:', error);
            setError(error.message || 'Failed to decline invitation. Please try again.');
        } finally {
            setProcessingInvitation(null);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-lg">Loading invitations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0e17] flex flex-col items-center justify-center relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-tertiary/10 animate-gradient"></div>
                {Array.from({ length: 30 }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute animate-float"
                        style={{
                            width: `${Math.random() * 4 + 2}px`,
                            height: `${Math.random() * 4 + 2}px`,
                            backgroundColor: `rgba(${Math.random() * 100}, ${Math.random() * 200 + 55}, ${Math.random() * 255}, 0.5)`,
                            borderRadius: '50%',
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDuration: `${Math.random() * 10 + 5}s`,
                            animationDelay: `${Math.random() * 5}s`
                        }}
                    />
                ))}
            </div>

            {/* Content */}
            <div className="w-full max-w-4xl relative z-10 px-4">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-4">
                        School Invitations
                    </h1>
                    <p className="text-xl text-gray-300">
                        Accept or decline your school invitations
                    </p>
                    {user && (
                        <p className="text-lg text-blue-400 mt-2">
                            Hello, {user.name}!
                        </p>
                    )}
                </div>

                {/* Back Button */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/role-selection')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Back to role selection
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
                        <p className="text-red-300 text-center">{error}</p>
                    </div>
                )}

                {/* Invitations List */}
                {availableInvitations.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {availableInvitations.map((invitation) => (
                            <div
                                key={invitation.id}
                                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
                            >
                                {/* Role Icon */}
                                <div className={`w-16 h-16 rounded-lg bg-gradient-to-r ${invitation.invitation_type === 'teacher'
                                    ? 'from-green-500 to-teal-600'
                                    : 'from-blue-500 to-purple-600'
                                    } flex items-center justify-center mb-4 mx-auto`}>
                                    {invitation.invitation_type === 'teacher' ? (
                                        <GraduationCapIcon className="w-8 h-8 text-white" />
                                    ) : (
                                        <ShieldCheckIcon className="w-8 h-8 text-white" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="text-center mb-4">
                                    <h3 className="text-xl font-semibold text-white mb-2">
                                        {invitation.school_name}
                                    </h3>
                                    <p className="text-blue-400 text-sm mb-2">
                                        {invitation.invitation_type === 'teacher' ? 'Teacher' : 'Student'}
                                    </p>
                                    <p className="text-gray-400 text-xs">
                                        Invited: {new Date(invitation.invited_date).toLocaleDateString()}
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleAcceptInvitation(invitation)}
                                        disabled={processingInvitation === invitation.id}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processingInvitation === invitation.id ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <CheckIcon className="w-4 h-4" />
                                        )}
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => handleDeclineInvitation(invitation)}
                                        disabled={processingInvitation === invitation.id}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processingInvitation === invitation.id ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <XIcon className="w-4 h-4" />
                                        )}
                                        Decline
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* No Invitations */
                    <div className="text-center py-12">
                        <div className="w-24 h-24 rounded-full bg-gray-700/50 flex items-center justify-center mx-auto mb-6">
                            <MailIcon className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-semibold text-white mb-4">No Invitations Found</h3>
                        <p className="text-gray-400 text-lg">
                            You don't have any pending school invitations at the moment.
                        </p>
                        <p className="text-gray-500 text-sm mt-2">
                            Contact your school administrator if you're expecting an invitation.
                        </p>
                    </div>
                )}

                {/* Back to Login */}
                <div className="text-center mt-8">
                    <button
                        onClick={() => navigate('/school-login')}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        ← Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
};
