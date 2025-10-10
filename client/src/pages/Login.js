import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { login, isAuthenticated, loading, resendConfirmationCode, confirmSignUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, from]);

  const createDefaultOrganization = async (user) => {
    try {
      const client = generateClient();
      
      // Get user attributes
      const userEmail = user.signInDetails?.loginId || user.username;
      
      // Create default organization
      const orgName = `${userEmail.split('@')[0]}'s Organization`;
      const orgSlug = userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
      
      const { data: organization } = await client.models.Organization.create({
        name: orgName,
        slug: orgSlug,
        description: 'My workspace',
        ownerId: user.userId,
        plan: 'FREE',
        maxUsers: 5,
        maxProjects: 3,
        isActive: true,
        billingEmail: userEmail,
      });

      // Create organization membership
      await client.models.OrganizationMember.create({
        organizationId: organization.id,
        userId: user.userId,
        role: 'OWNER',
        joinedAt: new Date().toISOString(),
      });

      // Create user profile if doesn't exist
      try {
        await client.models.UserProfile.create({
          email: userEmail,
          firstName: userEmail.split('@')[0],
          lastName: '',
          role: 'ADMIN',
          isActive: true,
          lastLoginAt: new Date().toISOString(),
        });
      } catch (error) {
        // Profile might already exist
        console.log('User profile may already exist:', error);
      }

      return true;
    } catch (error) {
      console.error('Error creating default organization:', error);
      return false;
    }
  };

  const onSubmit = async (data) => {
    const result = await login(data.email, data.password);
    
    console.log('Login result:', result); // Debug log
    
    if (result.success) {
      toast.success('Welcome back!');
      
      // Check if user has an organization
      try {
        const client = generateClient();
        const user = await getCurrentUser();
        
        const { data: memberships } = await client.models.OrganizationMember.list({
          filter: { userId: { eq: user.userId } }
        });
        
        if (!memberships || memberships.length === 0) {
          // No organization, create one automatically
          toast.loading('Setting up your workspace...');
          const created = await createDefaultOrganization(user);
          
          if (created) {
            toast.dismiss();
            toast.success('Workspace created! Welcome to SQUAD PM!');
          }
        }
        
        // Go to dashboard
        navigate(from, { replace: true });
        
      } catch (error) {
        console.error('Error checking organization:', error);
        // If check fails, just go to dashboard
        navigate(from, { replace: true });
      }
    } else {
      // Check if user is not confirmed (multiple error message formats)
      const errorMsg = (result.error || '').toLowerCase();
      console.log('Error message:', errorMsg); // Debug log
      
      if (errorMsg.includes('not confirmed') || errorMsg.includes('confirmed')) {
        console.log('Setting unverified email:', data.email); // Debug log
        setUnverifiedEmail(data.email);
        toast.error('⚠️ Account not verified! See below to verify.');
      } else {
        toast.error(result.error);
      }
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    
    const result = await resendConfirmationCode(unverifiedEmail);
    if (result.success) {
      toast.success('Verification code sent! Check your email.');
      setShowVerificationInput(true);
    } else {
      toast.error('Failed to send verification code');
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setIsVerifying(true);
    try {
      const result = await confirmSignUp(unverifiedEmail, verificationCode);
      
      if (result.success) {
        toast.success('Email verified! You can now login.');
        setUnverifiedEmail(null);
        setShowVerificationInput(false);
        setVerificationCode('');
      } else {
        toast.error(result.error || 'Verification failed');
      }
    } catch (error) {
      toast.error('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto flex flex-col items-center">
            <div className="h-16 w-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">SQ</span>
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">SQUAD PM</h1>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              create a new account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Invalid email address',
                  },
                })}
                type="email"
                autoComplete="email"
                className={`mt-1 input ${errors.email ? 'input-error' : ''}`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a
                href="#"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" color="white" />
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          {/* Verification prompt */}
          {unverifiedEmail && (
            <div className="mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg shadow-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-red-800">
                    ⚠️ Account Not Verified
                  </h3>
                  <p className="mt-1 text-sm text-red-700">
                    Your email <strong>{unverifiedEmail}</strong> has not been verified.
                  </p>
                  
                  {!showVerificationInput ? (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      className="mt-3 w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors shadow-sm"
                    >
                      📧 Send Verification Code
                    </button>
                  ) : (
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-red-800 mb-1">
                          Enter 6-Digit Code
                        </label>
                        <input
                          type="text"
                          maxLength="6"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="000000"
                          className="w-full px-3 py-2 border border-red-300 rounded-lg text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleVerifyCode}
                          disabled={isVerifying || verificationCode.length !== 6}
                          className="flex-1 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isVerifying ? <LoadingSpinner size="sm" /> : '✓ Verify'}
                        </button>
                        <button
                          type="button"
                          onClick={handleResendVerification}
                          className="px-4 py-2 text-sm text-red-700 hover:text-red-800 font-medium"
                        >
                          Resend
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
};

export default Login;
