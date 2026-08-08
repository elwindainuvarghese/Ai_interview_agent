import React, { useState } from 'react';
import OriginalGithubUI from './components/OriginalGithubUI';
import LoginModal from './components/LoginModal';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('interviewer'); // 'interviewer' | 'admin'
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(true); // Open login modal on launch

  // Handle successful Firebase Google Auth or Instant Demo Login
  const handleAuthSuccess = ({ user, role }) => {
    setCurrentUser(user);
    setUserRole(role);
    setIsLoginModalOpen(false);
  };

  // Logout handler
  const handleLogout = () => {
    setCurrentUser(null);
    setUserRole('interviewer');
    setIsLoginModalOpen(true);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#02040a', color: '#ffffff' }}>
      {/* Auth Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Main Application Router */}
      {userRole === 'admin' && currentUser ? (
        <div style={{ padding: '2rem', maxWidth: '1440px', margin: '0 auto' }}>
          <AdminDashboard
            user={currentUser}
            onLogout={handleLogout}
            onSwitchToInterviewer={() => setUserRole('interviewer')}
          />
        </div>
      ) : (
        <OriginalGithubUI
          user={currentUser}
          userRole={userRole}
          onLogout={handleLogout}
          onSwitchRole={() => setUserRole('admin')}
        />
      )}
    </div>
  );
}
