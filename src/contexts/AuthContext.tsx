'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  signIn, 
  signUp, 
  signOut, 
  getCurrentUser,
  fetchUserAttributes,
  confirmSignUp,
  resendSignUpCode,
  resetPassword,
  confirmResetPassword,
  updateUserAttributes,
  type SignInOutput,
  type SignUpOutput
} from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import toast from 'react-hot-toast';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  organizationId?: string;
  tenantId?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; requiresConfirmation?: boolean; error?: string; message?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; requiresConfirmation?: boolean; email?: string; error?: string }>;
  logout: () => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  resendConfirmationCode: (email: string) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPasswordWithCode: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  checkUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  companySize?: string;
  industry?: string;
  phoneNumber?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};

export const useAuth = useAuthContext;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      setLoading(true);
      const currentUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      
      try {
        // Fetch user from database with tenant context
        const { data: users } = await client.models.User.list({
          filter: { email: { eq: attributes.email } }
        });

        if (users && users.length > 0) {
          setUser(users[0] as User);
          setIsAuthenticated(true);
        } else {
          // Create user record if doesn't exist
          await createUserRecord(currentUser, attributes);
        }
      } catch (dbError) {
        console.error('Database error, using Cognito attributes:', dbError);
        setUser({
          id: currentUser.userId,
          email: attributes.email || '',
          firstName: attributes.given_name || '',
          lastName: attributes.family_name || '',
        });
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.log('Not authenticated', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const createUserRecord = async (cognitoUser: any, attributes: any) => {
    try {
      const newUser = {
        email: attributes.email,
        firstName: attributes.given_name || '',
        lastName: attributes.family_name || '',
        role: 'MEMBER',
      };

      const { data } = await client.models.User.create(newUser);
      
      if (data) {
        setUser(data as User);
        setIsAuthenticated(true);
        return data;
      }
    } catch (error) {
      console.error('Error creating user record:', error);
      setUser({
        id: cognitoUser.userId,
        email: attributes.email,
        firstName: attributes.given_name || '',
        lastName: attributes.family_name || '',
      });
      setIsAuthenticated(true);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const result: SignInOutput = await signIn({ 
        username: email, 
        password 
      });

      if (result.isSignedIn) {
        await checkUser();
        toast.success('Logged in successfully!');
        return { success: true };
      } else if (result.nextStep.signInStep === 'CONFIRM_SIGN_UP') {
        return { 
          success: false, 
          requiresConfirmation: true,
          error: 'User is not confirmed.',
          message: 'Please confirm your email first'
        };
      }
      
      return { success: false, error: 'Unknown error occurred' };
    } catch (error: any) {
      console.error('Login error:', error);
      
      const errorMessage = error.message || error.toString();
      if (errorMessage.includes('UserNotConfirmedException') || 
          errorMessage.includes('User is not confirmed') ||
          errorMessage.includes('not confirmed')) {
        return { 
          success: false, 
          requiresConfirmation: true,
          error: 'User is not confirmed.',
          message: 'Please confirm your email first'
        };
      }
      
      toast.error(error.message || 'Login failed');
      return { 
        success: false, 
        error: error.message || error.toString()
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async ({ email, password, firstName, lastName, companyName, companySize, industry, phoneNumber }: RegisterData) => {
    try {
      setLoading(true);
      
      if (companyName) {
        localStorage.setItem('pendingCompanyInfo', JSON.stringify({
          companyName,
          companySize,
          industry,
          phoneNumber,
        }));
      }
      
      const userAttributes: Record<string, string> = {
        email,
        given_name: firstName,
        family_name: lastName,
      };
      
      if (phoneNumber && phoneNumber.trim() !== '') {
        userAttributes.phone_number = phoneNumber;
      }
      
      const result: SignUpOutput = await signUp({
        username: email,
        password,
        options: {
          userAttributes,
          autoSignIn: true
        }
      });

      if (result.nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        toast.success('Please check your email for verification code');
        return {
          success: true,
          requiresConfirmation: true,
          email
        };
      }

      if (result.isSignUpComplete) {
        toast.success('Account created successfully!');
        return { success: true };
      }
      
      return { success: false, error: 'Unknown error occurred' };
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed');
      return { 
        success: false, 
        error: error.message 
      };
    } finally {
      setLoading(false);
    }
  };

  const confirmSignUpCode = async (email: string, code: string) => {
    try {
      setLoading(true);
      const { isSignUpComplete } = await confirmSignUp({
        username: email,
        confirmationCode: code
      });

      if (isSignUpComplete) {
        toast.success('Email confirmed! You can now log in.');
        return { success: true };
      }
      
      return { success: false, error: 'Confirmation incomplete' };
    } catch (error: any) {
      console.error('Confirmation error:', error);
      toast.error(error.message || 'Confirmation failed');
      return { 
        success: false, 
        error: error.message 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await signOut();
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      setLoading(true);
      await resetPassword({ username: email });
      toast.info('Password reset code sent to your email');
      return { success: true };
    } catch (error: any) {
      console.error('Forgot password error:', error);
      toast.error(error.message || 'Failed to send reset code');
      return { 
        success: false, 
        error: error.message 
      };
    } finally {
      setLoading(false);
    }
  };

  const resetPasswordWithCode = async (email: string, code: string, newPassword: string) => {
    try {
      setLoading(true);
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword
      });
      toast.success('Password reset successfully!');
      return { success: true };
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error(error.message || 'Password reset failed');
      return { 
        success: false, 
        error: error.message 
      };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      setLoading(true);
      
      if (updates.email || updates.firstName || updates.lastName) {
        const attributes: Record<string, string> = {};
        if (updates.email) attributes.email = updates.email;
        if (updates.firstName) attributes.given_name = updates.firstName;
        if (updates.lastName) attributes.family_name = updates.lastName;
        
        await updateUserAttributes({ userAttributes: attributes });
      }

      await checkUser();
      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast.error(error.message || 'Profile update failed');
      return { 
        success: false, 
        error: error.message 
      };
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmationCode = async (email: string) => {
    try {
      await resendSignUpCode({ username: email });
      return { success: true };
    } catch (error: any) {
      console.error('Resend code error:', error);
      return { success: false, error: error.message };
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    confirmSignUp: confirmSignUpCode,
    resendConfirmationCode,
    forgotPassword,
    resetPasswordWithCode,
    updateProfile,
    checkUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
