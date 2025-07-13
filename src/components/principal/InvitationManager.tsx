import React, { useState, useEffect } from 'react';
import {
    Mail,
    UserPlus,
    UserCheck,
    X,
    Clock,
    CheckCircle,
    AlertCircle,
    GraduationCap
} from 'lucide-react';
import { principalService } from '../../services/principalService';

interface Invitation {
    id: number;
    email: string;
    invitation_type: 'teacher' | 'student';
    school_name: string;
    invited_date: string;
    is_used: boolean;
    is_active: boolean;
    used_date?: string;
}

export const InvitationManager: React.FC = () => {
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [inviteForm, setInviteForm] = useState({
        email: '',
        role: 'teacher' as 'teacher' | 'student',
        message: ''
    });
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadInvitations();
    }, []);

    const loadInvitations = async () => {
        try {
            setIsLoading(true);
            const data = await principalService.getSchoolInvitations();
            setInvitations(data);
        } catch (error) {
            console.error('Error loading invitations:', error);
            setError('Failed to load invitations');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendInvitation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteForm.email) {
            setError('Email is required');
            return;
        }

        setIsSending(true);
        setError('');

        try {
            await principalService.createInvitation(inviteForm.email, inviteForm.role);

            // Reset form and reload invitations
            setInviteForm({ email: '', role: 'teacher', message: '' });
            setShowInviteForm(false);
            loadInvitations();
        } catch (error) {
            console.error('Error sending invitation:', error);
            setError('Failed to send invitation');
        } finally {
            setIsSending(false);
        }
    };

    const handleCancelInvitation = async (invitationId: number) => {
        try {
            await principalService.cancelInvitation(invitationId);
            loadInvitations();
        } catch (error) {
            console.error('Error canceling invitation:', error);
            setError('Failed to cancel invitation');
        }
    };

    const handleResendInvitation = async (invitationId: number) => {
        try {
            // For now, we'll just reload the invitations
            // TODO: Implement resend functionality in principalService
            console.log('Resend invitation:', invitationId);
            loadInvitations();
        } catch (error) {
            console.error('Error resending invitation:', error);
            setError('Failed to resend invitation');
        }
    };

    const getInvitationStatus = (invitation: Invitation) => {
        if (invitation.is_used) {
            return 'accepted';
        } else if (invitation.is_active) {
            return 'pending';
        } else {
            return 'expired';
        }
    };

    const getStatusIcon = (invitation: Invitation) => {
        const status = getInvitationStatus(invitation);
        switch (status) {
            case 'pending':
                return <Clock className="w-4 h-4 text-yellow-500" />;
            case 'accepted':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'expired':
                return <X className="w-4 h-4 text-red-500" />;
            default:
                return <Mail className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusColor = (invitation: Invitation) => {
        const status = getInvitationStatus(invitation);
        switch (status) {
            case 'pending':
                return 'text-yellow-700 bg-yellow-100 border-yellow-200';
            case 'accepted':
                return 'text-green-700 bg-green-100 border-green-200';
            case 'expired':
                return 'text-red-700 bg-red-100 border-red-200';
            default:
                return 'text-gray-500 bg-gray-100 border-gray-200';
        }
    };

    const stats = {
        total: invitations.length,
        pending: invitations.filter(inv => inv.is_active && !inv.is_used).length,
        accepted: invitations.filter(inv => inv.is_used).length,
        teachers: invitations.filter(inv => inv.invitation_type === 'teacher').length,
        students: invitations.filter(inv => inv.invitation_type === 'student').length
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Invitation Management</h2>
                        <p className="text-gray-600 mt-1">Send invitations to teachers and students to join your school</p>
                    </div>
                    <button
                        onClick={() => setShowInviteForm(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>Send Invitation</span>
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                        <p className="text-red-700 font-medium">{error}</p>
                    </div>
                </div>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                    <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                    <div className="text-sm text-gray-500">Total Invitations</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                    <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                    <div className="text-sm text-gray-500">Pending</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                    <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
                    <div className="text-sm text-gray-500">Accepted</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                    <div className="text-2xl font-bold text-blue-600">{stats.teachers}</div>
                    <div className="text-sm text-gray-500">Teachers</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                    <div className="text-2xl font-bold text-purple-600">{stats.students}</div>
                    <div className="text-sm text-gray-500">Students</div>
                </div>
            </div>

            {/* Invitation Form Modal */}
            {showInviteForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Send Invitation</h3>
                            <button
                                onClick={() => setShowInviteForm(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSendInvitation} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    value={inviteForm.email}
                                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter email address"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                                <select
                                    value={inviteForm.role}
                                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as 'teacher' | 'student' })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="teacher">Teacher</option>
                                    <option value="student">Student</option>
                                </select>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowInviteForm(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSending}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {isSending ? 'Sending...' : 'Send Invitation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Invitations List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">All Invitations</h3>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading invitations...</p>
                    </div>
                ) : invitations.length === 0 ? (
                    <div className="p-8 text-center">
                        <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No invitations sent yet</p>
                        <p className="text-gray-400 text-sm">Click "Send Invitation" to get started</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {invitations.map((invitation) => (
                            <div key={invitation.id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${invitation.invitation_type === 'teacher' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                                            {invitation.invitation_type === 'teacher' ?
                                                <UserCheck className="w-4 h-4 text-blue-600" /> :
                                                <GraduationCap className="w-4 h-4 text-purple-600" />
                                            }
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{invitation.email}</div>
                                            <div className="text-sm text-gray-500">
                                                {invitation.invitation_type.charAt(0).toUpperCase() + invitation.invitation_type.slice(1)} •
                                                Sent {new Date(invitation.invited_date).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(invitation)}`}>
                                            {getStatusIcon(invitation)}
                                            <span className="ml-1">{getInvitationStatus(invitation)}</span>
                                        </span>
                                        {invitation.is_active && !invitation.is_used && (
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleResendInvitation(invitation.id)}
                                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                >
                                                    Resend
                                                </button>
                                                <button
                                                    onClick={() => handleCancelInvitation(invitation.id)}
                                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
