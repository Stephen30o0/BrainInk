import React, { useState, useEffect } from 'react';
import {
    School,
    Save,
    RefreshCw,
    Bell,
    Shield,
    Database
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
                <RefreshCw className="w-8 h-8 text-white animate-spin" />
                <span className="ml-3 text-white">Loading settings...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">School Settings</h2>
                    <p className="text-gray-300">Configure your school's settings and preferences</p>
                </div>

                <button
                    onClick={saveSettings}
                    disabled={saveLoading}
                    className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-all"
                >
                    {saveLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    <span>{saveLoading ? 'Saving...' : 'Save Changes'}</span>
                </button>
            </div>

            {/* Status Messages */}
            {error && (
                <div className="bg-red-500 bg-opacity-20 border border-red-500 border-opacity-30 rounded-lg p-4">
                    <p className="text-red-300">{error}</p>
                    <button
                        onClick={() => setError(null)}
                        className="mt-2 text-red-400 hover:text-red-300 text-sm"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {success && (
                <div className="bg-green-500 bg-opacity-20 border border-green-500 border-opacity-30 rounded-lg p-4">
                    <p className="text-green-300">{success}</p>
                </div>
            )}

            {/* School Information */}
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <School className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">School Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            School Name
                        </label>
                        <input
                            type="text"
                            value={schoolSettings.name}
                            onChange={(e) => setSchoolSettings({ ...schoolSettings, name: e.target.value })}
                            className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={schoolSettings.email}
                            onChange={(e) => setSchoolSettings({ ...schoolSettings, email: e.target.value })}
                            className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Address
                        </label>
                        <textarea
                            value={schoolSettings.address}
                            onChange={(e) => setSchoolSettings({ ...schoolSettings, address: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            value={schoolSettings.phone}
                            onChange={(e) => setSchoolSettings({ ...schoolSettings, phone: e.target.value })}
                            className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Website
                        </label>
                        <input
                            type="url"
                            value={schoolSettings.website}
                            onChange={(e) => setSchoolSettings({ ...schoolSettings, website: e.target.value })}
                            placeholder="https://yourschool.com"
                            className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                        <Bell className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Notification Preferences</h3>
                </div>

                <div className="space-y-4">
                    {Object.entries(notificationSettings).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-4 bg-white bg-opacity-5 rounded-lg">
                            <div>
                                <p className="text-white font-medium capitalize">
                                    {key.replace(/_/g, ' ')}
                                </p>
                                <p className="text-gray-300 text-sm">
                                    {key === 'email_notifications' && 'Receive notifications via email'}
                                    {key === 'new_student_alerts' && 'Get notified when new students join'}
                                    {key === 'grade_updates' && 'Receive updates when grades are submitted'}
                                    {key === 'assignment_reminders' && 'Get reminders about assignment deadlines'}
                                    {key === 'weekly_reports' && 'Receive weekly performance reports'}
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={value}
                                    onChange={(e) => setNotificationSettings({
                                        ...notificationSettings,
                                        [key]: e.target.checked
                                    })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 bg-opacity-20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Security & Privacy</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white bg-opacity-5 rounded-lg">
                            <div>
                                <p className="text-white font-medium">Email Verification</p>
                                <p className="text-gray-300 text-sm">Require email verification for new users</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={securitySettings.require_email_verification}
                                    onChange={(e) => setSecuritySettings({
                                        ...securitySettings,
                                        require_email_verification: e.target.checked
                                    })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 bg-opacity-20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white bg-opacity-5 rounded-lg">
                            <div>
                                <p className="text-white font-medium">Auto-approve Teachers</p>
                                <p className="text-gray-300 text-sm">Automatically approve teacher registrations</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={securitySettings.auto_approve_teachers}
                                    onChange={(e) => setSecuritySettings({
                                        ...securitySettings,
                                        auto_approve_teachers: e.target.checked
                                    })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 bg-opacity-20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Data Retention (days)
                            </label>
                            <input
                                type="number"
                                value={securitySettings.student_data_retention}
                                onChange={(e) => setSecuritySettings({
                                    ...securitySettings,
                                    student_data_retention: parseInt(e.target.value) || 365
                                })}
                                className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Backup Frequency
                            </label>
                            <select
                                value={securitySettings.backup_frequency}
                                onChange={(e) => setSecuritySettings({
                                    ...securitySettings,
                                    backup_frequency: e.target.value
                                })}
                                className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* System Information */}
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <Database className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">System Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-300">School ID:</span>
                            <span className="text-white font-mono">{schoolData?.id || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-300">Created:</span>
                            <span className="text-white">
                                {schoolData?.created_date ? new Date(schoolData.created_date).toLocaleDateString() : 'Unknown'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-300">Status:</span>
                            <span className={`${schoolData?.is_active ? 'text-green-400' : 'text-red-400'}`}>
                                {schoolData?.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-300">Total Users:</span>
                            <span className="text-white">{(schoolData?.total_students || 0) + (schoolData?.total_teachers || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-300">Storage Used:</span>
                            <span className="text-white">2.4 GB / 10 GB</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-300">Last Backup:</span>
                            <span className="text-white">Today, 3:00 AM</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
