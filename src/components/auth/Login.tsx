import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, googleSignIn } = useAuth();

  const getAuthErrorMessage = (error: any): string => {
    console.log('Authentication error details:', error);
    
    if (error instanceof Error) {
      // Return the error message directly if it's from our enhanced error handling
      if (error.message.includes('Authentication failed') ||
          error.message.includes('Invalid email or password') ||
          error.message.includes('This account has been disabled') ||
          error.message.includes('Too many failed login attempts') ||
          error.message.includes('Sign-in cancelled') ||
          error.message.includes('Popup blocked')) {
        return error.message;
      }
      
      // Handle other specific error cases
      const errorCode = (error as any).code;
      switch (errorCode) {
        case 'auth/invalid-email':
          return 'Invalid email address format';
        case 'auth/user-not-found':
          return 'No account found with this email';
        case 'auth/wrong-password':
          return 'Incorrect password';
        case 'auth/network-request-failed':
          return 'Network error. Please check your internet connection';
        case 'auth/internal-error':
          return 'An internal error occurred. Please try again later';
        default:
          return error.message || 'Unable to sign in. Please check your credentials and try again';
      }
    }
    
    return 'An unexpected error occurred. Please try again';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      setLoading(true);
      const user = await login(email, password);
      
      // The login function now throws specific errors if the user object is invalid
      // so if we get here, we know we have a valid user object
      
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const user = await googleSignIn();
      
      // The googleSignIn function now throws specific errors if the user object is invalid
      // so if we get here, we know we have a valid user object
      
      navigate('/');
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col justify-center flex-1 px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="w-full max-w-sm mx-auto lg:w-96">
          <div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                Register
              </Link>
            </p>
          </div>

          <div className="mt-8">
            {error && (
              <div className="p-3 mb-4 text-sm text-error-700 bg-error-100 rounded-md flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email address
                  </label>
                  <div className="relative mt-1 rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Mail className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <div className="relative mt-1 rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <LogIn className="w-5 h-5 mr-2" />
                    {loading ? 'Signing in...' : 'Sign in'}
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 text-gray-500 bg-gray-50 dark:bg-gray-900 dark:text-gray-400">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                    />
                  </svg>
                  Sign in with Google
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative flex-1 hidden w-0 lg:block">
        <div className="absolute inset-0 object-cover w-full h-full bg-gradient-to-r from-primary-500 to-secondary-500"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-white">
          <h1 className="text-4xl font-bold">Realtym Chat</h1>
          <p className="mt-4 text-xl">Connect and chat with friends in real-time.</p>
          <div className="absolute bottom-8 right-8 flex items-center text-white text-sm">
            <span>Discover more</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;