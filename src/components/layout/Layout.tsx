import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  fullWidth?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, requireAuth = false, fullWidth = false }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  // Check if user is authenticated when page requires auth
  if (requireAuth && !loading && !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      <Header />
      
      <div className="flex flex-1 pt-16">
        {!fullWidth && currentUser && (
          <div className="hidden md:block md:w-64 flex-shrink-0">
            <Sidebar />
          </div>
        )}
        
        <main className={`flex-1 ${!fullWidth ? 'p-4' : ''} overflow-auto`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;