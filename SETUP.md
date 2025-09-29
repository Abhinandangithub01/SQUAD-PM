# ProjectHub Setup Guide

This guide will help you set up and run the ProjectHub application locally.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **PostgreSQL** (v12 or higher) - [Download here](https://www.postgresql.org/download/)
- **Git** - [Download here](https://git-scm.com/)

## Quick Start

### 1. Clone and Install Dependencies

```bash
# Navigate to the project directory
cd ProjectManagement

# Install root dependencies
npm install

# Install all dependencies (server + client)
npm run install-all
```

### 2. Database Setup

1. **Create PostgreSQL Database:**
   ```sql
   CREATE DATABASE project_management;
   ```

2. **Set up environment variables:**
   ```bash
   # Copy environment files
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

3. **Configure server/.env:**
   ```env
   PORT=5000
   NODE_ENV=development
   
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=project_management
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   
   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
   JWT_EXPIRES_IN=7d
   
   # File Upload
   UPLOAD_PATH=uploads
   MAX_FILE_SIZE=10485760
   
   # CORS
   CLIENT_URL=http://localhost:3000
   ```

4. **Configure client/.env:**
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_SOCKET_URL=http://localhost:5000
   ```

### 3. Initialize Database

```bash
# Navigate to server directory
cd server

# Run database schema
psql -U postgres -d project_management -f ../database/schema.sql

# Seed the database with sample data
npm run seed
```

### 4. Start the Application

```bash
# From the root directory, start both server and client
npm run dev
```

The application will be available at:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

## Default User Accounts

After seeding the database, you can log in with these accounts:

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | password123 | Admin |
| manager@example.com | password123 | Project Manager |
| john@example.com | password123 | Member |
| jane@example.com | password123 | Member |
| viewer@example.com | password123 | Viewer |

## Manual Setup (Alternative)

If you prefer to set up each part manually:

### Server Setup

```bash
cd server
npm install
npm run dev
```

### Client Setup

```bash
cd client
npm install
npm start
```

## Troubleshooting

### Common Issues

1. **Database Connection Error:**
   - Ensure PostgreSQL is running
   - Check database credentials in `server/.env`
   - Verify database exists: `project_management`

2. **Port Already in Use:**
   - Change PORT in `server/.env` (default: 5000)
   - Update REACT_APP_API_URL in `client/.env` accordingly

3. **Module Not Found Errors:**
   - Run `npm run install-all` from root directory
   - Clear node_modules: `rm -rf node_modules && npm install`

4. **CORS Issues:**
   - Ensure CLIENT_URL in server/.env matches your frontend URL
   - Default should be `http://localhost:3000`

### Database Issues

If you need to reset the database:

```bash
# Drop and recreate database
psql -U postgres -c "DROP DATABASE IF EXISTS project_management;"
psql -U postgres -c "CREATE DATABASE project_management;"

# Re-run schema and seed
psql -U postgres -d project_management -f database/schema.sql
cd server && npm run seed
```

## Production Deployment

### Environment Variables

For production, update these environment variables:

**Server (.env):**
```env
NODE_ENV=production
PORT=5000
DB_HOST=your_production_db_host
DB_NAME=your_production_db_name
DB_USER=your_production_db_user
DB_PASSWORD=your_production_db_password
JWT_SECRET=your_very_secure_jwt_secret
CLIENT_URL=https://your-domain.com
```

**Client (.env):**
```env
REACT_APP_API_URL=https://your-api-domain.com/api
REACT_APP_SOCKET_URL=https://your-api-domain.com
```

### Build for Production

```bash
# Build client
cd client
npm run build

# The build folder contains the production-ready files
# Serve these files with your web server (nginx, apache, etc.)
```

## Features Overview

### ✅ Implemented Features

- **Dashboard:** Activity stream, notifications, project overview
- **Task Management:**
  - Projects with customizable Kanban boards
  - List view with bulk operations
  - Task-to-issue conversion
  - File attachments and comments
- **Real-time Chat:** Channels and direct messages
- **User Management:** Role-based permissions
- **Analytics:** Project insights and reporting
- **File Management:** Upload, organize, and link files
- **Responsive Design:** Works on desktop and mobile

### 🔧 Technical Stack

- **Frontend:** React 18, Tailwind CSS, React Query
- **Backend:** Node.js, Express.js, Socket.io
- **Database:** PostgreSQL
- **Authentication:** JWT tokens
- **Real-time:** WebSocket connections
- **File Upload:** Multer with local storage

## API Documentation

The API endpoints are organized as follows:

- **Authentication:** `/api/auth/*`
- **Users:** `/api/users/*`
- **Projects:** `/api/projects/*`
- **Tasks:** `/api/tasks/*`
- **Chat:** `/api/chat/*`
- **Files:** `/api/files/*`
- **Notifications:** `/api/notifications/*`
- **Analytics:** `/api/analytics/*`

## Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Ensure all prerequisites are installed correctly
3. Verify environment variables are set properly
4. Check console logs for specific error messages

## Next Steps

After setup, you can:

1. **Create your first project** from the dashboard
2. **Invite team members** through the settings
3. **Set up Kanban boards** with custom columns
4. **Start collaborating** with real-time chat
5. **Upload files** and link them to tasks
6. **Track progress** with analytics

Enjoy using ProjectHub! 🚀
