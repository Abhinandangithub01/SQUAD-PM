import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { confirmSignUp, resendConfirmationCode } = useAuth();
  const [isResending, setIsResending] = useState(false);
  
  const email = location.state?.email || '';
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      code: ''
    }
  });

  const onSubmit = async (data) => {
    try {
      const result = await confirmSignUp(email, data.code);
      
      if (result.success) {
        toast.success('Email verified successfully! Let\'s set up your organization.');
        navigate('/organization-setup');
      } else {
        toast.error(result.error || 'Verification failed');
      }
    } catch (error) {
      toast.error('Verification failed. Please try again.');
    }
  };

  const handleResendCode = async () => {
    try {
      setIsResending(true);
      const result = await resendConfirmationCode(email);
      
      if (result.success) {
        toast.success('Verification code resent! Check your email.');
      } else {
        toast.error(result.error || 'Failed to resend code');
      }
    } catch (error) {
      toast.error('Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    navigate('/register');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-white">SQ</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We sent a verification code to
            <br />
            <span className="font-medium text-blue-600">{email}</span>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700">
              Verification Code
            </label>
            <input
              id="code"
              type="text"
              {...register('code', {
                required: 'Verification code is required',
                pattern: {
                  value: /^[0-9]{6}$/,
                  message: 'Code must be 6 digits'
                }
              })}
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
              placeholder="000000"
              maxLength="6"
            />
            {errors.code && (
              <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" />
              ) : (
                'Verify Email'
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isResending}
              className="text-sm text-blue-600 hover:text-blue-500 disabled:opacity-50"
            >
              {isResending ? 'Sending...' : "Didn't receive the code? Resend"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyEmail;
