import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PrincipalDashboard } from '../components/principal/PrincipalDashboard';
import { schoolSelectionService } from '../services/schoolSelectionService';

export const PrincipalDashboardPage = () => {
    const navigate = useNavigate();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        const checkAuthorization = async () => {
            try {
                // Check if user is logged in
                const accessToken = localStorage.getItem('access_token'); if (!accessToken) {
                    setIsAuthorized(false);
                    navigate('/school-login', { replace: true });
                    return;
                }

                // Check if user has confirmed school and role
                const schoolRoleInfo = schoolSelectionService.getStoredSchoolRole();

                if (!schoolRoleInfo.confirmed || schoolRoleInfo.role !== 'principal') {
                    console.log('❌ Principal role not confirmed, redirecting to role selection');
                    setIsAuthorized(false);
                    // Clear any stale data and redirect to role selection
                    schoolSelectionService.clearSchoolRole();
                    navigate('/role-selection', { replace: true });
                    return;
                }

                setIsAuthorized(true);
            } catch (error) {
                console.error('Error checking authorization:', error);
                setIsAuthorized(false);
                navigate('/school-login', { replace: true });
            }
        };

        checkAuthorization();
    }, [navigate]);

    // Show loading while checking authorization
    if (isAuthorized === null) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white font-pixel">Verifying Access...</p>
                </div>
            </div>
        );
    }

    // Show access denied if not authorized
    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
                <div className="text-center bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-8 max-w-md">
                    <div className="text-yellow-400 text-6xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold text-white mb-4 font-pixel">Access Error</h2>
                    <p className="text-gray-300 mb-6 font-pixel">Principal role required.</p>
                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/principal-dashboard')}
                            className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-pixel"
                        >
                            Back to Dashboard
                        </button>
                        <button
                            onClick={() => navigate('/role-selection')}
                            className="w-full px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-pixel"
                        >
                            Role Selection
                        </button>
                        <button
                            onClick={() => {
                                console.log('🧹 Logging out and clearing data');
                                localStorage.clear();
                                navigate('/school-login');
                            }}
                            className="w-full px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-pixel"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Render the principal dashboard
    return <PrincipalDashboard />;
};
