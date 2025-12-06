
import React, { createContext, useContext, useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import ForgotPassword from './features/auth/ForgotPassword';
import ResetPassword from './features/auth/ResetPassword';
import Dashboard from './features/dashboard/Dashboard';
import ProjectList from './features/projects/ProjectList';
import ProjectDetail from './features/projects/ProjectDetail';
import ClientList from './features/clients/ClientList';
import Settings from './features/settings/Settings';
import Inbox from './features/messages/Inbox';
import { User, AuthState } from './types';
import { api } from './services/api';

// --- Auth Context ---
interface AuthContextType extends AuthState {
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

// --- Protected Route ---
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Layout>{children}</Layout>;
};

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({ user: null, isAuthenticated: false });

  // Check storage on load
  useEffect(() => {
    const storedUser = localStorage.getItem('fh_session');
    if (storedUser) {
      setAuth({ user: JSON.parse(storedUser), isAuthenticated: true });
    }
  }, []);

  const login = async (email: string, password?: string) => {
    const user = await api.login(email, password);
    if (user) {
      setAuth({ user, isAuthenticated: true });
      localStorage.setItem('fh_session', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setAuth({ user: null, isAuthenticated: false });
    localStorage.removeItem('fh_session');
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/projects" element={
            <ProtectedRoute>
              <ProjectList />
            </ProtectedRoute>
          } />

          <Route path="/projects/:id" element={
            <ProtectedRoute>
              <ProjectDetail />
            </ProtectedRoute>
          } />

          <Route path="/clients" element={
            <ProtectedRoute>
              {auth.user?.role === 'ADMIN' ? <ClientList /> : <Navigate to="/" />}
            </ProtectedRoute>
          } />

          <Route path="/messages" element={
            <ProtectedRoute>
              <Inbox />
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              {auth.user?.role === 'ADMIN' ? <Settings /> : <Navigate to="/" />}
            </ProtectedRoute>
          } />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
};

export default App;
