import React, { useState } from 'react';
import { MarketingHeader } from '../../components/marketing/MarketingHeader';
import { MarketingFooter } from '../../components/marketing/MarketingFooter';
import { Users, GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react';

interface Step {
    image: string;
    title: string;
    description: string;
}

const teacherSteps: Step[] = [
    {
        image: '/new_for_images/join.png',
        title: 'Join BrainInk',
        description: 'Start by navigating to the BrainInk platform and click on the "Join" button to begin your registration process.'
    },
    {
        image: '/new_for_images/school_portal.png',
        title: 'Access School Portal',
        description: 'Enter the school portal where you\'ll be able to access all the educational tools and resources.'
    },
    {
        image: '/new_for_images/choose_school.png',
        title: 'Choose Your School',
        description: 'Select your school from the list of available institutions to connect with your educational environment.'
    },
    {
        image: '/new_for_images/choose_role.png',
        title: 'Choose Your Role',
        description: 'Select "Teacher" as your role to access teacher-specific features and dashboard.'
    },
    {
        image: '/new_for_images/final_email.png',
        title: 'Complete Email Verification',
        description: 'Check your email and complete the verification process to activate your teacher account.'
    },
    {
        image: '/new_for_images/dashboard.png',
        title: 'Teacher Dashboard',
        description: 'Welcome to your teacher dashboard! Here you can manage classes, assignments, and student progress.'
    },
    {
        image: '/new_for_images/grade1.png',
        title: 'Start Grading - Step 1',
        description: 'Begin the grading process by selecting the assignment or student work you want to evaluate.'
    },
    {
        image: '/new_for_images/grade2.png',
        title: 'Grading Process - Step 2',
        description: 'Use the grading tools to provide feedback and scores for student submissions.'
    },
    {
        image: '/new_for_images/grade3.png',
        title: 'Detailed Grading - Step 3',
        description: 'Add detailed comments and rubric-based feedback to help students improve their work.'
    },
    {
        image: '/new_for_images/upload.png',
        title: 'Upload Assignments',
        description: 'Upload new assignments, materials, or resources for your students to access and complete.'
    },
    {
        image: '/new_for_images/grade4.png',
        title: 'Final Grade Review',
        description: 'Review and finalize grades before publishing them to students and parents.'
    }
];

const studentSteps: Step[] = [
    {
        image: '/new_for_images/join.png',
        title: 'Join BrainInk',
        description: 'Start by navigating to the BrainInk platform and click on the "Join" button to begin your registration process.'
    },
    {
        image: '/new_for_images/studentsportal.png',
        title: 'Access Student Portal',
        description: 'Enter the student portal where you\'ll find all your assignments, grades, and learning materials.'
    },
    {
        image: '/new_for_images/study1.png',
        title: 'Begin Studying',
        description: 'Access your course materials, assignments, and start your learning journey with organized study resources.'
    },
    {
        image: '/new_for_images/study2.png',
        title: 'Track Your Progress',
        description: 'Monitor your academic progress, view grades, and see feedback from your teachers to improve your learning.'
    }
];

const OnboardingSteps: React.FC<{
    steps: Step[],
    accountType: string,
    username: string,
    password: string
}> = ({ steps, accountType, username, password }) => {
    const [currentStep, setCurrentStep] = useState(0);

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Account Credentials */}
            <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-blue-50 rounded-xl border border-blue-200">
                <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-3">Test Account Credentials</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                        <span className="text-xs sm:text-sm font-medium text-blue-700">Username:</span>
                        <p className="font-mono text-sm sm:text-base text-blue-900 bg-white px-2 sm:px-3 py-2 rounded border break-all">{username}</p>
                    </div>
                    <div>
                        <span className="text-xs sm:text-sm font-medium text-blue-700">Password:</span>
                        <p className="font-mono text-sm sm:text-base text-blue-900 bg-white px-2 sm:px-3 py-2 rounded border break-all">{password}</p>
                    </div>
                </div>
            </div>

            {/* Step Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-slate-900 leading-tight">
                    <span className="block sm:inline">{accountType} Onboarding</span>
                    <span className="block sm:inline sm:ml-2 text-base sm:text-lg lg:text-xl">
                        Step {currentStep + 1} of {steps.length}
                    </span>
                </h3>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                        onClick={prevStep}
                        disabled={currentStep === 0}
                        className="p-2 sm:p-3 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={20} className="sm:w-5 sm:h-5" />
                    </button>
                    <button
                        onClick={nextStep}
                        disabled={currentStep === steps.length - 1}
                        className="p-2 sm:p-3 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight size={20} className="sm:w-5 sm:h-5" />
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6 sm:mb-8">
                <div className="flex justify-between text-xs sm:text-sm text-slate-500 mb-2">
                    <span>Progress</span>
                    <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 sm:h-3">
                    <div
                        className="bg-blue-600 h-2 sm:h-3 rounded-full transition-all duration-300"
                        style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Current Step Content */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 lg:p-8 shadow-sm">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
                    <div className="order-2 xl:order-1">
                        <h4 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-slate-900 mb-3 sm:mb-4 leading-tight">
                            {steps[currentStep].title}
                        </h4>
                        <p className="text-slate-600 leading-relaxed text-sm sm:text-base lg:text-lg">
                            {steps[currentStep].description}
                        </p>
                    </div>
                    <div className="order-1 xl:order-2">
                        <div className="relative">
                            <img
                                src={steps[currentStep].image}
                                alt={steps[currentStep].title}
                                className="w-full h-auto rounded-lg shadow-lg border border-slate-200 max-h-[400px] sm:max-h-[500px] lg:max-h-[600px] xl:max-h-[700px] object-contain"
                                onError={(e) => {
                                    console.error(`Failed to load image: ${steps[currentStep].image}`);
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Step Indicators */}
            <div className="flex justify-center mt-6 sm:mt-8 gap-1 sm:gap-2 flex-wrap">
                {steps.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentStep(index)}
                        className={`w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 rounded-full transition-colors ${index === currentStep
                            ? 'bg-blue-600'
                            : index < currentStep
                                ? 'bg-blue-300'
                                : 'bg-slate-300'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};

export const OnboardingPage: React.FC = () => {
    const [selectedRole, setSelectedRole] = useState<'teacher' | 'student' | null>(null);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <MarketingHeader />

            <div className="pt-20 sm:pt-24 lg:pt-28 pb-12 sm:pb-16">
                <div className="max-w-8xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
                    {/* Page Header */}
                    <div className="text-center mb-8 sm:mb-12 lg:mb-16">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-slate-900 mb-3 sm:mb-4 lg:mb-6 leading-tight">
                            Platform Onboarding Guide
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-600 max-w-4xl lg:max-w-5xl mx-auto leading-relaxed px-4">
                            Learn how to use BrainInk with our step-by-step visual guide.
                            Choose your role below to get started with a test account.
                        </p>
                    </div>

                    {!selectedRole ? (
                        /* Role Selection */
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 max-w-6xl mx-auto">
                            <button
                                onClick={() => setSelectedRole('teacher')}
                                className="group p-6 sm:p-8 lg:p-10 xl:p-12 bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg hover:shadow-blue-100/50 hover:scale-[1.02] transform"
                            >
                                <div className="text-center">
                                    <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-blue-100 rounded-full mb-4 sm:mb-6 group-hover:bg-blue-200 transition-colors">
                                        <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-blue-600" />
                                    </div>
                                    <h3 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-semibold text-slate-900 mb-2 sm:mb-3 lg:mb-4">Teacher Guide</h3>
                                    <p className="text-slate-600 mb-4 sm:mb-6 text-sm sm:text-base lg:text-lg leading-relaxed px-2">
                                        Learn how to manage classrooms, grade assignments, and track student progress.
                                    </p>
                                    <div className="text-sm sm:text-base lg:text-lg text-blue-600 font-medium">
                                        11 guided steps →
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => setSelectedRole('student')}
                                className="group p-6 sm:p-8 lg:p-10 xl:p-12 bg-white rounded-2xl border-2 border-slate-200 hover:border-green-300 transition-all duration-300 hover:shadow-lg hover:shadow-green-100/50 hover:scale-[1.02] transform"
                            >
                                <div className="text-center">
                                    <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-green-100 rounded-full mb-4 sm:mb-6 group-hover:bg-green-200 transition-colors">
                                        <Users className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-green-600" />
                                    </div>
                                    <h3 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-semibold text-slate-900 mb-2 sm:mb-3 lg:mb-4">Student Guide</h3>
                                    <p className="text-slate-600 mb-4 sm:mb-6 text-sm sm:text-base lg:text-lg leading-relaxed px-2">
                                        Discover how to access assignments, submit work, and track your academic progress.
                                    </p>
                                    <div className="text-sm sm:text-base lg:text-lg text-green-600 font-medium">
                                        4 guided steps →
                                    </div>
                                </div>
                            </button>
                        </div>
                    ) : (
                        /* Onboarding Steps */
                        <div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 lg:mb-12 gap-3 sm:gap-0">
                                <button
                                    onClick={() => setSelectedRole(null)}
                                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors text-sm sm:text-base lg:text-lg px-3 py-2 rounded-lg hover:bg-slate-100 self-start"
                                >
                                    <ChevronLeft size={18} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                                    Back to role selection
                                </button>
                            </div>

                            {selectedRole === 'teacher' && (
                                <OnboardingSteps
                                    steps={teacherSteps}
                                    accountType="Teacher"
                                    username="Teacher1"
                                    password="password123"
                                />
                            )}

                            {selectedRole === 'student' && (
                                <OnboardingSteps
                                    steps={studentSteps}
                                    accountType="Student"
                                    username="Testuser1"
                                    password="password123"
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>

            <MarketingFooter />
        </div>
    );
};

export default OnboardingPage;
