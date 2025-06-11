import { useEffect, useState } from 'react';
import { ProfileCustomizationModalProvider } from './contexts/ProfileCustomizationModalContext';
import { ProfileCustomizationModal } from './components/modals/ProfileCustomizationModal';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HudNavigation } from './components/HudNavigation';
import { HeroSection } from './components/HeroSection';
import { KanaSection } from './components/KanaSection';
import { KnowledgeVerse } from './components/KnowledgeVerse';
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
import { TownSquare } from './pages/TownSquare';
import { MessagingPage } from './pages/MessagingPage';
import { WalletProvider } from './components/shared/WalletContext';
import { ChatbotInterface } from './pages/ChatbotInterface';
import Achievements from './pages/Achievements';
import { Notifications } from './pages/Notifications';
import { Friends } from './pages/Friends';
import { QuizInterface } from './components/quiz/QuizInterface';
import EnsureProfileCustomizedLayout from './components/EnsureProfileCustomizedLayout';
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
      <SoundProvider>
      <AudioProvider>
        <WalletProvider>
          <Router>
            <div className="bg-[#0a0a1a] text-white min-h-screen w-full overflow-x-hidden font-pixel">
              {isLoading ? (
                <LoadingScreen />
              ) : (
                <Routes>
                  <Route
                    path="/"
                    element={
                      <>
                        <HudNavigation />
                        <main className="relative w-full">
                          <HeroSection />
                          <KanaSection />
                          <KnowledgeVerse />
                          <QuestSection />
                          <ArenaSection />
                          <CreatorSection />
                          <TokenSection />
                          <InstitutionalSection />
                          <RoadmapSection />
                          <TeamSection />
                          <JoinSection />
                          <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
                            {Array.from({ length: 20 }).map((_, i) => (
                              <div
                                key={i}
                                className="absolute bg-blue-400 opacity-30 rounded-full animate-float"
                                style={{
                                  width: `${Math.random() * 10 + 5}px`,
                                  height: `${Math.random() * 10 + 5}px`,
                                  left: `${Math.random() * 100}%`,
                                  top: `${Math.random() * 100}%`,
                                  animationDuration: `${Math.random() * 10 + 10}s`,
                                  animationDelay: `${Math.random() * 5}s`,
                                }}
                              />
                            ))}
                          </div>
                        </main>
                      </>
                    }
                  />
                  <Route path="/signup" element={<SignUp />} />
                  {/* <Route path="/customize-profile" element={<CustomizeProfilePage />} /> */}
                  {/* Routes below require authentication and profile customization */}                 
                  <Route element={<EnsureProfileCustomizedLayout />}>
                    <Route path="/townsquare" element={<TownSquare />} />
                    <Route path="/messages" element={<MessagingPage />} />
                    <Route path="/chatbot" element={<ChatbotInterface />} />
                    <Route path="/achievements" element={<Achievements />} />
                                        <Route path="/notifications" element={<Notifications />} />
                    <Route path="/friends" element={<Friends />} />
                    <Route path="/quiz/math" element={<QuizInterface />} />
                  </Route>
                </Routes>
              )}
            </div>
          </Router>
        </WalletProvider>
      </AudioProvider>
    </SoundProvider>
    <ProfileCustomizationModal />
  </ProfileCustomizationModalProvider>
  );
}