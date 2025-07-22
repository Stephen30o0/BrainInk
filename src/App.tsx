import { useEffect, useState } from 'react';
import { ProfileCustomizationModalProvider } from './contexts/ProfileCustomizationModalContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SimpleHeader } from './components/SimpleHeader';
import { HeaderSlideshow } from './components/HeaderSlideshow';
import { WhoIsThisForSection } from './components/WhoIsThisForSection';
import { MissionVisionSection } from './components/MissionVisionSection';
import { FeaturesSection } from './components/FeaturesSection';
import { HeroSection } from './components/HeroSection';
import { KanaSection } from './components/KanaSection';
import { PlatformComparisonTable } from './components/PlatformComparisonTable';
import { QuestSection } from './components/QuestSection';
import { ArenaSection } from './components/ArenaSection';
import { CreatorSection } from './components/CreatorSection';
import { TokenSection } from './components/TokenSection';
import { InstitutionalSection } from './components/InstitutionalSection';
import { RoadmapSection } from './components/RoadmapSection';
import { TeamSection } from './components/TeamSection';
import { JoinSection } from './components/JoinSection';
import { LoadingScreen } from './components/LoadingScreen';
import { AudioProvider } from './components/shared/AudioManager';
import { SoundProvider } from './components/shared/SoundManager';
import { SignUp } from './pages/SignUp';
import { RoleSelection } from './pages/RoleSelection';
import { SchoolLogin } from './pages/SchoolLogin';
import { TownSquare } from './pages/TownSquare';
import { MessagingPage } from './pages/MessagingPage';
import { WalletProvider } from './components/shared/WalletContext';
import Achievements from './pages/Achievements';
import { Notifications } from './pages/Notifications';
import { Friends } from './pages/Friends';
import { QuizInterface } from './components/quiz/QuizInterface';
import { QuizPage } from './pages/QuizPage';
import EnsureProfileCustomizedLayout from './components/EnsureProfileCustomizedLayout';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { TeacherLogin } from './pages/TeacherLogin';
import { PrincipalLogin } from './pages/PrincipalLogin';
import { PrincipalDashboardPage } from './pages/PrincipalDashboardPage';
import { InvitationsPage } from './pages/InvitationsPage';
import { AuthProvider } from './hooks/useAuth';
// CustomizeProfilePage will now be primarily rendered via the modal
// import { CustomizeProfilePage } from './pages/CustomizeProfilePage';

export function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ProfileCustomizationModalProvider>
      <AuthProvider>
        <SoundProvider>
          <AudioProvider>
            <WalletProvider>
              <Router>
                <div className="bg-white text-gray-900 min-h-screen w-full overflow-x-hidden font-pixel">
                  {isLoading ? (
                    <LoadingScreen />
                  ) : (
                    <Routes>
                      <Route
                        path="/"
                        element={
                          <>
                            <SimpleHeader />
                            <HeaderSlideshow />
                            <WhoIsThisForSection />
                            <MissionVisionSection />
                            <FeaturesSection />
                            <main className="relative w-full bg-white">
                              <PlatformComparisonTable />
                              <TeamSection />
                              <JoinSection />
                            </main>
                          </>
                        }
                      />
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
                  )}
                </div>
              </Router>
            </WalletProvider>
          </AudioProvider>
        </SoundProvider>
      </AuthProvider>
    </ProfileCustomizationModalProvider>
  );
}