import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const VerifyAccount = () => {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { resendConfirmationCode, confirmSignUp } = useAuth();
  const navigate = useNavigate();

  const handleSendCode = async (e) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsResending(true);
    try {
      const result = await resendConfirmationCode(email);
      if (result.success) {
        toast.success('Verification code sent! Check your email.');
        setShowCodeInput(true);
      } else {
        toast.error(result.error || 'Failed to send verification code');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to send verification code');
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setIsVerifying(true);
    try {
      const result = await confirmSignUp(email, verificationCode);
      if (result.success) {
        toast.success('Email verified successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        toast.error(result.error || 'Verification failed');
      }
    } catch (error) {
      toast.error(error.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

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
            Verify Your Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email to receive a verification code
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {!showCodeInput ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isResending}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isResending ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  'Send Verification Code'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Verification code sent to <strong>{email}</strong>
                </p>
              </div>

              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                  Verification Code
                </label>
                <input
                  id="code"
                  type="text"
                  maxLength="6"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-2xl tracking-widest"
                  placeholder="000000"
                  required
                />
                <p className="mt-2 text-sm text-gray-500 text-center">
                  Enter the 6-digit code from your email
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isVerifying || verificationCode.length !== 6}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isVerifying ? (
                    <LoadingSpinner size="sm" color="white" />
                  ) : (
                    'Verify Email'
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSendCode}
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
                    setShowCodeInput(false);
                    setVerificationCode('');
                  }}
                  className="w-full text-sm text-gray-600 hover:text-gray-900"
                >
                  ← Change email
                </button>
              </div>
            </form>
          )}

          <div className="text-center">
            <Link
              to="/login"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyAccount;
