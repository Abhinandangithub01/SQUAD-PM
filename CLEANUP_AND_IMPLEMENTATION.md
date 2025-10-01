# 🧹 Complete Codebase Cleanup & Real Backend Implementation Plan

## Current Issues
- ❌ Mock data scattered throughout codebase
- ❌ npm start getting stuck
- ❌ Amplify sandbox not properly configured
- ❌ Mixed mock and real API calls

## Solution: Clean Implementation

---

## Phase 1: Cleanup (Remove Mock Data)

### Files to Delete:
```
client/src/utils/mockData.js
client/src/utils/mockApi.js
```

### Files to Update (Remove mock imports):
```
client/src/pages/Dashboard.js
client/src/pages/ProjectDetail.js
client/src/pages/KanbanBoard.js
client/src/components/EnhancedGanttChart.js
client/src/components/GanttChart.js
client/src/components/TaskDetailModal.js
```

---

## Phase 2: Simplified Backend Setup (Without Amplify Gen 2 for now)

Since Amplify Gen 2 is getting stuck, let's use a simpler approach:

### Option A: Use Your Existing Express Backend

**Advantages:**
- ✅ Already built
- ✅ Works locally
- ✅ Can deploy to AWS Elastic Beanstalk or EC2
- ✅ No complex setup

**Steps:**
1. Keep using your Express server
2. Deploy it to AWS
3. Update frontend to use deployed API
4. Add JWT authentication
5. Add file upload to S3

### Option B: Use AWS Amplify Console (No CLI)

**Advantages:**
- ✅ No CLI issues
- ✅ Browser-based setup
- ✅ Visual interface
- ✅ Automatic deployment

**Steps:**
1. Go to AWS Amplify Console
2. Add backend through UI
3. Configure auth, API, storage visually
4. Deploy with one click

---

## Phase 3: Implementation Steps

### Step 1: Clean Up Mock Data

```bash
# Delete mock files
rm client/src/utils/mockData.js
rm client/src/utils/mockApi.js
```

### Step 2: Create Real API Service

**File: `client/src/services/api.js`**

```javascript
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
};

export const projectsApi = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

export const tasksApi = {
  getByProject: (projectId) => api.get(`/projects/${projectId}/tasks`),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
};

export default api;
```

### Step 3: Update AuthContext

**File: `client/src/contexts/AuthContext.js`**

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const { data } = await authApi.getProfile();
        setUser(data);
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const { data } = await authApi.login({ email, password });
      localStorage.setItem('token', data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      toast.success('Logged in successfully!');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const { data } = await authApi.register(userData);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      toast.success('Registered successfully!');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Step 4: Update Components to Use Real API

**Example: Dashboard.js**

```javascript
import { useQuery } from '@tanstack/react-query';
import { projectsApi, tasksApi } from '../services/api';

const Dashboard = () => {
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll().then(res => res.data)
  });

  const { data: tasks } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => tasksApi.getByProject('all').then(res => res.data)
  });

  // Use real data instead of mockData
  return (
    <div>
      {/* Your dashboard UI */}
    </div>
  );
};
```

---

## Phase 4: Deploy Backend to AWS

### Option 1: AWS Elastic Beanstalk (Easiest)

```bash
# Install EB CLI
pip install awsebcli

# Initialize
cd server
eb init -p node.js project-management-api

# Create environment
eb create production

# Deploy
eb deploy
```

### Option 2: AWS EC2 (More Control)

1. Launch EC2 instance
2. Install Node.js
3. Clone your repo
4. Install dependencies
5. Use PM2 to run server
6. Configure nginx as reverse proxy

### Option 3: AWS App Runner (Serverless)

1. Build Docker image
2. Push to ECR
3. Create App Runner service
4. Auto-scales and manages everything

---

## Phase 5: Environment Variables

**Create `.env` file:**

```env
# Development
REACT_APP_API_URL=http://localhost:5000/api

# Production (after deployment)
REACT_APP_API_URL=https://your-api.elasticbeanstalk.com/api
```

---

## Phase 6: File Upload (S3)

### Backend Setup:

```javascript
// server/routes/upload.js
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'your-bucket-name',
    key: function (req, file, cb) {
      cb(null, `uploads/${Date.now()}-${file.originalname}`);
    }
  })
});

router.post('/upload', upload.single('file'), (req, res) => {
  res.json({ url: req.file.location });
});
```

### Frontend:

```javascript
const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const { data } = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  
  return data.url;
};
```

---

## Recommended Approach

**I recommend Option A (Use Express Backend) because:**

1. ✅ You already have it built
2. ✅ No Amplify CLI issues
3. ✅ Full control
4. ✅ Can deploy in 30 minutes
5. ✅ Works with your existing code

**Next Steps:**

1. Clean up mock data
2. Update API service
3. Deploy Express server to AWS
4. Update frontend to use deployed API
5. Add S3 for file uploads
6. Test everything

Would you like me to proceed with this approach?
