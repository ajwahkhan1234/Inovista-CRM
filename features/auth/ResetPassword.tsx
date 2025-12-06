
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button, Card, Input } from '../../components/ui';
import { api } from '../../services/api';
import { Lock, CheckCircle } from 'lucide-react';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Extract token from query params
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
        setError('Invalid or missing reset token.');
        return;
    }

    if (password.length < 4) {
        setError('Password must be at least 4 characters.');
        return;
    }

    if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
    }

    setLoading(true);
    const result = await api.resetPassword(token, password);
    setLoading(false);

    if (result) {
        setSuccess(true);
    } else {
        setError('Invalid token or link expired. Please request a new one.');
    }
  };

  if (!token) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-8 text-center">
                <h2 className="text-xl font-bold text-slate-900 mb-2">Invalid Link</h2>
                <p className="text-slate-600 mb-6">This password reset link is invalid or has expired.</p>
                <Link to="/forgot-password" element={<Button>Request New Link</Button>}>
                    Request New Link
                </Link>
            </Card>
        </div>
      )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">New Password</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="py-8 px-4 sm:px-10 border-0 shadow-lg">
          {success ? (
              <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900">Password Reset!</h3>
                  <p className="mt-2 text-sm text-slate-500">
                      Your password has been successfully updated. You can now log in.
                  </p>
                  <Button className="w-full mt-6" onClick={() => navigate('/login')}>
                      Go to Login
                  </Button>
              </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                <label className="block text-sm font-medium text-slate-700">New Password</label>
                <div className="mt-1 relative">
                    <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10"
                    />
                    <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                </div>
                </div>

                <div>
                <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
                <div className="mt-1 relative">
                    <Input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10"
                    />
                    <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                </div>
                </div>

                {error && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                    {error}
                </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Updating...' : 'Set New Password'}
                </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
