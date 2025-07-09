import React, { useState, useEffect } from 'react';
import {
    Mail,
    Send,
    Users,
    UserCheck,
    X,
    Clock,
    CheckCircle,
    AlertCircle,
    RefreshCw,
    Plus
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
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            default:
                return <Mail className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusColor = (invitation: Invitation) => {
        const status = getInvitationStatus(invitation);
        switch (status) {
            case 'pending':
                return 'text-yellow-500 bg-yellow-500/20';
            case 'accepted':
                return 'text-green-500 bg-green-500/20';
            case 'expired':
                return 'text-red-500 bg-red-500/20';
            default:
                return 'text-gray-500 bg-gray-500/20';
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
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Invitation Manager</h2>
                    <p className="text-gray-400">Send invitations to teachers and students</p>
                </div>
                <button
                    onClick={() => setShowInviteForm(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Send Invitation
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                    <p className="text-red-400">{error}</p>
                </div>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-white">{stats.total}</div>
                    <div className="text-sm text-gray-400">Total Invitations</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
                    <div className="text-sm text-gray-400">Pending</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-500">{stats.accepted}</div>
                    <div className="text-sm text-gray-400">Accepted</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-500">{stats.teachers}</div>
                    <div className="text-sm text-gray-400">Teachers</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-500">{stats.students}</div>
                    <div className="text-sm text-gray-400">Students</div>
                </div>
            </div>

            {/* Invitation Form Modal */}
            {showInviteForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white">Send Invitation</h3>
                            <button
                                onClick={() => setShowInviteForm(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSendInvitation} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={inviteForm.email}
                                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="user@example.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Role
                                </label>
                                <select
                                    value={inviteForm.role}
                                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as 'teacher' | 'student' })}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="teacher">Teacher</option>
                                    <option value="student">Student</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Personal Message (Optional)
                                </label>
                                <textarea
                                    value={inviteForm.message}
                                    onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={3}
                                    placeholder="Welcome to our school!"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowInviteForm(false)}
                                    className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSending}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSending ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            Sending...
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2">
                                            <Send className="w-4 h-4" />
                                            Send Invitation
                                        </div>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Invitations List */}
            <div className="bg-gray-800/50 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">Recent Invitations</h3>
                        <button
                            onClick={loadInvitations}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-400">Loading invitations...</p>
                    </div>
                ) : invitations.length === 0 ? (
                    <div className="p-8 text-center">
                        <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-400 mb-2">No invitations sent yet</p>
                        <p className="text-sm text-gray-500">Send your first invitation to get started</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-700">
                        {invitations.map((invitation) => (
                            <div key={invitation.id} className="p-4 hover:bg-gray-700/30 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                                            {invitation.invitation_type === 'teacher' ? (
                                                <Users className="w-5 h-5 text-gray-300" />
                                            ) : (
                                                <UserCheck className="w-5 h-5 text-gray-300" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-white font-medium">{invitation.email}</div>
                                            <div className="text-sm text-gray-400 capitalize">
                                                {invitation.invitation_type} • Sent {new Date(invitation.invited_date).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(invitation)}`}>
                                            {getStatusIcon(invitation)}
                                            <span className="capitalize">{getInvitationStatus(invitation)}</span>
                                        </div>

                                        {getInvitationStatus(invitation) === 'pending' && (
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleResendInvitation(invitation.id)}
                                                    className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                                                    title="Resend invitation"
                                                >
                                                    <RefreshCw className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleCancelInvitation(invitation.id)}
                                                    className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                                                    title="Cancel invitation"
                                                >
                                                    <X className="w-4 h-4" />
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
