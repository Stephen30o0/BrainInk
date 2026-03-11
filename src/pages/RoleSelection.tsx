import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { GraduationCapIcon, ShieldCheckIcon, ArrowRightIcon, BuildingIcon, ArrowLeftIcon, BellIcon } from 'lucide-react';
import { schoolSelectionService, School } from '../services/schoolSelectionService';

const RoleSelection = () => {
    const [currentStep, setCurrentStep] = useState<'loading' | 'school' | 'role'>('loading');
    const [availableSchools, setAvailableSchools] = useState<School[]>([]);
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
    const [selectedRole, setSelectedRole] = useState<'teacher' | 'principal' | null>(null);
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

    const handleRoleSelect = async (role: 'teacher' | 'principal') => {
        setSelectedRole(role);

        if (!selectedSchool) {
            setError('Please select a school first');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            let response;
            const email = user?.email || '';

            if (role === 'principal') {
                response = await schoolSelectionService.selectSchoolAsPrincipal(selectedSchool.id, email);
            } else {
                response = await schoolSelectionService.selectSchoolAsTeacher(selectedSchool.id, email);
            }

            if (response.success) {
                // Store the confirmed selection
                schoolSelectionService.storeSchoolAndRole(
                    response.school_id || selectedSchool.id,
                    response.school_name || selectedSchool.name,
                    (response.role || role) as 'principal' | 'teacher'
                );

                // Navigate to appropriate dashboard
                if (role === 'principal') {
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
            <div className="min-h-[100dvh] bg-[#FAFAF8] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-stone-600 text-sm">Loading available schools...</p>
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
                    <span className="inline-block text-xs font-mono uppercase tracking-widest text-stone-400 mb-4">Setup</span>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-stone-900 mb-3">
                        {currentStep === 'school' && 'Select Your School'}
                        {currentStep === 'role' && 'Choose Your Role'}
                    </h1>
                    <p className="text-lg text-stone-500">
                        {currentStep === 'school' && 'Choose the school you work at to continue.'}
                        {currentStep === 'role' && `Select your role at ${selectedSchool?.name}.`}
                    </p>
                    {user && (
                        <p className="text-sm text-blue-600 mt-2 font-medium">
                            Signed in as {user.name}
                        </p>
                    )}
                </div>

                {/* Progress Indicator */}
                <div className="flex items-center gap-3 mb-8">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                        currentStep === 'school' ? 'bg-stone-900 text-white' : 'bg-emerald-500 text-white'
                    }`}>1</div>
                    <div className={`h-px w-8 ${currentStep === 'role' ? 'bg-emerald-400' : 'bg-stone-200'}`} />
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                        currentStep === 'role' ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-500'
                    }`}>2</div>
                </div>

                {/* Check Invitations */}
                <button
                    onClick={() => navigate('/invitations')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-50 transition-colors text-sm font-medium mb-8"
                >
                    <BellIcon className="w-4 h-4" />
                    Check School Invitations
                </button>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                        <p className="text-red-700 text-sm text-center">{error}</p>
                    </div>
                )}

                {/* School Selection */}
                {currentStep === 'school' && (
                    <div className="space-y-3 mb-8">
                        {availableSchools.map((school) => (
                            <div
                                key={school.id}
                                onClick={() => handleSchoolSelect(school)}
                                className="group bg-white rounded-2xl p-6 border border-stone-200 cursor-pointer hover:border-stone-400 hover:shadow-md transition-all active:scale-[0.99]"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-100 transition-colors">
                                        <BuildingIcon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-stone-900 truncate">
                                            {school.name}
                                        </h3>
                                        {school.address && (
                                            <p className="text-sm text-stone-500 truncate">{school.address}</p>
                                        )}
                                    </div>
                                    <ArrowRightIcon className="w-5 h-5 text-stone-300 group-hover:text-stone-600 transition-colors shrink-0" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Role Selection */}
                {currentStep === 'role' && (
                    <>
                        <button
                            onClick={() => setCurrentStep('school')}
                            className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors text-sm mb-6"
                        >
                            <ArrowLeftIcon className="w-4 h-4" />
                            Back to school selection
                        </button>

                        <div className="grid md:grid-cols-2 gap-4 mb-8">
                            {roles.map((role) => {
                                const Icon = role.icon;
                                return (
                                    <div
                                        key={role.id}
                                        onClick={() => handleRoleSelect(role.id)}
                                        className="group bg-white rounded-2xl p-8 border border-stone-200 cursor-pointer hover:border-stone-400 hover:shadow-md transition-all active:scale-[0.99]"
                                    >
                                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-colors ${
                                            role.id === 'teacher' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
                                        }`}>
                                            <Icon className="w-7 h-7" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-stone-900 mb-2">{role.title}</h3>
                                        <p className="text-stone-500 text-sm leading-relaxed">{role.description}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* Loading indicator when confirming role */}
                {isLoading && (
                    <div className="flex justify-center mb-6">
                        <div className="flex items-center gap-3 px-6 py-3 bg-stone-900 text-white rounded-xl text-sm font-medium">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Confirming selection...
                        </div>
                    </div>
                )}

                {/* Back to Login */}
                <div className="pt-8 border-t border-stone-200 text-center">
                    <button
                        onClick={() => navigate('/school-login')}
                        className="text-stone-500 hover:text-stone-900 transition-colors text-sm"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export { RoleSelection };
