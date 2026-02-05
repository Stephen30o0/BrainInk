import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardDestination } from '../utils/dashboardRouting';

const DashboardRedirect: React.FC = () => {
    const navigate = useNavigate();

    React.useEffect(() => {
        const destination = getDashboardDestination();
        navigate(destination, { replace: true });
    }, [navigate]);

    return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Redirecting to your dashboard...</p>
            </div>
        </div>
    );
};

export default DashboardRedirect;
