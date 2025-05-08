import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Components
import Layout from './components/layout/Layout';

// Pages
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Profile from './components/auth/Profile';
import ChatRoom from './components/chat/ChatRoom';
import CreateRoom from './components/chat/CreateRoom';
import PrivateChat from './components/chat/PrivateChat';
import UserDirectory from './components/chat/UserDirectory';
import Friends from './components/friends/Friends';
import Home from './pages/Home';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={
              <Layout fullWidth>
                <Login />
              </Layout>
            } />
            
            <Route path="/register" element={
              <Layout fullWidth>
                <Register />
              </Layout>
            } />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <Layout requireAuth>
                <Home />
              </Layout>
            } />
            
            <Route path="/profile" element={
              <Layout requireAuth>
                <Profile />
              </Layout>
            } />
            
            <Route path="/chat-room/:roomId" element={
              <Layout requireAuth>
                <ChatRoom />
              </Layout>
            } />
            
            <Route path="/create-room" element={
              <Layout requireAuth>
                <CreateRoom />
              </Layout>
            } />
            
            <Route path="/private-chat/:chatId" element={
              <Layout requireAuth>
                <PrivateChat />
              </Layout>
            } />
            
            <Route path="/users" element={
              <Layout requireAuth>
                <UserDirectory />
              </Layout>
            } />

            <Route path="/friends" element={
              <Layout requireAuth>
                <Friends />
              </Layout>
            } />
            
            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          <ToastContainer position="top-right" theme="colored" />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;