import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// Lazy load the Layout component
const Layout = lazy(() => import('../../quiz/src/components/Layout'));

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#0a0e17] text-primary p-4">
          <h2 className="text-xl font-pixel mb-4">Something went wrong</h2>
          <p className="text-sm mb-4">{this.state.error?.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-md transition-colors"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ChatbotInterface: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Preserve any state passed through navigation
  const state = location.state || {};

  useEffect(() => {
    const loadChatbot = async () => {
      try {
        // Simulate loading the chatbot interface
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chatbot');
        setIsLoading(false);
      }
    };

    loadChatbot();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-pixel text-primary mb-4">Error Loading Chatbot</h2>
          <p className="text-sm text-primary/80 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-md transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e17]">
      {/* Header with back button */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e17]/80 backdrop-blur-sm border-b border-primary/20">
        <div className="container mx-auto px-4 py-3 flex items-center">
          <button
            onClick={() => navigate('/townsquare', { state })}
            className="flex items-center text-primary hover:text-primary/80 transition-colors"
            aria-label="Return to Townsquare"
          >
            <ArrowLeft size={20} className="mr-2" />
            <span className="font-pixel">Back to Townsquare</span>
          </button>
        </div>
      </div>

      {/* Chatbot Interface */}
      <div className="pt-16">
        {isLoading ? (
          <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <div className="animate-pulse-slow text-primary">
              <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              <p className="mt-4 font-pixel text-sm">Loading K.A.N.A...</p>
            </div>
          </div>
        ) : (
          <ErrorBoundary>
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                  <div className="animate-pulse-slow text-primary">
                    <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    <p className="mt-4 font-pixel text-sm">Loading Components...</p>
                  </div>
                </div>
              }
            >
              <Layout />
            </Suspense>
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}; 