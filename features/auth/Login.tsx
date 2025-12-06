import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../App';
import { Button, Card, Input, Modal } from '../../components/ui';
import { Eye, EyeOff, Database, Settings, Globe } from 'lucide-react';
import { api } from '../../services/api';
import { isUsingHardcodedKeys } from '../../services/firebase';
import { LOGO_URL } from '../../constants';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // DB Modal
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [dbConfig, setDbConfig] = useState({
      apiKey: '', authDomain: '', projectId: '', storageBucket: '', messagingSenderId: '', appId: ''
  });

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      setLoading(false);
      return;
    }

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/');
      } else {
        setError('Invalid credentials. Please check your email and password.');
      }
    } catch (error) {
      console.error(error);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDB = (e: React.FormEvent) => {
      e.preventDefault();
      localStorage.setItem('fh_firebase_config', JSON.stringify(dbConfig));
      alert("Database configuration saved! The page will now reload.");
      window.location.reload();
  };

  const isGlobal = isUsingHardcodedKeys();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      {/* Config Button for Mobile/New Devices - ONLY if NOT global */}
      {!isGlobal && (
        <div className="absolute top-4 right-4">
            <Button variant="ghost" onClick={() => setIsDbModalOpen(true)} className="text-slate-500">
                <Settings className="w-5 h-5 mr-2" /> Connect Database
            </Button>
        </div>
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-6">
           <img src={LOGO_URL} alt="INOVISTA" className="h-16 w-auto object-contain" />
        </div>
        <p className="mt-1 text-center text-sm text-slate-500 font-medium tracking-wide">Where Ideas Meet Innovation</p>
        <div className="mt-4 text-center text-sm">
             {isGlobal ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    <Globe className="w-3 h-3 mr-1" /> Global Cloud System
                </span>
             ) : api.isCloudMode() ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    <Database className="w-3 h-3 mr-1" /> Cloud Connected (Local Config)
                </span>
             ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    Local Dev Mode
                </span>
             )}
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="py-8 px-4 sm:px-10 border-0 shadow-lg">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email address
              </label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs font-medium text-sky-600 hover:text-sky-500">
                      Forgot Password?
                  </Link>
              </div>
              <div className="mt-1 relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                {error}
              </div>
            )}

            <div>
              <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700" disabled={loading}>
                {loading ? 'Authenticating...' : 'Sign in'}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-slate-500">Don't have an account? </span>
            <Link to="/register" className="font-medium text-sky-600 hover:text-sky-500">
              Sign up
            </Link>
          </div>
        </Card>
      </div>

      <Modal isOpen={isDbModalOpen} onClose={() => setIsDbModalOpen(false)} title="Connect to Database">
          <p className="text-sm text-slate-500 mb-4">
              Enter your Firebase configuration keys here to sync data across devices. 
              You can find these in your Firebase Console {'>'} Project Settings.
          </p>
          <form onSubmit={handleSaveDB} className="space-y-3">
              <Input required value={dbConfig.apiKey} onChange={e => setDbConfig({...dbConfig, apiKey: e.target.value})} placeholder="API Key" />
              <Input required value={dbConfig.authDomain} onChange={e => setDbConfig({...dbConfig, authDomain: e.target.value})} placeholder="Auth Domain" />
              <Input required value={dbConfig.projectId} onChange={e => setDbConfig({...dbConfig, projectId: e.target.value})} placeholder="Project ID" />
              <Input required value={dbConfig.storageBucket} onChange={e => setDbConfig({...dbConfig, storageBucket: e.target.value})} placeholder="Storage Bucket" />
              <Input required value={dbConfig.messagingSenderId} onChange={e => setDbConfig({...dbConfig, messagingSenderId: e.target.value})} placeholder="Messaging Sender ID" />
              <Input required value={dbConfig.appId} onChange={e => setDbConfig({...dbConfig, appId: e.target.value})} placeholder="App ID" />
              
              <div className="pt-2 flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setIsDbModalOpen(false)}>Cancel</Button>
                  <Button type="submit">Save & Connect</Button>
              </div>
          </form>
      </Modal>
    </div>
  );
};

export default Login;