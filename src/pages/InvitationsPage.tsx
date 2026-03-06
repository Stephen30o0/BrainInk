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
            <div className="min-h-[100dvh] bg-[#FAFAF8] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-stone-600 text-sm">Loading invitations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[100dvh] bg-[#FAFAF8] flex flex-col items-center relative overflow-hidden">
            {/* Subtle background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-stone-100/30 rounded-full blur-[100px]" />
            </div>

            {/* Content */}
            <div className="w-full max-w-3xl relative z-10 px-6 pt-20 pb-16">
                {/* Header */}
                <div className="mb-10">
                    <span className="inline-block text-xs font-mono uppercase tracking-widest text-stone-400 mb-4">Invitations</span>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-stone-900 mb-3">
                        School Invitations
                    </h1>
                    <p className="text-lg text-stone-500">
                        Accept or decline your pending invitations.
                    </p>
                    {user && (
                        <p className="text-sm text-blue-600 mt-2 font-medium">
                            Signed in as {user.name}
                        </p>
                    )}
                </div>

                {/* Navigation and Refresh */}
                <div className="flex justify-between items-center mb-8">
                    <button
                        onClick={() => navigate('/role-selection')}
                        className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors text-sm"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Back to role selection
                    </button>

                    <button
                        onClick={loadAvailableInvitations}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
                    >
                        <RefreshCwIcon className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                        <p className="text-red-700 text-sm text-center">{error}</p>
                    </div>
                )}

                {/* Invitations List */}
                {availableInvitations.length > 0 ? (
                    <div className="space-y-4 mb-10">
                        {availableInvitations.map((invitation) => (
                            <div
                                key={invitation.id}
                                className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    {/* Left: Icon + Info */}
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                            invitation.invitation_type === 'teacher'
                                                ? 'bg-emerald-50 text-emerald-600'
                                                : 'bg-blue-50 text-blue-600'
                                        }`}>
                                            {invitation.invitation_type === 'teacher' ? (
                                                <GraduationCapIcon className="w-6 h-6" />
                                            ) : (
                                                <ShieldCheckIcon className="w-6 h-6" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-stone-900">
                                                {invitation.school_name}
                                            </h3>
                                            <div className="flex items-center gap-3 text-sm">
                                                <span className={`font-medium ${
                                                    invitation.invitation_type === 'teacher' ? 'text-emerald-600' : 'text-blue-600'
                                                }`}>
                                                    {invitation.invitation_type === 'teacher' ? 'Teacher' : 'Student'}
                                                </span>
                                                <span className="text-stone-300">|</span>
                                                <span className="text-stone-400">
                                                    {new Date(invitation.invited_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex gap-2 sm:shrink-0">
                                        <button
                                            onClick={() => handleAcceptInvitation(invitation)}
                                            disabled={processingInvitation === invitation.id}
                                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 active:scale-[0.98]"
                                        >
                                            {processingInvitation === invitation.id ? (
                                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <CheckIcon className="w-4 h-4" />
                                            )}
                                            Accept
                                        </button>
                                        <button
                                            onClick={() => handleDeclineInvitation(invitation)}
                                            disabled={processingInvitation === invitation.id}
                                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-300 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 active:scale-[0.98]"
                                        >
                                            {processingInvitation === invitation.id ? (
                                                <div className="w-3.5 h-3.5 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <XIcon className="w-4 h-4" />
                                            )}
                                            Decline
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* No Invitations - clean empty state */
                    <div className="text-center py-16">
                        <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-6">
                            <MailIcon className="w-8 h-8 text-stone-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-stone-900 mb-2">No Pending Invitations</h3>
                        <p className="text-stone-500 mb-8 max-w-sm mx-auto">
                            You don't have any school invitations right now. Contact your administrator if you're expecting one.
                        </p>
                        <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 max-w-md mx-auto text-left">
                            <h4 className="text-sm font-semibold text-stone-700 mb-3">What to do next</h4>
                            <ul className="text-sm text-stone-500 space-y-2">
                                <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-stone-400 mt-2 shrink-0" />Ask your school principal to send an invitation</li>
                                <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-stone-400 mt-2 shrink-0" />Verify your registered email address is correct</li>
                                <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-stone-400 mt-2 shrink-0" />Try refreshing this page for new invitations</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* Navigation Options */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-8 border-t border-stone-200">
                    <button
                        onClick={() => navigate('/school-login')}
                        className="px-6 py-2.5 bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Back to School Login
                    </button>
                    <button
                        onClick={() => navigate('/role-selection')}
                        className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                        Choose Different Role
                    </button>
                </div>

                <p className="text-stone-400 text-xs text-center mt-6">
                    Having trouble? Contact your school administrator for assistance.
                </p>
            </div>
        </div>
    );
};
