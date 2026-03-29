import { Suspense, lazy } from 'react';
import { ProfileCustomizationModalProvider } from './contexts/ProfileCustomizationModalContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// Old landing sections (no longer used on marketing pages)
// import { SimpleHeader } from './components/SimpleHeader';
// import { HeaderSlideshow } from './components/HeaderSlideshow';
// import { WhoIsThisForSection } from './components/WhoIsThisForSection';
// import { MissionVisionSection } from './components/MissionVisionSection';
// import { FeaturesSection } from './components/FeaturesSection';
// import { PlatformComparisonTable } from './components/PlatformComparisonTable';
// import { TeamSection } from './components/TeamSection';
// import { JoinSection } from './components/JoinSection';
import { AudioProvider } from './components/shared/AudioManager';
import { SoundProvider } from './components/shared/SoundManager';
import { WalletProvider } from './components/shared/WalletContext';
import { AuthProvider } from './hooks/useAuth';
// Eagerly load the homepage (first paint)
import HomePage from './pages/marketing/HomePage';

// Lazy-load everything else for code-splitting
const SignUp = lazy(() => import('./pages/SignUp').then(m => ({ default: m.SignUp })));
const RoleSelection = lazy(() => import('./pages/RoleSelection').then(m => ({ default: m.RoleSelection })));
const SchoolLogin = lazy(() => import('./pages/SchoolLogin').then(m => ({ default: m.SchoolLogin })));
const TownSquare = lazy(() => import('./pages/TownSquare').then(m => ({ default: m.TownSquare })));
const StudentHub = lazy(() => import('./pages/StudentHub').then(m => ({ default: m.StudentHub })));
const MessagingPage = lazy(() => import('./pages/MessagingPage').then(m => ({ default: m.MessagingPage })));
const Achievements = lazy(() => import('./pages/Achievements'));
const Notifications = lazy(() => import('./pages/Notifications').then(m => ({ default: m.Notifications })));
const Friends = lazy(() => import('./pages/Friends').then(m => ({ default: m.Friends })));
const QuizInterface = lazy(() => import('./components/quiz/QuizInterface').then(m => ({ default: m.QuizInterface })));
const QuizPage = lazy(() => import('./pages/QuizPage').then(m => ({ default: m.QuizPage })));
const EnsureProfileCustomizedLayout = lazy(() => import('./components/EnsureProfileCustomizedLayout'));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard').then(m => ({ default: m.TeacherDashboard })));
const TeacherLogin = lazy(() => import('./pages/TeacherLogin').then(m => ({ default: m.TeacherLogin })));
const PrincipalLogin = lazy(() => import('./pages/PrincipalLogin').then(m => ({ default: m.PrincipalLogin })));
const PrincipalDashboardPage = lazy(() => import('./pages/PrincipalDashboardPage').then(m => ({ default: m.PrincipalDashboardPage })));
const InvitationsPage = lazy(() => import('./pages/InvitationsPage').then(m => ({ default: m.InvitationsPage })));
const PricingPage = lazy(() => import('./pages/marketing/PricingPage'));
const HelpCenterPage = lazy(() => import('./pages/marketing/HelpCenterPage'));
const OnboardingPage = lazy(() => import('./pages/marketing/OnboardingPage'));
const ContactUs = lazy(() => import('./pages/marketing/ContactUs'));
const GetStarted = lazy(() => import('./pages/GetStarted'));
const DashboardRedirect = lazy(() => import('./pages/DashboardRedirect'));
const TermsAndPrivacyPage = lazy(() => import('./pages/TermsAndPrivacyPage'));

export function App() {
  return (
    <ProfileCustomizationModalProvider>
      <AuthProvider>
        <SoundProvider>
          <AudioProvider>
            <WalletProvider>
              <Router>
                <div className="bg-white text-gray-900 min-h-screen w-full overflow-x-hidden" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
                  <Suspense fallback={<div className="min-h-screen bg-[#FAFAF8]" />}>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/dashboard" element={<DashboardRedirect />} />
                      <Route path="/get-started" element={<GetStarted />} />
                      <Route path="/pricing" element={<PricingPage />} />
                      <Route path="/help" element={<HelpCenterPage />} />
                      <Route path="/onboarding" element={<OnboardingPage />} />
                      <Route path="/contact" element={<ContactUs />} />
                      <Route path="/terms-and-privacy" element={<TermsAndPrivacyPage />} />
                      <Route path="/signup" element={<SignUp />} />
                      <Route path="/login" element={<SignUp />} />
                      <Route path="/school-login" element={<SchoolLogin />} />
                      <Route path="/role-selection" element={<RoleSelection />} />
                      <Route path="/invitations" element={<InvitationsPage />} />
                      <Route path="/teacher-login" element={<TeacherLogin />} />
                      <Route path="/principal-login" element={<PrincipalLogin />} />
                      {/* <Route path="/customize-profile" element={<CustomizeProfilePage />} /> */}
                      {/* Routes below require authentication and profile customization */}
                      <Route element={<EnsureProfileCustomizedLayout />}>
                        <Route path="/student-hub" element={<StudentHub />} />
                        <Route path="/townsquare" element={<TownSquare />} />
                        <Route path="/messages" element={<MessagingPage />} />
                        <Route path="/achievements" element={<Achievements />} />
                        <Route path="/notifications" element={<Notifications />} />
                        <Route path="/friends" element={<Friends />} />
                        <Route path="/quiz/math" element={<QuizInterface />} />
                        <Route path="/quiz/:quizId" element={<QuizPage />} />
                      </Route>
                      {/* Teacher Dashboard Route */}
                      <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
                      {/* Principal Dashboard Route */}
                      <Route path="/principal-dashboard" element={<PrincipalDashboardPage />} />
                    </Routes>
                  </Suspense>
                </div>
              </Router>
            </WalletProvider>
          </AudioProvider>
        </SoundProvider>
      </AuthProvider>
    </ProfileCustomizationModalProvider>
  );
}