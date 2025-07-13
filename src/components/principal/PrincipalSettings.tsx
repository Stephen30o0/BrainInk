import React, { useState, useEffect } from 'react';
import {
    Save,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
import { backendIntegration } from '../../services/backendIntegration';

interface PrincipalSettingsProps {
    schoolData: any;
    onRefresh: () => void;
}

export const PrincipalSettings: React.FC<PrincipalSettingsProps> = ({
    schoolData,
    onRefresh
}) => {
    const [loading, setLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [schoolSettings, setSchoolSettings] = useState({
        name: '',
        address: '',
        email: '',
        phone: '',
        website: '',
        timezone: 'UTC',
        language: 'en'
    });

    const [notificationSettings, setNotificationSettings] = useState({
        email_notifications: true,
        new_student_alerts: true,
        grade_updates: true,
        assignment_reminders: true,
        weekly_reports: true
    });

    const [securitySettings, setSecuritySettings] = useState({
        require_email_verification: true,
        auto_approve_teachers: false,
        student_data_retention: 365,
        backup_frequency: 'daily'
    });

    useEffect(() => {
        loadSettings();
    }, [schoolData]);

    const loadSettings = async () => {
        try {
            setLoading(true);

            if (schoolData) {
                setSchoolSettings({
                    name: schoolData.name || '',
                    address: schoolData.address || '',
                    email: schoolData.email || '',
                    phone: schoolData.phone || '',
                    website: schoolData.website || '',
                    timezone: schoolData.timezone || 'UTC',
                    language: schoolData.language || 'en'
                });
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            setError('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        try {
            setSaveLoading(true);
            setError(null);

            // Save school settings
            await backendIntegration.updateSchoolSettings({
                ...schoolSettings,
                id: schoolData.id
            });

            setSuccess('Settings saved successfully!');
            setTimeout(() => setSuccess(null), 3000);
            onRefresh();
        } catch (error: any) {
            console.error('Failed to save settings:', error);
            setError(error.message || 'Failed to save settings');
        } finally {
            setSaveLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-gray-700 font-medium">Loading settings...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">School Settings</h2>
                        <p className="text-gray-600 mt-1">Manage your school's configuration and preferences</p>
                    </div>
                    <button
                        onClick={saveSettings}
                        disabled={saveLoading}
                        className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-all font-medium"
                    >
                        <Save className="w-4 h-4" />
                        <span>{saveLoading ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                </div>
            </div>

            {/* Status Messages */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                        <p className="text-red-700 font-medium">{error}</p>
                    </div>
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        <p className="text-green-700 font-medium">{success}</p>
                    </div>
                </div>
            )}

            {/* School Information */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">School Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">School Name</label>
                        <input
                            type="text"
                            value={schoolSettings.name}
                            onChange={(e) => setSchoolSettings({ ...schoolSettings, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                            type="email"
                            value={schoolSettings.email}
                            onChange={(e) => setSchoolSettings({ ...schoolSettings, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                        <textarea
                            value={schoolSettings.address}
                            onChange={(e) => setSchoolSettings({ ...schoolSettings, address: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input
                            type="tel"
                            value={schoolSettings.phone}
                            onChange={(e) => setSchoolSettings({ ...schoolSettings, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                        <input
                            type="url"
                            value={schoolSettings.website}
                            onChange={(e) => setSchoolSettings({ ...schoolSettings, website: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-900">Email Notifications</label>
                            <p className="text-sm text-gray-500">Receive email notifications for important events</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={notificationSettings.email_notifications}
                                onChange={(e) => setNotificationSettings({ ...notificationSettings, email_notifications: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-900">New Student Alerts</label>
                            <p className="text-sm text-gray-500">Get notified when new students join</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={notificationSettings.new_student_alerts}
                                onChange={(e) => setNotificationSettings({ ...notificationSettings, new_student_alerts: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-900">Require Email Verification</label>
                            <p className="text-sm text-gray-500">New users must verify their email address</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={securitySettings.require_email_verification}
                                onChange={(e) => setSecuritySettings({ ...securitySettings, require_email_verification: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* System Information */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">School ID</label>
                        <p className="text-gray-900 font-mono">{schoolData?.id || 'N/A'}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Created Date</label>
                        <p className="text-gray-900">{schoolData?.created_date ? new Date(schoolData.created_date).toLocaleDateString() : 'N/A'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
