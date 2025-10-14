import React, { createContext, useContext, useState, useEffect } from 'react';
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
  updateUserAttributes
} from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const CognitoAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const client = generateClient();

  // Check if user is logged in on mount
  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      setLoading(true);
      const currentUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      
      // Try to fetch user data from database
      try {
        // Check if UserProfile model exists (backward compatibility)
        if (client.models.UserProfile) {
          const { data: users } = await client.models.UserProfile.list({
            filter: { email: { eq: attributes.email } }
          });

          if (users && users.length > 0) {
            setUser(users[0]);
            setIsAuthenticated(true);
          } else {
            // User exists in Cognito but not in our DB - create user record
            await createUserRecord(currentUser, attributes);
          }
        } else if (client.models.User) {
          // Fallback to User model if UserProfile doesn't exist
          const { data: users } = await client.models.User.list({
            filter: { email: { eq: attributes.email } }
          });

          if (users && users.length > 0) {
            setUser(users[0]);
            setIsAuthenticated(true);
          } else {
            await createUserRecord(currentUser, attributes);
          }
        } else {
          // No user model available, use Cognito attributes
          console.warn('User model not available, using Cognito attributes');
          setUser({
            id: currentUser.userId,
            email: attributes.email,
            firstName: attributes.given_name || '',
            lastName: attributes.family_name || '',
          });
          setIsAuthenticated(true);
        }
      } catch (dbError) {
        console.error('Database error, falling back to Cognito attributes:', dbError);
        // Fallback: use Cognito attributes
        setUser({
          id: currentUser.userId,
          email: attributes.email,
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

  const createUserRecord = async (cognitoUser, attributes) => {
    try {
      const newUser = {
        email: attributes.email,
        firstName: attributes.given_name || '',
        lastName: attributes.family_name || '',
        role: 'MEMBER',
      };

      let createdUser;
      
      // Try UserProfile first, then User model
      if (client.models.UserProfile) {
        const { data } = await client.models.UserProfile.create(newUser);
        createdUser = data;
      } else if (client.models.User) {
        const { data } = await client.models.User.create(newUser);
        createdUser = data;
      } else {
        // No model available, use Cognito data
        console.warn('No user model available');
        createdUser = {
          id: cognitoUser.userId,
          ...newUser,
        };
      }

      setUser(createdUser);
      setIsAuthenticated(true);
      return createdUser;
    } catch (error) {
      console.error('Error creating user record:', error);
      // Don't throw - allow user to continue with Cognito auth
      setUser({
        id: cognitoUser.userId,
        email: attributes.email,
        firstName: attributes.given_name || '',
        lastName: attributes.family_name || '',
      });
      setIsAuthenticated(true);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const { isSignedIn, nextStep } = await signIn({ 
        username: email, 
        password 
      });

      if (isSignedIn) {
        await checkUser();
        toast.success('Logged in successfully!');
        return { success: true };
      } else if (nextStep.signInStep === 'CONFIRM_SIGN_UP') {
        return { 
          success: false, 
          requiresConfirmation: true,
          error: 'User is not confirmed.',
          message: 'Please confirm your email first'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Check if error is due to unconfirmed user
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

  const register = async ({ email, password, firstName, lastName, companyName, companySize, industry, phoneNumber }) => {
    try {
      setLoading(true);
      
      // Store company info in localStorage temporarily for use after email verification
      if (companyName) {
        localStorage.setItem('pendingCompanyInfo', JSON.stringify({
          companyName,
          companySize,
          industry,
          phoneNumber,
        }));
      }
      
      // Build user attributes - only include phone_number if it exists and is valid
      const userAttributes = {
        email,
        given_name: firstName,
        family_name: lastName,
      };
      
      // Only add phone_number if it's provided and not empty
      if (phoneNumber && phoneNumber.trim() !== '') {
        userAttributes.phone_number = phoneNumber;
      }
      
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: email,
        password,
        options: {
          userAttributes,
          autoSignIn: true
        }
      });

      if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        toast.success('Please check your email for verification code');
        return {
          success: true,
          requiresConfirmation: true,
          email
        };
      }

      if (isSignUpComplete) {
        toast.success('Account created successfully!');
        return { success: true };
      }
    } catch (error) {
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

  const confirmSignUpCode = async (email, code) => {
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
    } catch (error) {
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
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      await resetPassword({ username: email });
      toast.info('Password reset code sent to your email');
      return { success: true };
    } catch (error) {
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

  const resetPasswordWithCode = async (email, code, newPassword) => {
    try {
      setLoading(true);
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword
      });
      toast.success('Password reset successfully!');
      return { success: true };
    } catch (error) {
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

  const updateProfile = async (updates) => {
    try {
      setLoading(true);
      
      // Update Cognito attributes if email or name changed
      if (updates.email || updates.firstName || updates.lastName) {
        const attributes = {};
        if (updates.email) attributes.email = updates.email;
        if (updates.firstName) attributes.given_name = updates.firstName;
        if (updates.lastName) attributes.family_name = updates.lastName;
        
        await updateUserAttributes({ userAttributes: attributes });
      }

      // Update user in our database
      // This would call your GraphQL mutation
      
      await checkUser(); // Refresh user data
      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error) {
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

  const resendConfirmationCode = async (email) => {
    try {
      await resendSignUpCode({ username: email });
      return { success: true };
    } catch (error) {
      console.error('Resend code error:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
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

export default AuthContext;
