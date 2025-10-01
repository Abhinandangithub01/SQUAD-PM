# 🚀 AWS Amplify Gen 2 - Complete Setup Guide

## ✅ What's Been Created

Your Amplify Gen 2 backend is configured with:

- ✅ **Authentication** (`amplify/auth/resource.ts`)
- ✅ **Data/Database** (`amplify/data/resource.ts`) 
- ✅ **Storage/Files** (`amplify/storage/resource.ts`)
- ✅ **Backend Config** (`amplify/backend.ts`)

---

## 📋 Quick Setup Steps

### Step 1: Install Dependencies

```bash
cd client

# Install Amplify Gen 2 packages
npm install aws-amplify @aws-amplify/backend @aws-amplify/backend-cli

# Install Amplify UI components
npm install @aws-amplify/ui-react

# Install dev dependencies for amplify folder
cd amplify
npm install
cd ..
```

### Step 2: Start Local Development Sandbox

```bash
cd client

# This creates a local cloud sandbox for development
npx ampx sandbox
```

This will:
- ✅ Create AWS resources in your account
- ✅ Generate `amplify_outputs.json`
- ✅ Watch for changes and auto-deploy
- ✅ Provide a local development environment

### Step 3: Update Frontend to Use Amplify

**Update `client/src/index.tsx` or `index.js`:**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { Amplify } from 'aws-amplify';
import outputs from './amplify_outputs.json';

// Configure Amplify
Amplify.configure(outputs);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Step 4: Create Auth Context (Gen 2 Version)

**Create `client/src/contexts/AmplifyAuthContext.tsx`:**

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signIn, 
  signUp, 
  signOut, 
  getCurrentUser,
  fetchUserAttributes,
  confirmSignUp,
  resetPassword,
  confirmResetPassword,
  type SignInOutput
} from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import toast from 'react-hot-toast';

const client = generateClient<Schema>();

interface AuthContextType {
  user: any;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (data: any) => Promise<any>;
  logout: () => Promise<void>;
  confirmSignUpCode: (email: string, code: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AmplifyAuthProvider');
  }
  return context;
};

export const AmplifyAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
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
      
      // Get or create user profile
      const { data: userProfile } = await client.models.UserProfile.get({ id: currentUser.userId });
      
      if (userProfile) {
        setUser(userProfile);
      } else {
        // Create user profile
        const newProfile = await client.models.UserProfile.create({
          email: attributes.email!,
          firstName: attributes.given_name || '',
          lastName: attributes.family_name || '',
          role: 'MEMBER',
        });
        setUser(newProfile.data);
      }
      
      setIsAuthenticated(true);
    } catch (error) {
      console.log('Not authenticated', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
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
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async ({ email, password, firstName, lastName }: any) => {
    try {
      setLoading(true);
      const result = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            given_name: firstName,
            family_name: lastName,
          },
        }
      });

      toast.info('Please check your email for verification code');
      return {
        success: true,
        requiresConfirmation: true,
        email
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const confirmSignUpCode = async (email: string, code: string) => {
    try {
      setLoading(true);
      await confirmSignUp({ username: email, confirmationCode: code });
      toast.success('Email confirmed! You can now log in.');
      return { success: true };
    } catch (error: any) {
      console.error('Confirmation error:', error);
      toast.error(error.message || 'Confirmation failed');
      return { success: false, error: error.message };
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

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    confirmSignUpCode,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Step 5: Use Data Client in Your Components

**Example - Fetch Projects:**

```typescript
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';

const client = generateClient<Schema>();

// In your component
const { data: projects, errors } = await client.models.Project.list();

// Create a project
const { data: newProject } = await client.models.Project.create({
  name: 'My Project',
  description: 'Project description',
  status: 'ACTIVE',
  ownerId: user.id,
});

// Update a project
await client.models.Project.update({
  id: projectId,
  name: 'Updated Name'
});

// Delete a project
await client.models.Project.delete({ id: projectId });
```

### Step 6: Use Storage for File Uploads

```typescript
import { uploadData, getUrl, remove } from 'aws-amplify/storage';

// Upload file
const uploadFile = async (file: File) => {
  try {
    const result = await uploadData({
      key: `uploads/${file.name}`,
      data: file,
      options: {
        contentType: file.type,
      }
    }).result;
    
    return result;
  } catch (error) {
    console.error('Upload error:', error);
  }
};

// Get file URL
const getFileUrl = async (key: string) => {
  const url = await getUrl({ key });
  return url.url.toString();
};

// Delete file
const deleteFile = async (key: string) => {
  await remove({ key });
};
```

---

## 🚀 Deploy to Production

### Option 1: Deploy via Amplify CLI

```bash
cd client
npx ampx pipeline-deploy --branch main
```

### Option 2: Deploy via Amplify Console

1. Go to: https://console.aws.amazon.com/amplify
2. Select your app: `project-management-system`
3. Go to "Backend environments"
4. Click "Deploy backend"
5. The backend will be deployed automatically with your frontend!

---

## 📝 Update App.tsx/App.js

```typescript
import { AmplifyAuthProvider } from './contexts/AmplifyAuthContext';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

function App() {
  return (
    <Authenticator.Provider>
      <AmplifyAuthProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <BrowserRouter>
              {/* Your routes */}
            </BrowserRouter>
          </ThemeProvider>
        </QueryClientProvider>
      </AmplifyAuthProvider>
    </Authenticator.Provider>
  );
}
```

---

## 🎯 Key Differences from Gen 1

| Feature | Gen 1 | Gen 2 |
|---------|-------|-------|
| Configuration | CLI prompts | Code files |
| Type Safety | Limited | Full TypeScript |
| Local Dev | Limited | Full sandbox |
| Schema | GraphQL SDL | TypeScript |
| Deployment | `amplify push` | `npx ampx sandbox` |
| Hot Reload | No | Yes |

---

## 📚 Useful Commands

```bash
# Start local development sandbox
npx ampx sandbox

# Deploy to production
npx ampx pipeline-deploy --branch main

# Generate types
npx ampx generate graphql-client-code

# Delete sandbox
npx ampx sandbox delete

# View logs
npx ampx sandbox logs
```

---

## ✅ Testing Checklist

- [ ] Run `npx ampx sandbox` successfully
- [ ] `amplify_outputs.json` generated
- [ ] User registration works
- [ ] Email verification works
- [ ] Login/logout works
- [ ] Create project works
- [ ] Create task works
- [ ] File upload works
- [ ] Real-time updates work

---

## 🎉 Benefits of Gen 2

✅ **Better Developer Experience**
- Code-first approach
- Full TypeScript support
- Better IDE autocomplete

✅ **Faster Development**
- Local sandbox with hot reload
- No waiting for cloud deployments
- Instant feedback

✅ **Type Safety**
- End-to-end type safety
- Catch errors at compile time
- Better refactoring support

✅ **Simpler Configuration**
- Everything in code
- Version controlled
- Easy to understand

✅ **Modern Architecture**
- Uses latest AWS services
- Better performance
- Lower costs

---

**You're all set! Run `npx ampx sandbox` to start developing! 🚀**
