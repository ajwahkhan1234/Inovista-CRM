import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../App';
import { Button, Card, Input, Select } from '../../components/ui';
import { api } from '../../services/api';
import { Role } from '../../types';
import { LOGO_URL } from '../../constants';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('CLIENT');
  const [securityPin, setSecurityPin] = useState('');
  
  // Security Questions
  const [securityQuestion, setSecurityQuestion] = useState('What is your favorite color?');
  const [securityAnswer, setSecurityAnswer] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      setLoading(false);
      return;
    }

    if (role === 'ADMIN' && securityPin !== '5557172') {
        setError('Invalid Security PIN for Admin.');
        setLoading(false);
        return;
    }

    if (role === 'TEAM' && securityPin !== '5557172') {
        setError('Invalid Security PIN for Team Member.');
        setLoading(false);
        return;
    }

    if (!securityAnswer.trim()) {
        setError('Security Answer is required for password recovery.');
        setLoading(false);
        return;
    }

    try {
      await api.register(name, email, password, role, securityPin, securityQuestion, securityAnswer);
      // Auto login after register
      const success = await login(email, password);
      if (success) {
        navigate('/');
      } else {
        navigate('/login');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-6">
           <img src={LOGO_URL} alt="INOVISTA" className="h-16 w-auto object-contain" />
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-slate-900">Create Account</h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Get started with INOVISTA today
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="py-8 px-4 sm:px-10 border-0 shadow-lg">
          <form className="space-y-6" onSubmit={handleRegister}>
            <div>
              <label className="block text-sm font-medium text-slate-700">Full Name</label>
              <div className="mt-1">
                <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Email address</label>
              <div className="mt-1">
                <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Account Type</label>
                  <div className="mt-1">
                    <Select value={role} onChange={e => setRole(e.target.value as Role)}>
                        <option value="CLIENT">Client</option>
                        <option value="TEAM">Team Member</option>
                        <option value="ADMIN">Admin</option>
                    </Select>
                  </div>
                </div>
                {(role === 'ADMIN' || role === 'TEAM') && (
                    <div>
                        <label className="block text-sm font-medium text-sky-600">
                            {role === 'ADMIN' ? 'Admin PIN' : 'Team PIN'}
                        </label>
                        <div className="mt-1">
                            <Input 
                                required 
                                type="password" 
                                value={securityPin} 
                                onChange={e => setSecurityPin(e.target.value)} 
                                placeholder="Security PIN"
                                className="border-sky-300 ring-sky-200"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <div className="mt-1">
                <Input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
              <div className="mt-1">
                <Input required type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 mt-4">
                <h3 className="text-sm font-medium text-slate-900 mb-3">Security & Recovery</h3>
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Security Question</label>
                        <Select value={securityQuestion} onChange={e => setSecurityQuestion(e.target.value)}>
                            <option value="What is your favorite color?">What is your favorite color?</option>
                            <option value="What was the name of your first pet?">What was the name of your first pet?</option>
                            <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                            <option value="What city were you born in?">What city were you born in?</option>
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Answer</label>
                        <Input required value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)} placeholder="e.g. Blue" />
                    </div>
                </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                {error}
              </div>
            )}

            <div>
              <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700" disabled={loading}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-slate-500">Already have an account? </span>
            <Link to="/login" className="font-medium text-sky-600 hover:text-sky-500">
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Register;