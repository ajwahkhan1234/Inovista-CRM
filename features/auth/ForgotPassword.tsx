
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Input } from '../../components/ui';
import { api } from '../../services/api';
import { Mail, ArrowLeft, Shield, CheckCircle } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: Security Q, 3: Success
  const [email, setEmail] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const q = await api.getSecurityQuestion(email);
    setLoading(false);
    
    if (q) {
        setQuestion(q);
        setStep(2);
    } else {
        // Fallback for demo: if user doesn't exist or has no question, just say "User not found or no security question set"
        setError('No account found with this email, or security question not configured.');
    }
  };

  const handleReset = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError('');

      const success = await api.resetPasswordViaSecurity(email, answer, newPassword);
      setLoading(false);

      if (success) {
          setStep(3);
      } else {
          setError('Incorrect security answer.');
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">Reset Password</h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Recover your account access
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="py-8 px-4 sm:px-10 border-0 shadow-lg">
          {step === 1 && (
              <form className="space-y-6" onSubmit={handleCheckEmail}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                    Email address
                  </label>
                  <div className="mt-1 relative">
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="pl-10"
                    />
                    <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                {error && <div className="text-sm text-red-600">{error}</div>}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Checking...' : 'Next'}
                </Button>
                
                <div className="text-center">
                    <Link to="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center justify-center">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
                    </Link>
                </div>
              </form>
          )}

          {step === 2 && (
              <form className="space-y-6" onSubmit={handleReset}>
                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                      <h4 className="text-xs font-bold text-indigo-800 uppercase mb-1">Security Question</h4>
                      <p className="text-sm text-indigo-900 font-medium">{question}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">Your Answer</label>
                    <div className="mt-1 relative">
                        <Input
                        required
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Type your answer..."
                        className="pl-10"
                        />
                        <Shield className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">New Password</label>
                    <Input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        minLength={4}
                    />
                  </div>

                  {error && <div className="text-sm text-red-600">{error}</div>}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </Button>
                  
                  <button type="button" onClick={() => setStep(1)} className="w-full text-center text-sm text-slate-500 hover:text-slate-700">
                      Cancel and use different email
                  </button>
              </form>
          )}

          {step === 3 && (
              <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900">Success!</h3>
                  <p className="mt-2 text-sm text-slate-500">
                      Your password has been updated immediately.
                  </p>
                  <Button className="w-full mt-6" onClick={() => navigate('/login')}>
                      Log In Now
                  </Button>
              </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
