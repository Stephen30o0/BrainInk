import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { GraduationCapIcon, ShieldCheckIcon, ArrowRightIcon, MailIcon, BuildingIcon, ArrowLeftIcon, BellIcon } from 'lucide-react';
import { schoolSelectionService, School } from '../services/schoolSelectionService';

const RoleSelection = () => {
    const [currentStep, setCurrentStep] = useState<'loading' | 'school' | 'role' | 'email'>('loading');
    const [availableSchools, setAvailableSchools] = useState<School[]>([]);
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
    const [selectedRole, setSelectedRole] = useState<'teacher' | 'principal' | null>(null);
    const [userEmail, setUserEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { user } = useAuth();

    // Load available schools on component mount
    useEffect(() => {
        loadAvailableSchools();
    }, []);

    const loadAvailableSchools = async () => {
        try {
            setError('');
            const schools = await schoolSelectionService.getAvailableSchools();

            if (schools && schools.length > 0) {
                setAvailableSchools(schools);
                setCurrentStep('school');
            } else {
                setError('No schools available for your account. Please contact your administrator.');
                setCurrentStep('school');
            }
        } catch (error) {
            console.error('Error loading schools:', error);
            setError('Unable to load schools. Please try again or contact support.');
            setCurrentStep('school');
        }
    };

    const handleSchoolSelect = (school: School) => {
        setSelectedSchool(school);
        setCurrentStep('role');
    };

    const handleRoleSelect = (role: 'teacher' | 'principal') => {
        setSelectedRole(role);
        setCurrentStep('email');
        // Pre-fill email if available from user context
        if (user?.email) {
            setUserEmail(user.email);
        }
    };

    const handleConfirmSelection = async () => {
        if (!selectedSchool || !selectedRole || !userEmail) {
            setError('Please complete all steps: select school, role, and enter your email');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            let response;

            if (selectedRole === 'principal') {
                response = await schoolSelectionService.selectSchoolAsPrincipal(selectedSchool.id, userEmail);
            } else {
                response = await schoolSelectionService.selectSchoolAsTeacher(selectedSchool.id, userEmail);
            }

            if (response.success) {
                // Store the confirmed selection
                schoolSelectionService.storeSchoolAndRole(
                    response.school_id || selectedSchool.id,
                    response.school_name || selectedSchool.name,
                    (response.role || selectedRole) as 'principal' | 'teacher'
                );

                // Navigate to appropriate dashboard
                if (selectedRole === 'principal') {
                    navigate('/principal-dashboard');
                } else {
                    navigate('/teacher-dashboard');
                }
            } else {
                setError(response.message || 'Failed to confirm role selection');
            }
        } catch (error: any) {
            console.error('Error confirming selection:', error);
            setError(error.message || 'Failed to confirm your selection. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const roles = [
        {
            id: 'teacher' as const,
            title: 'Teacher',
            description: 'Manage classes, create assignments, and monitor student progress',
            icon: GraduationCapIcon,
            color: 'from-green-500 to-teal-600'
        },
        {
            id: 'principal' as const,
            title: 'Principal',
            description: 'Oversee school operations, manage teachers, and view analytics',
            icon: ShieldCheckIcon,
            color: 'from-purple-500 to-pink-600'
        }
    ];

    if (currentStep === 'loading') {
        return (
            <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-lg">Loading available schools...</p>
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
                        {currentStep === 'school' && 'Select Your School'}
                        {currentStep === 'role' && 'Choose Your Role'}
                        {currentStep === 'email' && 'Confirm Your Email'}
                    </h1>
                    <p className="text-xl text-gray-300">
                        {currentStep === 'school' && 'Choose the school you work at'}
                        {currentStep === 'role' && `Select your role at ${selectedSchool?.name}`}
                        {currentStep === 'email' && `Confirm your email for ${selectedRole} at ${selectedSchool?.name}`}
                    </p>
                    {user && (
                        <p className="text-lg text-blue-400 mt-2">
                            Hello, {user.name}!
                        </p>
                    )}
                </div>

                {/* Progress Indicator */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center space-x-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep === 'school' ? 'bg-blue-500 text-white' :
                            ['role', 'email'].includes(currentStep) ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'
                            }`}>1</div>
                        <div className={`w-8 border-t-2 ${['role', 'email'].includes(currentStep) ? 'border-green-500' : 'border-gray-600'
                            }`}></div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep === 'role' ? 'bg-blue-500 text-white' :
                            currentStep === 'email' ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'
                            }`}>2</div>
                        <div className={`w-8 border-t-2 ${currentStep === 'email' ? 'border-green-500' : 'border-gray-600'
                            }`}></div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep === 'email' ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-300'
                            }`}>3</div>
                    </div>
                </div>

                {/* Check Invitations Button */}
                <div className="flex justify-center mb-6">
                    <button
                        onClick={() => navigate('/invitations')}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg hover:from-green-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-105"
                    >
                        <BellIcon className="w-5 h-5" />
                        Check School Invitations
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
                        <p className="text-red-300 text-center">{error}</p>
                    </div>
                )}

                {/* School Selection */}
                {currentStep === 'school' && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {availableSchools.map((school) => (
                            <div
                                key={school.id}
                                onClick={() => handleSchoolSelect(school)}
                                className="relative cursor-pointer transition-all duration-300 transform hover:scale-105 hover:ring-2 hover:ring-blue-300"
                            >
                                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 h-full">
                                    {/* School Icon */}
                                    <div className="w-16 h-16 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mb-4 mx-auto">
                                        <BuildingIcon className="w-8 h-8 text-white" />
                                    </div>

                                    {/* Content */}
                                    <div className="text-center">
                                        <h3 className="text-xl font-semibold text-white mb-2">
                                            {school.name}
                                        </h3>
                                        {school.address && (
                                            <p className="text-gray-400 text-sm">
                                                {school.address}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Role Selection */}
                {currentStep === 'role' && (
                    <>
                        {/* Back to School Selection */}
                        <div className="mb-6">
                            <button
                                onClick={() => setCurrentStep('school')}
                                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                            >
                                <ArrowLeftIcon className="w-4 h-4" />
                                Back to school selection
                            </button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                            {roles.map((role) => {
                                const Icon = role.icon;

                                return (
                                    <div
                                        key={role.id}
                                        onClick={() => handleRoleSelect(role.id)}
                                        className="relative cursor-pointer transition-all duration-300 transform hover:scale-105 hover:ring-2 hover:ring-blue-300"
                                    >
                                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 h-full">
                                            {/* Icon */}
                                            <div className={`w-16 h-16 rounded-lg bg-gradient-to-r ${role.color} flex items-center justify-center mb-4 mx-auto`}>
                                                <Icon className="w-8 h-8 text-white" />
                                            </div>

                                            {/* Content */}
                                            <div className="text-center">
                                                <h3 className="text-xl font-semibold text-white mb-2">
                                                    {role.title}
                                                </h3>
                                                <p className="text-gray-400 text-sm">
                                                    {role.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* Email Confirmation */}
                {currentStep === 'email' && (
                    <>
                        {/* Back to Role Selection */}
                        <div className="mb-6">
                            <button
                                onClick={() => setCurrentStep('role')}
                                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                            >
                                <ArrowLeftIcon className="w-4 h-4" />
                                Back to role selection
                            </button>
                        </div>

                        <div className="max-w-md mx-auto mb-8">
                            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mb-4 mx-auto">
                                        <MailIcon className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-2">
                                        Confirm Your Email
                                    </h3>
                                    <p className="text-gray-400 text-sm">
                                        Enter your email address to confirm your selection
                                    </p>
                                </div>

                                <input
                                    type="email"
                                    value={userEmail}
                                    onChange={(e) => setUserEmail(e.target.value)}
                                    placeholder="Enter your email address"
                                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 mb-4"
                                />

                                {/* Selection Summary */}
                                <div className="bg-gray-700/30 rounded-lg p-4 mb-4">
                                    <h4 className="text-white font-semibold mb-2">Selection Summary:</h4>
                                    <p className="text-gray-300 text-sm">School: {selectedSchool?.name}</p>
                                    <p className="text-gray-300 text-sm">Role: {selectedRole}</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Continue/Confirm Button */}
                {currentStep === 'email' && (
                    <div className="flex justify-center">
                        <button
                            onClick={handleConfirmSelection}
                            disabled={!userEmail || isLoading}
                            className={`
                                flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg
                                transition-all duration-300 transform
                                ${userEmail && !isLoading
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:scale-105 hover:shadow-xl'
                                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                }
                            `}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Confirming selection...
                                </>
                            ) : (
                                <>
                                    Confirm Selection
                                    <ArrowRightIcon className="w-5 h-5" />
                                </>
                            )}
                        </button>
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

export { RoleSelection };
