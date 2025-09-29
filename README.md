# Project Management Application

A comprehensive full-stack project management application built with React, Node.js, Express, PostgreSQL, and WebSockets.

## Features

- **Dashboard**: Activity stream, notifications, quick actions
- **Task Management**: Projects, Kanban boards, List view with task-to-issue conversion
- **Chat System**: Channels and direct messages with real-time updates
- **File Management**: Upload, organize, and link files to tasks
- **Reports & Analytics**: Project insights and performance metrics
- **User Management**: Role-based permissions and user administration

## Tech Stack

### Frontend
- React 18
- Tailwind CSS
- React Router
- Socket.io Client
- React DnD (for Kanban)
- Lucide React (icons)

### Backend
- Node.js
- Express.js
- PostgreSQL
- Socket.io
- JWT Authentication
- Multer (file uploads)

## Quick Start

1. **Install dependencies**:
   ```bash
   npm run install-all
   ```

2. **Set up PostgreSQL database**:
   - Create a database named `project_management`
   - Update database credentials in `server/.env`

3. **Run the application**:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── utils/         # Utility functions
│   │   └── styles/        # CSS files
├── server/                # Node.js backend
│   ├── controllers/       # Route controllers
│   ├── models/           # Database models
│   ├── middleware/       # Custom middleware
│   ├── routes/           # API routes
│   └── utils/            # Utility functions
└── database/             # Database schema and seeds
```

## Default Users

- **Admin**: admin@example.com / password123
- **Manager**: manager@example.com / password123
- **Member**: member@example.com / password123

## Environment Variables

Create `.env` files in both `server/` and `client/` directories with the required environment variables (see `.env.example` files).
