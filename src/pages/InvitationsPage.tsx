import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { GraduationCapIcon, ShieldCheckIcon, ArrowLeftIcon, CheckIcon, XIcon, MailIcon, RefreshCwIcon } from 'lucide-react';
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
            console.log('🔍 Loading available invitations...');

            const invitations = await schoolSelectionService.getAvailableInvitations();
            console.log('📧 Invitations loaded:', invitations);

            setAvailableInvitations(invitations || []);

            if (!invitations || invitations.length === 0) {
                console.log('📭 No invitations found');
            }
        } catch (error: any) {
            console.error('Error loading invitations:', error);

            // Handle specific errors more gracefully
            if (error.message.includes('Method Not Allowed') ||
                error.message.includes('Not Found') ||
                error.message.includes('404') ||
                error.message.includes('405')) {
                setError('Invitation system is being set up. Please try again later or contact your school administrator.');
            } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                setError('Please log in again to check for invitations.');
            } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
                setError('You don\'t have permission to view invitations. Please contact your school administrator.');
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
            console.log(`🎯 Accepting ${invitation.invitation_type} invitation for ${invitation.school_name}`);
            let response;

            if (invitation.invitation_type === 'teacher') {
                response = await schoolSelectionService.acceptTeacherInvitation(invitation.school_id);
            } else if (invitation.invitation_type === 'student') {
                response = await schoolSelectionService.acceptStudentInvitation(invitation.school_id);
            } else {
                throw new Error('Invalid invitation type');
            }

            if (response.success) {
                console.log('✅ Invitation accepted successfully:', response);

                // Store the school and role information
                if (response.role === 'teacher' || response.role === 'principal') {
                    schoolSelectionService.storeSchoolAndRole(
                        response.school_id!,
                        response.school_name!,
                        response.role as 'principal' | 'teacher'
                    );
                } else {
                    // For students, store basic info but don't use the principal/teacher specific storage
                    localStorage.setItem('selected_school_id', response.school_id!.toString());
                    localStorage.setItem('selected_school_name', response.school_name!);
                    localStorage.setItem('user_role', 'student');
                }

                // Show success message briefly before navigation
                setError(''); // Clear any previous errors

                // Navigate to appropriate dashboard
                setTimeout(() => {
                    if (response.role === 'teacher') {
                        navigate('/teacher-dashboard');
                    } else if (response.role === 'principal') {
                        navigate('/principal-dashboard');
                    } else {
                        navigate('/townsquare'); // For students
                    }
                }, 500);

            } else {
                setError('Failed to accept invitation. Please try again.');
            }
        } catch (error: any) {
            console.error('Error accepting invitation:', error);

            // Provide specific error messages
            if (error.message.includes('403') || error.message.includes('No valid invitation')) {
                setError('This invitation is no longer valid. Please contact your school administrator for a new invitation.');
            } else if (error.message.includes('400') || error.message.includes('already')) {
                setError('You are already enrolled in this school with this role.');
            } else if (error.message.includes('404')) {
                setError('School not found or is no longer active.');
            } else {
                setError(error.message || 'Failed to accept invitation. Please try again.');
            }
        } finally {
            setProcessingInvitation(null);
        }
    };

    const handleDeclineInvitation = async (invitation: InvitationResponse) => {
        setProcessingInvitation(invitation.id);
        setError('');

        try {
            console.log(`❌ Declining ${invitation.invitation_type} invitation for ${invitation.school_name}`);

            const response = await schoolSelectionService.declineInvitation(invitation.id);

            if (response.success) {
                console.log('✅ Invitation declined successfully');

                // Remove the declined invitation from the list
                setAvailableInvitations(prev => prev.filter(inv => inv.id !== invitation.id));

                // Show success feedback
                console.log(`Declined invitation for ${invitation.school_name}`);
            } else {
                setError('Failed to decline invitation. Please try again.');
            }
        } catch (error: any) {
            console.error('Error declining invitation:', error);

            // Even if there's an API error, we can still remove it from the UI
            // since declining is mainly a client-side action in this case
            setAvailableInvitations(prev => prev.filter(inv => inv.id !== invitation.id));
            console.log(`Removed invitation from view: ${invitation.school_name}`);
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

                {/* Navigation and Refresh */}
                <div className="flex justify-between items-center mb-6">
                    <button
                        onClick={() => navigate('/role-selection')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Back to role selection
                    </button>

                    <button
                        onClick={loadAvailableInvitations}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCwIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
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
                        <div className="max-w-md mx-auto space-y-3">
                            <p className="text-gray-400 text-lg">
                                You don't have any pending school invitations at the moment.
                            </p>
                            <p className="text-gray-500 text-sm">
                                Contact your school administrator if you're expecting an invitation.
                            </p>
                            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg text-left">
                                <h4 className="text-blue-400 font-semibold mb-2">What to do next:</h4>
                                <ul className="text-gray-300 text-sm space-y-1">
                                    <li>• Ask your school principal to send you an invitation</li>
                                    <li>• Check if you have the correct email address registered</li>
                                    <li>• Try refreshing this page to check for new invitations</li>
                                    <li>• Use direct school login if you already have access</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Options */}
                <div className="text-center mt-8 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button
                            onClick={() => navigate('/school-login')}
                            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                            <ArrowLeftIcon className="w-4 h-4" />
                            Back to School Login
                        </button>
                        <button
                            onClick={() => navigate('/role-selection')}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            Choose Different Role
                        </button>
                    </div>
                    <p className="text-gray-500 text-sm">
                        Having trouble? Contact your school administrator for assistance.
                    </p>
                </div>
            </div>
        </div>
    );
};
