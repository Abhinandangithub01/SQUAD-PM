import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { register: registerUser, isAuthenticated, loading, confirmSignUp, resendConfirmationCode } = useAuth();
  const navigate = useNavigate();

  const {
    register: registerField,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const password = watch('password');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data) => {
    const result = await registerUser({
      email: data.email,
      password: data.password,
      firstName: data.first_name,
      lastName: data.last_name,
      companyName: data.company_name,
      companySize: data.company_size,
      industry: data.industry,
      phoneNumber: data.phone_number,
    });
    
    if (result.success) {
      if (result.requiresConfirmation) {
        toast.success('Account created! Please check your email for verification code.');
        setVerificationEmail(data.email);
        setShowVerification(true);
      } else {
        toast.success('Account created successfully!');
        navigate('/dashboard', { replace: true });
      }
    } else {
      // Check if user already exists but is unverified
      if (result.error && (result.error.includes('User already exists') || result.error.includes('UsernameExistsException'))) {
        toast.error('Account exists but may not be verified. Please verify your email.');
        setVerificationEmail(data.email);
        setShowVerification(true);
        // Try to resend confirmation code
        handleResendCode(data.email);
      } else {
        toast.error(result.error);
      }
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setIsVerifying(true);
    try {
      const result = await confirmSignUp(verificationEmail, verificationCode);
      if (result.success) {
        toast.success('Email verified successfully! Please login.');
        navigate('/login');
      } else {
        toast.error(result.error || 'Verification failed');
      }
    } catch (error) {
      toast.error(error.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async (email = verificationEmail) => {
    setIsResending(true);
    try {
      const result = await resendConfirmationCode(email);
      if (result.success) {
        toast.success('Verification code sent! Check your email.');
      } else {
        toast.error(result.error || 'Failed to resend code');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to resend code');
    } finally {
      setIsResending(false);
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
            {showVerification ? 'Verify your email' : 'Create your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {showVerification ? (
              <>
                Enter the verification code sent to{' '}
                <span className="font-medium text-primary-600">{verificationEmail}</span>
              </>
            ) : (
              <>
                Or{' '}
                <Link
                  to="/login"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  sign in to your existing account
                </Link>
              </>
            )}
          </p>
        </div>

        {showVerification ? (
          <div className="mt-8 space-y-6">
            <div>
              <label htmlFor="verification_code" className="block text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <input
                id="verification_code"
                type="text"
                maxLength="6"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-2xl tracking-widest"
                placeholder="000000"
              />
              <p className="mt-2 text-sm text-gray-500 text-center">
                Enter the 6-digit code from your email
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleVerifyCode}
                disabled={isVerifying || verificationCode.length !== 6}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isVerifying ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  'Verify Email'
                )}
              </button>

              <button
                type="button"
                onClick={() => handleResendCode()}
                disabled={isResending}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isResending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  'Resend Code'
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowVerification(false);
                  setVerificationCode('');
                  setVerificationEmail('');
                }}
                className="w-full text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back to registration
              </button>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                  First name
                </label>
                <input
                  id="first_name"
                  type="text"
                  {...registerField('first_name', {
                    required: 'First name is required',
                  })}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="First name"
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                  Last name
                </label>
                <input
                  {...registerField('last_name', {
                    required: 'Last name is required',
                    minLength: {
                      value: 2,
                      message: 'Last name must be at least 2 characters',
                    },
                  })}
                  type="text"
                  autoComplete="family-name"
                  className={`mt-1 input ${errors.last_name ? 'input-error' : ''}`}
                  placeholder="Doe"
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                Company name
              </label>
              <input
                {...registerField('company_name', {
                  required: 'Company name is required',
                  minLength: {
                    value: 2,
                    message: 'Company name must be at least 2 characters',
                  },
                })}
                type="text"
                autoComplete="organization"
                className={`mt-1 input ${errors.company_name ? 'input-error' : ''}`}
                placeholder="Acme Inc."
              />
              {errors.company_name && (
                <p className="mt-1 text-sm text-red-600">{errors.company_name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="company_size" className="block text-sm font-medium text-gray-700">
                  Company size
                </label>
                <select
                  {...registerField('company_size', {
                    required: 'Company size is required',
                  })}
                  className={`mt-1 input ${errors.company_size ? 'input-error' : ''}`}
                >
                  <option value="">Select size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
                {errors.company_size && (
                  <p className="mt-1 text-sm text-red-600">{errors.company_size.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                  Industry
                </label>
                <select
                  {...registerField('industry', {
                    required: 'Industry is required',
                  })}
                  className={`mt-1 input ${errors.industry ? 'input-error' : ''}`}
                >
                  <option value="">Select industry</option>
                  <option value="Technology">Technology</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Finance">Finance</option>
                  <option value="Education">Education</option>
                  <option value="Retail">Retail</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Other">Other</option>
                </select>
                {errors.industry && (
                  <p className="mt-1 text-sm text-red-600">{errors.industry.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
                Phone number (optional)
              </label>
              <input
                {...registerField('phone_number', {
                  pattern: {
                    value: /^\+[1-9]\d{1,14}$/,
                    message: 'Phone number must be in E.164 format (e.g., +15551234567)',
                  },
                })}
                type="tel"
                autoComplete="tel"
                className={`mt-1 input ${errors.phone_number ? 'input-error' : ''}`}
                placeholder="+15551234567"
              />
              {errors.phone_number && (
                <p className="mt-1 text-sm text-red-600">{errors.phone_number.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Format: +[country code][number] (e.g., +15551234567 for US)
              </p>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                {...registerField('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Invalid email address',
                  },
                })}
                type="email"
                autoComplete="email"
                className={`mt-1 input ${errors.email ? 'input-error' : ''}`}
                placeholder="john@example.com"
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
                  {...registerField('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="Create a password"
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

            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
                Confirm password
              </label>
              <input
                {...registerField('confirm_password', {
                  required: 'Please confirm your password',
                  validate: (value) =>
                    value === password || 'Passwords do not match',
                })}
                type="password"
                autoComplete="new-password"
                className={`mt-1 input ${errors.confirm_password ? 'input-error' : ''}`}
                placeholder="Confirm your password"
              />
              {errors.confirm_password && (
                <p className="mt-1 text-sm text-red-600">{errors.confirm_password.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center">
            <input
              {...registerField('terms', {
                required: 'You must accept the terms and conditions',
              })}
              id="terms"
              name="terms"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
              I agree to the{' '}
              <a href="#" className="text-primary-600 hover:text-primary-500">
                Terms and Conditions
              </a>{' '}
              and{' '}
              <a href="#" className="text-primary-600 hover:text-primary-500">
                Privacy Policy
              </a>
            </label>
          </div>
          {errors.terms && (
            <p className="text-sm text-red-600">{errors.terms.message}</p>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" color="white" />
              ) : (
                'Create account'
              )}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default Register;
