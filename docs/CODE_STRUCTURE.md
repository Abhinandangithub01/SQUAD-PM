# 📁 Code Structure & Organization

## Project Overview

SQUAD PM follows Next.js 14 App Router conventions with AWS Amplify Gen 2 backend integration.

---

## Directory Structure

```
SQUAD-PM/
├── amplify/                    # Backend configuration
│   ├── auth/
│   │   └── resource.ts        # Cognito authentication setup
│   ├── data/
│   │   └── resource.ts        # Database schema & GraphQL API
│   ├── storage/
│   │   └── resource.ts        # S3 file storage (optional)
│   ├── backend.ts             # Backend entry point
│   └── tsconfig.json          # TypeScript config for backend
│
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── layout.tsx         # Root layout (providers, fonts)
│   │   ├── page.tsx           # Home page (redirect logic)
│   │   ├── globals.css        # Global styles
│   │   │
│   │   ├── auth/              # Authentication pages
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   ├── verify-email/
│   │   │   │   └── page.tsx
│   │   │   └── forgot-password/
│   │   │       └── page.tsx
│   │   │
│   │   └── dashboard/         # Protected app pages
│   │       ├── page.tsx       # Dashboard home
│   │       ├── projects/
│   │       ├── tasks/
│   │       └── settings/
│   │
│   ├── components/            # React components
│   │   ├── ConfigureAmplify.tsx   # Amplify initialization
│   │   ├── Providers.tsx          # Context providers wrapper
│   │   │
│   │   ├── ui/                    # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Card.tsx
│   │   │
│   │   ├── layout/                # Layout components
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   │
│   │   └── features/              # Feature-specific components
│   │       ├── tasks/
│   │       ├── projects/
│   │       └── organizations/
│   │
│   ├── contexts/              # React Context providers
│   │   ├── AuthContext.tsx    # Authentication state
│   │   ├── ThemeContext.tsx   # Theme/dark mode
│   │   └── OrganizationContext.tsx  # Current org state
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAuth.ts         # Auth helper hook
│   │   ├── useOrganization.ts # Org helper hook
│   │   └── useDebounce.ts     # Utility hooks
│   │
│   ├── lib/                   # Utilities & helpers
│   │   ├── amplify.ts         # Amplify client setup
│   │   ├── utils.ts           # General utilities
│   │   └── constants.ts       # App constants
│   │
│   ├── services/              # API service layer
│   │   ├── organizationService.ts
│   │   ├── projectService.ts
│   │   ├── taskService.ts
│   │   └── userService.ts
│   │
│   └── types/                 # TypeScript types
│       ├── index.ts           # Exported types
│       ├── models.ts          # Data model types
│       └── api.ts             # API response types
│
├── public/                    # Static assets
│   ├── images/
│   ├── icons/
│   └── favicon.ico
│
├── docs/                      # Documentation
│   ├── DEVELOPER_GUIDE.md
│   ├── DATABASE_SCHEMA.md
│   ├── DEPLOYMENT.md
│   └── CODE_STRUCTURE.md
│
├── .amplify/                  # Amplify build artifacts (gitignored)
├── .next/                     # Next.js build output (gitignored)
├── node_modules/              # Dependencies (gitignored)
│
├── amplify_outputs.json       # Backend config (generated)
├── next.config.js             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS config
├── tsconfig.json              # TypeScript config
├── package.json               # Dependencies & scripts
├── .gitignore                 # Git ignore rules
└── README.md                  # Project readme
```

---

## Key Files Explained

### Backend Configuration

#### `amplify/backend.ts`
**Purpose**: Backend entry point, connects all resources

```typescript
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

defineBackend({
  auth,
  data,
});
```

#### `amplify/auth/resource.ts`
**Purpose**: Configure Cognito authentication

```typescript
import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    email: { required: true, mutable: false },
  },
});
```

**What it creates**:
- Cognito User Pool
- User Pool Client
- Identity Pool
- IAM roles

#### `amplify/data/resource.ts`
**Purpose**: Define database schema and API

```typescript
import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Organization: a.model({
    name: a.string().required(),
    // ... fields
  }),
});

export type Schema = ClientSchema<typeof schema>;
export const data = defineData({ schema });
```

**What it creates**:
- AppSync GraphQL API
- DynamoDB tables (one per model)
- Lambda resolvers
- IAM policies

---

### Frontend Configuration

#### `src/app/layout.tsx`
**Purpose**: Root layout for entire app

```typescript
import { ConfigureAmplifyClientSide } from '@/components/ConfigureAmplify';
import { Providers } from '@/components/Providers';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ConfigureAmplifyClientSide />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**Responsibilities**:
- Load global CSS
- Configure Amplify
- Wrap app in providers
- Set metadata

#### `src/components/ConfigureAmplify.tsx`
**Purpose**: Initialize Amplify with backend config

```typescript
'use client';
import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';

if (typeof window !== 'undefined') {
  Amplify.configure(outputs, { ssr: true });
}

export function ConfigureAmplifyClientSide() {
  return null;
}
```

**Why it's needed**:
- Connects frontend to backend
- Must run on client side
- Configures auth, API, storage

#### `src/components/Providers.tsx`
**Purpose**: Wrap app in context providers

```typescript
'use client';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient();

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          {children}
          <Toaster position="top-right" />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

---

### Context Providers

#### `src/contexts/AuthContext.tsx`
**Purpose**: Manage authentication state globally

```typescript
'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, signIn, signUp, signOut } from 'aws-amplify/auth';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (data: any) => Promise<any>;
  logout: () => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<any>;
  resendConfirmationCode: (email: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const result = await signIn({ username: email, password });
    await checkUser();
    return { success: true };
  };

  // ... other methods

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used within AuthProvider');
  return context;
};
```

**Usage in components**:
```typescript
'use client';
import { useAuthContext } from '@/contexts/AuthContext';

export default function MyComponent() {
  const { user, loading, login } = useAuthContext();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not logged in</div>;

  return <div>Welcome {user.email}</div>;
}
```

---

### Page Structure

#### `src/app/page.tsx`
**Purpose**: Home page with redirect logic

```typescript
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuthContext();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/auth/login');
      }
    }
  }, [user, loading, router]);

  return <div>Loading...</div>;
}
```

#### `src/app/auth/login/page.tsx`
**Purpose**: Login page

```typescript
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        router.push('/dashboard');
      }
    } catch (error) {
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

---

### Service Layer

#### `src/services/organizationService.ts`
**Purpose**: API calls for organizations

```typescript
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

export const organizationService = {
  // List all organizations for current user
  async list() {
    const { data, errors } = await client.models.Organization.list();
    if (errors) throw new Error(errors[0].message);
    return data;
  },

  // Get single organization
  async get(id: string) {
    const { data, errors } = await client.models.Organization.get({ id });
    if (errors) throw new Error(errors[0].message);
    return data;
  },

  // Create organization
  async create(input: any) {
    const { data, errors } = await client.models.Organization.create(input);
    if (errors) throw new Error(errors[0].message);
    return data;
  },

  // Update organization
  async update(id: string, input: any) {
    const { data, errors } = await client.models.Organization.update({
      id,
      ...input,
    });
    if (errors) throw new Error(errors[0].message);
    return data;
  },

  // Delete organization
  async delete(id: string) {
    const { data, errors } = await client.models.Organization.delete({ id });
    if (errors) throw new Error(errors[0].message);
    return data;
  },
};
```

**Usage in components**:
```typescript
import { organizationService } from '@/services/organizationService';

const organizations = await organizationService.list();
```

---

### Custom Hooks

#### `src/hooks/useAuth.ts`
**Purpose**: Simplified auth hook

```typescript
import { useAuthContext } from '@/contexts/AuthContext';

export function useAuth() {
  const { user, loading } = useAuthContext();

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isLoading: loading,
  };
}
```

#### `src/hooks/useOrganization.ts`
**Purpose**: Current organization management

```typescript
import { useState, useEffect } from 'react';
import { organizationService } from '@/services/organizationService';

export function useOrganization() {
  const [currentOrg, setCurrentOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrganization();
  }, []);

  const loadOrganization = async () => {
    try {
      const orgs = await organizationService.list();
      if (orgs.length > 0) {
        setCurrentOrg(orgs[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const switchOrganization = (org) => {
    setCurrentOrg(org);
    localStorage.setItem('currentOrgId', org.id);
  };

  return {
    currentOrg,
    loading,
    switchOrganization,
  };
}
```

---

### Styling

#### `src/app/globals.css`
**Purpose**: Global styles and Tailwind directives

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}
```

#### `tailwind.config.ts`
**Purpose**: Tailwind CSS configuration

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#0ea5e9',
          900: '#0c4a6e',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};

export default config;
```

---

## Naming Conventions

### Files
- **Components**: PascalCase (`Button.tsx`, `UserCard.tsx`)
- **Pages**: lowercase (`page.tsx`, `layout.tsx`)
- **Utilities**: camelCase (`utils.ts`, `formatDate.ts`)
- **Types**: PascalCase (`types/User.ts`)

### Variables
- **Components**: PascalCase (`const UserProfile = () => {}`)
- **Functions**: camelCase (`function handleClick() {}`)
- **Constants**: UPPER_SNAKE_CASE (`const API_URL = ''`)
- **Types/Interfaces**: PascalCase (`interface User {}`)

### Folders
- **Feature folders**: lowercase (`auth/`, `dashboard/`)
- **Component folders**: lowercase (`ui/`, `layout/`)

---

## Import Aliases

Configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/contexts/*": ["./src/contexts/*"]
    }
  }
}
```

**Usage**:
```typescript
// Instead of
import { Button } from '../../../components/ui/Button';

// Use
import { Button } from '@/components/ui/Button';
```

---

## Code Organization Best Practices

### 1. Component Structure

```typescript
// Imports
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

// Types
interface Props {
  title: string;
  onSubmit: () => void;
}

// Component
export default function MyComponent({ title, onSubmit }: Props) {
  // State
  const [loading, setLoading] = useState(false);

  // Handlers
  const handleClick = () => {
    setLoading(true);
    onSubmit();
  };

  // Render
  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={handleClick} disabled={loading}>
        Submit
      </Button>
    </div>
  );
}
```

### 2. Service Layer Pattern

```typescript
// services/taskService.ts
export const taskService = {
  list: async () => {},
  get: async (id) => {},
  create: async (data) => {},
  update: async (id, data) => {},
  delete: async (id) => {},
};

// Usage in component
import { taskService } from '@/services/taskService';

const tasks = await taskService.list();
```

### 3. Error Handling

```typescript
try {
  const result = await taskService.create(data);
  toast.success('Task created!');
  return result;
} catch (error) {
  console.error('Failed to create task:', error);
  toast.error(error.message || 'Failed to create task');
  throw error;
}
```

---

**Last Updated**: October 21, 2025
