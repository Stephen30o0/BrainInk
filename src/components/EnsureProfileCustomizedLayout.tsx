import React, { useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useProfileCustomizationModal } from '../contexts/ProfileCustomizationModalContext';

const EnsureProfileCustomizedLayout: React.FC = () => {
  const { openProfileModal } = useProfileCustomizationModal();
  const navigate = useNavigate();
  const location = useLocation();

  // Assumption: A token in localStorage indicates an authenticated user.
  // Adjust this check based on your actual authentication mechanism.
  const isAuthenticated = !!localStorage.getItem('access_token'); // Use 'access_token' as the token key

  useEffect(() => {
    if (isAuthenticated) {
      const profileIsCustomized = localStorage.getItem('profileCustomized') === 'true';

      // If profile is not customized
      if (!profileIsCustomized) {
        console.log('User profile not customized, opening modal.');
        openProfileModal();
        // No longer redirecting, the modal will handle customization.
        // The underlying page (e.g., /townsquare) will render, but the modal will be on top.
      }
    } else {
      // If not authenticated, and trying to access a page protected by this layout
      // (e.g., directly navigating to /townsquare without logging in),
      // redirect to the signup page.
      // Public routes like '/' and '/signup' are not wrapped by this layout.
      if (location.pathname !== '/signup') { // Ensure we are not already on a public route that doesn't need auth
        console.log('User not authenticated, redirecting to /signup');
        navigate('/signup', { replace: true }); 
      }
    }
  }, [isAuthenticated, location.pathname, navigate]);

  // Render child routes if checks pass or no redirection is needed
  return <Outlet />;
};

export default EnsureProfileCustomizedLayout;
